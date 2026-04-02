import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/exceptions
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status, type, severity, page = 1, limit = 50 } = req.query;
    const where = {};
    if (status)   where.status   = status;
    if (type)     where.type     = type;
    if (severity) where.severity = severity;

    const [exceptions, total] = await Promise.all([
      prisma.exception.findMany({
        where,
        orderBy: [{ severity: 'desc' }, { raisedAt: 'desc' }],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          shipment: { select: { id:true, reference:true, transporterName:true, source:true } },
          alerts:   { select: { id:true, status:true, channel:true } },
        },
      }),
      prisma.exception.count({ where }),
    ]);
    res.json({ exceptions, total });
  } catch (err) { next(err); }
});

// GET /api/exceptions/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const ex = await prisma.exception.findUnique({
      where:   { id: req.params.id },
      include: {
        shipment: true,
        alerts:   { include: { user: { select: { name:true, email:true } } } },
        actions:  { include: { takenBy: { select: { name:true, email:true } } }, orderBy: { takenAt: 'desc' } },
      },
    });
    if (!ex) return res.status(404).json({ message: 'Exception not found' });
    res.json(ex);
  } catch (err) { next(err); }
});

// PATCH /api/exceptions/:id — update status
router.patch('/:id', requireAuth, requireRole('SUPER_ADMIN','ADMIN','CONTROL_TOWER_MANAGER','OPERATOR'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['ACKNOWLEDGED','ESCALATED','RESOLVED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${validStatuses.join(', ')}` });
    }
    const ex = await prisma.exception.update({
      where: { id: req.params.id },
      data:  {
        status,
        ...(status === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
      },
    });
    res.json(ex);
  } catch (err) { next(err); }
});

export default router;
