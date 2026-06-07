import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().default('📦'),
  color: z.string().default('#6B7280'),
});

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

router.get('/', authenticate, async (req: Request, res: Response) => {
  const cats = await prisma.transactionCategory.findMany({
    where: { userId: req.user!.userId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { transfers: true } } },
  });
  res.json(cats);
});

router.post('/', authenticate, validate(createSchema), async (req: Request, res: Response) => {
  const existing = await prisma.transactionCategory.findFirst({
    where: { userId: req.user!.userId, name: req.body.name },
  });
  if (existing) return res.status(400).json({ error: 'Category already exists' });
  const cat = await prisma.transactionCategory.create({
    data: { ...req.body, userId: req.user!.userId },
  });
  res.status(201).json(cat);
});

router.put('/:id', authenticate, async (req: Request, res: Response) => {
  const cat = await prisma.transactionCategory.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const updated = await prisma.transactionCategory.update({
    where: { id: req.params.id },
    data: { name: req.body.name ?? undefined, icon: req.body.icon ?? undefined, color: req.body.color ?? undefined },
  });
  res.json(updated);
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const cat = await prisma.transactionCategory.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  await prisma.transfer.updateMany({ where: { categoryId: req.params.id }, data: { categoryId: null } });
  await prisma.transactionCategory.delete({ where: { id: req.params.id } });
  res.json({ message: 'Category deleted' });
});

router.put('/transfer/:transferId/category', authenticate, validate(z.object({ categoryId: z.string().nullable() })), async (req: Request, res: Response) => {
  const transfer = await prisma.transfer.findFirst({
    where: { id: req.params.transferId, OR: [{ senderId: req.user!.userId }, { recipientId: req.user!.userId }] },
  });
  if (!transfer) return res.status(404).json({ error: 'Transfer not found' });
  await prisma.transfer.update({
    where: { id: req.params.transferId },
    data: { categoryId: req.body.categoryId },
  });
  res.json({ message: 'Category updated' });
});

export default router;
