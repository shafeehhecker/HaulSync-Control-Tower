import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/analytics/summary
router.get('/summary', requireAuth, async (req, res, next) => {
  try {
    const [
      activeShipments,
      openExceptions,
      pendingAlerts,
      resolvedToday,
      slaAtRisk,
    ] = await Promise.all([
      prisma.shipment.count({ where: { status: { not: 'DELIVERED' } } }),
      prisma.exception.count({ where: { status: { not: 'RESOLVED' } } }),
      prisma.alert.count({ where: { status: 'PENDING' } }),
      prisma.exception.count({
        where: {
          status: 'RESOLVED',
          resolvedAt: { gte: new Date(new Date().setHours(0,0,0,0)) },
        },
      }),
      prisma.exception.count({ where: { type: 'SLA_BREACH_RISK', status: { not: 'RESOLVED' } } }),
    ]);

    res.json({ activeShipments, openExceptions, pendingAlerts, resolvedToday, slaAtRisk });
  } catch (err) { next(err); }
});

// GET /api/analytics/exception-trend?days=7
router.get('/exception-trend', requireAuth, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '7');
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);

    const exceptions = await prisma.exception.findMany({
      where:  { raisedAt: { gte: since } },
      select: { raisedAt: true, status: true },
    });

    // Group by day
    const map = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - i * 24 * 3600 * 1000);
      const key = d.toISOString().slice(0, 10);
      map[key] = { date: key, exceptions: 0, resolved: 0 };
    }
    for (const ex of exceptions) {
      const key = ex.raisedAt.toISOString().slice(0, 10);
      if (map[key]) {
        map[key].exceptions++;
        if (ex.status === 'RESOLVED') map[key].resolved++;
      }
    }
    res.json(Object.values(map).reverse());
  } catch (err) { next(err); }
});

// GET /api/analytics/exception-types
router.get('/exception-types', requireAuth, async (req, res, next) => {
  try {
    const groups = await prisma.exception.groupBy({
      by:    ['type'],
      _count:{ id: true },
    });
    res.json(groups.map(g => ({ type: g.type, count: g._count.id })));
  } catch (err) { next(err); }
});

// GET /api/analytics/transporter-perf
router.get('/transporter-perf', requireAuth, async (req, res, next) => {
  try {
    const shipments = await prisma.shipment.findMany({
      select: { transporterName:true, status:true },
      where:  { transporterName: { not: null } },
    });

    const map = {};
    for (const s of shipments) {
      const t = s.transporterName;
      if (!map[t]) map[t] = { name: t, total: 0, delivered: 0, exceptions: 0 };
      map[t].total++;
      if (s.status === 'DELIVERED') map[t].delivered++;
    }

    const exceptions = await prisma.exception.findMany({
      include: { shipment: { select: { transporterName: true } } },
    });
    for (const ex of exceptions) {
      const t = ex.shipment?.transporterName;
      if (t && map[t]) map[t].exceptions++;
    }

    const result = Object.values(map).map(t => ({
      ...t,
      onTimeRate: t.total > 0 ? Math.round((t.delivered / t.total) * 100) : 0,
    }));
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
