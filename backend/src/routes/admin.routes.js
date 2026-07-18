import express from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.middleware.js';
import { validateAuthInput } from '../utils/validation.js';

const router = express.Router();
const prisma = new PrismaClient();

// All routes require ADMIN role
router.use(protect(['ADMIN']));

// ── Pagination helpers ────────────────────────────────────────────────────────
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE     = 100;

function parsePagination(query) {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.limit) || DEFAULT_PAGE_SIZE));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
}

function paginatedResponse(data, total, page, limit) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    const [totalUsers, totalStores, totalRatings] = await Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.rating.count(),
    ]);
    res.json({ totalUsers, totalStores, totalRatings });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving dashboard statistics.' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { name, email, address, role, sortBy, order } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const where = {};
    if (role)    where.role    = role;
    if (name)    where.name    = { contains: name,    mode: 'insensitive' };
    if (email)   where.email   = { contains: email,   mode: 'insensitive' };
    if (address) where.address = { contains: address, mode: 'insensitive' };

    const allowedSortFields = ['name', 'email', 'address', 'role', 'createdAt'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderBy = { [orderField]: order === 'desc' ? 'desc' : 'asc' };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          address: true,
          role: true,
          store: {
            select: { ratings: { select: { score: true } } },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const formatted = users.map(({ id, name, email, address, role, store }) => {
      let rating = null;
      if (role === 'OWNER' && store?.ratings?.length) {
        const avg = store.ratings.reduce((sum, r) => sum + r.score, 0) / store.ratings.length;
        rating = avg.toFixed(1);
      }
      return { id, name, email, address, role, rating };
    });

    res.json(paginatedResponse(formatted, total, page, limit));
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving users.' });
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        store: {
          select: { ratings: { select: { score: true } } },
        },
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found.' });

    let rating = null;
    if (user.role === 'OWNER' && user.store?.ratings?.length) {
      const avg = user.store.ratings.reduce((sum, r) => sum + r.score, 0) / user.store.ratings.length;
      rating = avg.toFixed(1);
    }

    res.json({ id: user.id, name: user.name, email: user.email, address: user.address, role: user.role, rating });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving user.' });
  }
});

// POST /api/admin/users
router.post('/users', async (req, res) => {
  try {
    const { name, email, address, password, role } = req.body;

    const { isValid, errors } = validateAuthInput({ name, email, address, password }, true);
    if (!isValid) return res.status(400).json({ errors });

    if (!['ADMIN', 'USER', 'OWNER'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already registered.' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, address, password: hashedPassword, role },
    });

    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user.' });
  }
});

// GET /api/admin/stores
//
// Sorting fix (v4): rating is a *computed* column. Sorting after Prisma's
// skip/take previously only sorted the current page. We now compute the
// average for every matching store in one groupBy call, then sort, then
// paginate the sorted list — so page 2 sorted by rating actually contains
// the next-highest-rated stores.
router.get('/stores', async (req, res) => {
  try {
    const { name, email, address, sortBy, order } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const where = {};
    if (name)    where.name    = { contains: name,    mode: 'insensitive' };
    if (email)   where.email   = { contains: email,   mode: 'insensitive' };
    if (address) where.address = { contains: address, mode: 'insensitive' };

    // 1. All matching stores (base scalars only — cheap).
    const stores = await prisma.store.findMany({
      where,
      select: { id: true, name: true, email: true, address: true },
    });

    // 2. One groupBy across all rating rows for the matching stores → avg per store.
    const storeIds = stores.map(s => s.id);
    const grouped = storeIds.length
      ? await prisma.rating.groupBy({
          by: ['storeId'],
          where: { storeId: { in: storeIds } },
          _avg: { score: true },
          _count: { score: true },
        })
      : [];

    const ratingByStore = Object.fromEntries(
      grouped.map(g => [g.storeId, { avg: g._avg.score ?? 0, count: g._count.score }])
    );

    // 3. Merge, sort, then paginate.
    const merged = stores.map(s => {
      const r = ratingByStore[s.id];
      return {
        id: s.id,
        name: s.name,
        email: s.email,
        address: s.address,
        rating: (r?.avg ?? 0).toFixed(1),
        totalRatings: r?.count ?? 0,
      };
    });

    const allowedSort = ['name', 'email', 'address', 'rating', 'totalRatings'];
    const sortField   = allowedSort.includes(sortBy) ? sortBy : 'name';
    const desc        = order === 'desc';

    merged.sort((a, b) => {
      let av = a[sortField];
      let bv = b[sortField];
      if (sortField === 'rating' || sortField === 'totalRatings') {
        av = parseFloat(av);
        bv = parseFloat(bv);
      }
      if (av < bv) return desc ? 1 : -1;
      if (av > bv) return desc ? -1 : 1;
      return 0;
    });

    const total = merged.length;
    const paged = merged.slice(skip, skip + limit);

    res.json(paginatedResponse(paged, total, page, limit));
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving stores.' });
  }
});

// POST /api/admin/stores
router.post('/stores', async (req, res) => {
  try {
    const { name, email, address, ownerId } = req.body;

    if (!name || !email || !address || !ownerId) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const owner = await prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner || owner.role !== 'OWNER') {
      return res.status(400).json({ message: 'Provided ID must belong to a user with the OWNER role.' });
    }

    const store = await prisma.store.create({ data: { name, email, address, ownerId } });
    res.status(201).json(store);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Store email or owner ID is already linked to another store.' });
    }
    res.status(500).json({ message: 'Error creating store.' });
  }
});

export default router;
