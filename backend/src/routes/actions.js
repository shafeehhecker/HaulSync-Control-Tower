import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/actions
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const [actions, total] = await Promise.all([
      prisma.action.findMany({
        orderBy: { takenAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          takenBy:   { select: { name:true, email:true } },
          exception: { select: { id:true, type:true, shipmentId:true } },
        },
      }),
      prisma.action.count(),
    ]);
    res.json({ actions, total });
  } catch (err) { next(err); }
});

// POST /api/actions — log an action on an exception
router.post('/', requireAuth, requireRole('SUPER_ADMIN','ADMIN','CONTROL_TOWER_MANAGER','OPERATOR'), async (req, res, next) => {
  try {
    const { exceptionId, actionType, note, resolve } = req.body;
    if (!exceptionId || !actionType) {
      return res.status(400).json({ message: 'exceptionId and actionType are required' });
    }

    const action = await prisma.action.create({
      data: {
        exceptionId,
        takenById:  req.user.id,
        actionType,
        note:       note || null,
        resolvedAt: resolve ? new Date() : null,
      },
    });

    // If resolve flag set, close the exception
    if (resolve) {
      await prisma.exception.update({
        where: { id: exceptionId },
        data:  { status: 'RESOLVED', resolvedAt: new Date() },
      });
      await prisma.alert.updateMany({
        where: { exceptionId, status: { not: 'RESOLVED' } },
        data:  { status: 'RESOLVED', resolvedAt: new Date() },
      });
    }

    res.status(201).json(action);
  } catch (err) { next(err); }
});

export default router;
