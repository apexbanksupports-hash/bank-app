import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

function isAdmin(req: Request, res: Response, next: Function) {
  prisma.user.findUnique({ where: { id: req.user!.userId }, select: { role: true } })
    .then(user => {
      if (user?.role === 'admin') return next();
      res.status(403).json({ error: 'Admin access required' });
    })
    .catch(() => res.status(500).json({ error: 'Server error' }));
}

router.get('/stats', authenticate, isAdmin, async (_req: Request, res: Response) => {
  const [userCount, accountCount, transferCount, pendingKycCount, totalVolume] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.account.count({ where: { isActive: true } }),
    prisma.transfer.count(),
    prisma.kycDocument.count({ where: { status: 'pending' } }),
    prisma.transfer.aggregate({ _sum: { amount: true }, where: { status: 'completed' } }),
  ]);
  res.json({ userCount, accountCount, transferCount, pendingKycCount, totalVolume: totalVolume._sum.amount || 0 });
});

router.get('/users', authenticate, isAdmin, async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, firstName: true, lastName: true, role: true, kycStatus: true, emailVerified: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
});

router.get('/users/:id', authenticate, isAdmin, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, dateOfBirth: true, address: true, role: true, kycStatus: true, emailVerified: true, isActive: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const accounts = await prisma.account.findMany({ where: { userId: user.id } });
  const transfers = await prisma.transfer.findMany({
    where: { OR: [{ senderId: user.id }, { recipientId: user.id }] },
    orderBy: { createdAt: 'desc' }, take: 20,
  });
  res.json({ ...user, accounts, transfers });
});

router.put('/users/:id/role', authenticate, isAdmin, async (req: Request, res: Response) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { role }, select: { id: true, email: true, role: true } });
  res.json(user);
});

router.put('/users/:id/toggle-active', authenticate, isAdmin, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { isActive: true } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const updated = await prisma.user.update({ where: { id: req.params.id }, data: { isActive: !user.isActive }, select: { id: true, email: true, isActive: true } });
  res.json(updated);
});

router.get('/kyc-pending', authenticate, isAdmin, async (_req: Request, res: Response) => {
  const docs = await prisma.kycDocument.findMany({
    where: { status: 'pending' },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(docs);
});

router.put('/kyc/:id/review', authenticate, isAdmin, async (req: Request, res: Response) => {
  const { status, reviewNote } = req.body;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Status must be approved or rejected' });
  const doc = await prisma.kycDocument.update({
    where: { id: req.params.id },
    data: { status, reviewedBy: req.user!.userId, reviewNote: reviewNote || null },
  });
  const allDocs = await prisma.kycDocument.findMany({ where: { userId: doc.userId } });
  const allReviewed = allDocs.every(d => d.status !== 'pending');
  const anyApproved = allDocs.some(d => d.status === 'approved');
  if (allReviewed) {
    await prisma.user.update({ where: { id: doc.userId }, data: { kycStatus: anyApproved ? 'approved' : 'rejected' } });
  }
  res.json(doc);
});

router.get('/accounts', authenticate, isAdmin, async (_req: Request, res: Response) => {
  const accounts = await prisma.account.findMany({
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(accounts);
});

router.put('/accounts/:id/balance', authenticate, isAdmin, async (req: Request, res: Response) => {
  const { amount, type } = req.body;
  if (typeof amount !== 'number' || amount <= 0) return res.status(400).json({ error: 'Amount must be a positive number' });
  if (!['add', 'subtract'].includes(type)) return res.status(400).json({ error: 'Type must be add or subtract' });

  const account = await prisma.account.findUnique({ where: { id: req.params.id } });
  if (!account) return res.status(404).json({ error: 'Account not found' });

  if (type === 'subtract' && account.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

  const updated = await prisma.account.update({
    where: { id: req.params.id },
    data: { balance: type === 'add' ? { increment: amount } : { decrement: amount } },
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });

  await prisma.transfer.create({
    data: {
      senderId: type === 'add' ? req.user!.userId : account.userId,
      recipientId: type === 'subtract' ? req.user!.userId : account.userId,
      amount,
      description: `Admin ${type === 'add' ? 'deposit' : 'withdrawal'} — ${account.accountNumber}`,
      referenceNumber: `ADM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      status: 'completed',
    },
  });

  res.json(updated);
});

router.get('/transactions', authenticate, isAdmin, async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const [transfers, total] = await Promise.all([
    prisma.transfer.findMany({
      skip, take: limit,
      include: { sender: { select: { firstName: true, lastName: true, email: true } }, recipient: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transfer.count(),
  ]);
  res.json({ transfers, total, page, pages: Math.ceil(total / limit) });
});

export default router;
