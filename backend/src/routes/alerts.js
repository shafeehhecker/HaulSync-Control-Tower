import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/alerts
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const where = {};
    if (status) where.status = status;

    // Operators see only their own alerts; managers see all
    if (req.user.role === 'OPERATOR') {
      where.assignedTo = req.user.id;
    }

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          exception: { select: { id:true, type:true, severity:true, shipmentId:true } },
          user:      { select: { name:true, email:true } },
        },
      }),
      prisma.alert.count({ where }),
    ]);
    res.json({ alerts, total });
  } catch (err) { next(err); }
});

// PATCH /api/alerts/:id/acknowledge
router.patch('/:id/acknowledge', requireAuth, async (req, res, next) => {
  try {
    const alert = await prisma.alert.update({
      where: { id: req.params.id },
      data:  { status: 'ACKNOWLEDGED' },
    });
    res.json(alert);
  } catch (err) { next(err); }
});

export default router;
