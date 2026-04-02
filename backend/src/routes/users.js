import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/users
router.get('/', requireAuth, requireRole('SUPER_ADMIN','ADMIN','CONTROL_TOWER_MANAGER'), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id:true, name:true, email:true, role:true, active:true, createdAt:true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(users);
  } catch (err) { next(err); }
});

// POST /api/users
router.post('/', requireAuth, requireRole('SUPER_ADMIN','ADMIN'), async (req, res, next) => {
  try {
    const { name, email, password, role = 'OPERATOR' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'name, email and password are required' });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already in use' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role },
      select: { id:true, name:true, email:true, role:true, active:true },
    });
    res.status(201).json(user);
  } catch (err) { next(err); }
});

// PATCH /api/users/:id
router.patch('/:id', requireAuth, requireRole('SUPER_ADMIN','ADMIN'), async (req, res, next) => {
  try {
    const { name, role, active, password } = req.body;
    const data = {};
    if (name !== undefined)   data.name   = name;
    if (role !== undefined)   data.role   = role;
    if (active !== undefined) data.active = active;
    if (password)             data.password = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where:  { id: req.params.id },
      data,
      select: { id:true, name:true, email:true, role:true, active:true },
    });
    res.json(user);
  } catch (err) { next(err); }
});

// DELETE /api/users/:id
router.delete('/:id', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ message: 'Cannot delete your own account' });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
