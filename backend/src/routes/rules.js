import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/rules
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const rules = await prisma.alertRule.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(rules);
  } catch (err) { next(err); }
});

// POST /api/rules
router.post('/', requireAuth, requireRole('SUPER_ADMIN','ADMIN','CONTROL_TOWER_MANAGER'), async (req, res, next) => {
  try {
    const {
      exceptionType, source = '*',
      triggerAfterMinutes = 0, notifyRoles = [],
      escalateAfterMinutes = 60, escalateToRoles = [],
      channels = ['IN_APP'], autoResolveOnMovement = false,
    } = req.body;
    if (!exceptionType) return res.status(400).json({ message: 'exceptionType is required' });
    const rule = await prisma.alertRule.create({
      data: { exceptionType, source, triggerAfterMinutes, notifyRoles, escalateAfterMinutes, escalateToRoles, channels, autoResolveOnMovement },
    });
    res.status(201).json(rule);
  } catch (err) { next(err); }
});

// PATCH /api/rules/:id
router.patch('/:id', requireAuth, requireRole('SUPER_ADMIN','ADMIN','CONTROL_TOWER_MANAGER'), async (req, res, next) => {
  try {
    const rule = await prisma.alertRule.update({ where: { id: req.params.id }, data: req.body });
    res.json(rule);
  } catch (err) { next(err); }
});

// DELETE /api/rules/:id
router.delete('/:id', requireAuth, requireRole('SUPER_ADMIN','ADMIN'), async (req, res, next) => {
  try {
    await prisma.alertRule.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
