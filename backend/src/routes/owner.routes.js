import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.middleware.js';
import { changeUserPassword } from '../utils/changePassword.js';

const router = express.Router();
const prisma = new PrismaClient();

// All routes require OWNER role
router.use(protect(['OWNER']));

// GET /api/owner/store  — owner's store info + ratings
router.get('/store', async (req, res) => {
  try {
    const store = await prisma.store.findUnique({
      where: { ownerId: req.user.id },
      include: {
        ratings: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!store) return res.status(404).json({ message: 'No store found for this owner.' });

    const avgRating =
      store.ratings.length
        ? store.ratings.reduce((sum, r) => sum + r.score, 0) / store.ratings.length
        : 0;

    res.json({
      id: store.id,
      name: store.name,
      email: store.email,
      address: store.address,
      avgRating: avgRating.toFixed(1),
      totalRatings: store.ratings.length,
      ratings: store.ratings.map(r => ({
        id: r.id,
        score: r.score,
        updatedAt: r.updatedAt,
        user: r.user,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching store data.' });
  }
});

// PUT /api/owner/change-password  { currentPassword, newPassword }
router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await changeUserPassword(prisma, req.user.id, currentPassword, newPassword);
    res.status(result.status).json(result.body);
  } catch (error) {
    res.status(500).json({ message: 'Error changing password.' });
  }
});

export default router;
