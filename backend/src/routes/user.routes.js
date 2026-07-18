import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.middleware.js';
import { changeUserPassword } from '../utils/changePassword.js';

const router = express.Router();
const prisma = new PrismaClient();

// Store browsing + password change are available to any authenticated role.
// Rating submission is restricted to normal USERs (see per-route guard below),
// because per spec only normal users submit ratings — owners and admins
// shouldn't be able to rate stores.
const anyAuth = protect(['USER', 'OWNER', 'ADMIN']);
const userOnly = protect(['USER']);

// ── Pagination helpers ────────────────────────────────────────────────────────
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE     = 100;

function parsePagination(query) {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.limit) || DEFAULT_PAGE_SIZE));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
}

// GET /api/user/stores
//
// Sorting fix (v4): avgRating / totalRatings are computed fields. In v3 we
// were sorting AFTER Prisma paginated, which only sorted the current page.
// Now we aggregate ratings across all matching stores in a single groupBy,
// then sort, then paginate — so ranking is consistent across pages.
router.get('/stores', anyAuth, async (req, res) => {
  try {
    const { search, sortBy, order } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const where = search
      ? {
          OR: [
            { name:    { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    // 1. All matching stores.
    const stores = await prisma.store.findMany({
      where,
      select: { id: true, name: true, email: true, address: true },
    });

    if (stores.length === 0) {
      return res.json({
        data: [],
        pagination: { total: 0, page, limit, totalPages: 1 },
      });
    }

    const storeIds = stores.map(s => s.id);

    // 2. Aggregate ratings for those stores in one query.
    const [grouped, userRatings] = await Promise.all([
      prisma.rating.groupBy({
        by: ['storeId'],
        where: { storeId: { in: storeIds } },
        _avg: { score: true },
        _count: { score: true },
      }),
      prisma.rating.findMany({
        where: { storeId: { in: storeIds }, userId: req.user.id },
        select: { storeId: true, score: true },
      }),
    ]);

    const aggByStore  = Object.fromEntries(
      grouped.map(g => [g.storeId, { avg: g._avg.score ?? 0, count: g._count.score }])
    );
    const userByStore = Object.fromEntries(userRatings.map(r => [r.storeId, r.score]));

    // 3. Merge into full result set.
    const merged = stores.map(({ id, name, email, address }) => {
      const agg = aggByStore[id];
      return {
        id,
        name,
        email,
        address,
        avgRating: (agg?.avg ?? 0).toFixed(1),
        totalRatings: agg?.count ?? 0,
        userRating: userByStore[id] ?? null,
      };
    });

    // 4. Sort — allow-list of fields to keep the client honest.
    const allowedSort = ['name', 'email', 'address', 'avgRating', 'totalRatings'];
    const sortField   = allowedSort.includes(sortBy) ? sortBy : 'name';
    const desc        = order === 'desc';

    merged.sort((a, b) => {
      let av = a[sortField];
      let bv = b[sortField];
      if (sortField === 'avgRating' || sortField === 'totalRatings') {
        av = parseFloat(av);
        bv = parseFloat(bv);
      }
      if (av < bv) return desc ? 1 : -1;
      if (av > bv) return desc ? -1 : 1;
      return 0;
    });

    // 5. Slice for pagination.
    const total = merged.length;
    const paged = merged.slice(skip, skip + limit);

    res.json({
      data: paged,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error('GET /user/stores failed:', error);
    res.status(500).json({ message: 'Error fetching stores.' });
  }
});

// POST /api/user/ratings  { storeId, score }
//
// v4: uses upsert so "submit" is idempotent. If the user has already rated
// the store, this behaves as an update, which matches the spec's "Option to
// submit a rating / Option to modify their submitted rating" — a single
// action for the client, no need to know which HTTP verb to use.
router.post('/ratings', userOnly, async (req, res) => {
  try {
    const { storeId, score } = req.body;
    const parsed = parseInt(score);

    if (!storeId || !Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
      return res.status(400).json({ message: 'A valid storeId and score (1–5) are required.' });
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return res.status(404).json({ message: 'Store not found.' });

    const rating = await prisma.rating.upsert({
      where:  { userId_storeId: { userId: req.user.id, storeId } },
      create: { score: parsed, userId: req.user.id, storeId },
      update: { score: parsed },
    });

    res.status(201).json(rating);
  } catch (error) {
    res.status(500).json({ message: 'Error submitting rating.' });
  }
});

// PUT /api/user/ratings/:storeId  { score }
//
// Kept for backwards-compat with any client that still uses PUT explicitly.
// Same upsert semantics as POST above.
router.put('/ratings/:storeId', userOnly, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { score } = req.body;
    const parsed = parseInt(score);

    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
      return res.status(400).json({ message: 'A valid score (1–5) is required.' });
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return res.status(404).json({ message: 'Store not found.' });

    const rating = await prisma.rating.upsert({
      where:  { userId_storeId: { userId: req.user.id, storeId } },
      create: { score: parsed, userId: req.user.id, storeId },
      update: { score: parsed },
    });

    res.json(rating);
  } catch (error) {
    res.status(500).json({ message: 'Error updating rating.' });
  }
});

// PUT /api/user/change-password  { currentPassword, newPassword }
router.put('/change-password', anyAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await changeUserPassword(prisma, req.user.id, currentPassword, newPassword);
    res.status(result.status).json(result.body);
  } catch (error) {
    res.status(500).json({ message: 'Error changing password.' });
  }
});

export default router;
