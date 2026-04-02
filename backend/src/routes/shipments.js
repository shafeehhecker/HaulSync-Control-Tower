import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/shipments — live feed with optional filters
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status, source, search, page = 1, limit = 50 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (source) where.source = source;
    if (search) {
      where.OR = [
        { reference:     { contains: search, mode: 'insensitive' } },
        { transporterName:{ contains: search, mode: 'insensitive' } },
        { originName:    { contains: search, mode: 'insensitive' } },
        { destName:      { contains: search, mode: 'insensitive' } },
      ];
    }
    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip:    (parseInt(page) - 1) * parseInt(limit),
        take:    parseInt(limit),
        include: {
          exceptions: { where: { status: { not: 'RESOLVED' } }, select: { id:true, type:true, severity:true } },
        },
      }),
      prisma.shipment.count({ where }),
    ]);
    res.json({ shipments, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
});

// GET /api/shipments/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where:   { id: req.params.id },
      include: {
        events:     { orderBy: { occurredAt: 'desc' }, take: 20 },
        exceptions: { orderBy: { raisedAt: 'desc' } },
      },
    });
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    res.json(shipment);
  } catch (err) { next(err); }
});

export default router;
