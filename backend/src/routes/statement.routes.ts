import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req: Request, res: Response) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const userId = req.user!.userId;

  const [accounts, monthlyTransfers, allTimeTransfers] = await Promise.all([
    prisma.account.findMany({ where: { userId, isActive: true } }),
    prisma.transfer.findMany({
      where: {
        OR: [{ senderId: userId }, { recipientId: userId }],
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transfer.aggregate({
      where: {
        OR: [{ senderId: userId }, { recipientId: userId }],
        status: 'completed',
      },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalSent = monthlyTransfers.filter(t => t.senderId === userId).reduce((s, t) => s + t.amount, 0);
  const totalReceived = monthlyTransfers.filter(t => t.recipientId === userId).reduce((s, t) => s + t.amount, 0);
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  res.json({
    period: { start: startOfMonth, end: endOfMonth },
    accounts: accounts.map(a => ({ accountNumber: a.accountNumber, type: a.accountType, balance: a.balance, currency: a.currency })),
    summary: { totalBalance, totalSent, totalReceived, netFlow: totalReceived - totalSent, transactionCount: monthlyTransfers.length },
    allTime: { totalVolume: allTimeTransfers._sum.amount || 0, totalTransactions: allTimeTransfers._count },
    recentTransactions: monthlyTransfers.slice(0, 10),
  });
});

router.get('/range', authenticate, async (req: Request, res: Response) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'start and end dates required' });

  const userId = req.user!.userId;
  const transfers = await prisma.transfer.findMany({
    where: {
      OR: [{ senderId: userId }, { recipientId: userId }],
      createdAt: { gte: new Date(start as string), lte: new Date(end as string) },
    },
    include: {
      sender: { select: { firstName: true, lastName: true } },
      recipient: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(transfers);
});

export default router;
