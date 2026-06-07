import { PrismaClient } from '@prisma/client';
import { generateReferenceNumber } from '../utils/reference';

const prisma = new PrismaClient();

export async function createScheduledTransfer(userId: string, data: {
  recipientAccountNumber: string;
  amount: number;
  description?: string;
  frequency: string;
  nextRunDate: string;
  endDate?: string;
  maxRuns?: number;
  senderAccountId: string;
}) {
  const senderAccount = await prisma.account.findFirst({
    where: { id: data.senderAccountId, userId, isActive: true },
  });
  if (!senderAccount) throw new Error('Sender account not found');

  const recipientAccount = await prisma.account.findUnique({
    where: { accountNumber: data.recipientAccountNumber },
  });
  if (!recipientAccount) throw new Error('Recipient account not found');
  if (recipientAccount.userId === userId) throw new Error('Cannot schedule transfer to own account');

  const scheduled = await prisma.scheduledTransfer.create({
    data: {
      senderId: userId,
      recipientId: recipientAccount.userId,
      amount: data.amount,
      description: data.description || 'Scheduled transfer',
      frequency: data.frequency,
      nextRunDate: new Date(data.nextRunDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      maxRuns: data.maxRuns || null,
      senderAccountId: data.senderAccountId,
    },
    include: {
      recipient: { select: { firstName: true, lastName: true } },
    },
  });

  return scheduled;
}

export async function getUserScheduledTransfers(userId: string) {
  return prisma.scheduledTransfer.findMany({
    where: { senderId: userId, isActive: true },
    include: {
      recipient: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { nextRunDate: 'asc' },
  });
}

export async function updateScheduledTransfer(id: string, userId: string, data: any) {
  const existing = await prisma.scheduledTransfer.findFirst({ where: { id, senderId: userId } });
  if (!existing) throw new Error('Scheduled transfer not found');

  return prisma.scheduledTransfer.update({
    where: { id },
    data: {
      amount: data.amount ?? undefined,
      description: data.description ?? undefined,
      frequency: data.frequency ?? undefined,
      nextRunDate: data.nextRunDate ? new Date(data.nextRunDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : data.endDate === null ? null : undefined,
      maxRuns: data.maxRuns ?? undefined,
    },
  });
}

export async function cancelScheduledTransfer(id: string, userId: string) {
  const existing = await prisma.scheduledTransfer.findFirst({ where: { id, senderId: userId } });
  if (!existing) throw new Error('Scheduled transfer not found');
  await prisma.scheduledTransfer.update({ where: { id }, data: { isActive: false } });
}

export async function processDueTransfers() {
  const due = await prisma.scheduledTransfer.findMany({
    where: {
      isActive: true,
      nextRunDate: { lte: new Date() },
      AND: [
        { OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
        { OR: [{ maxRuns: null }, { runCount: { lt: prisma.scheduledTransfer.fields.maxRuns } }] },
      ],
    },
    include: {
      sender: { select: { id: true } },
      recipient: { select: { id: true } },
    },
  });

  for (const sched of due) {
    try {
      const sendAccount = await prisma.account.findFirst({
        where: { userId: sched.senderId, isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      const recvAccount = await prisma.account.findFirst({
        where: { userId: sched.recipientId, isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!sendAccount || !recvAccount) continue;
      if (sendAccount.balance < sched.amount) continue;

      const ref = generateReferenceNumber();
      await prisma.$transaction(async (tx) => {
        await tx.account.update({ where: { id: sendAccount.id }, data: { balance: { decrement: sched.amount } } });
        await tx.account.update({ where: { id: recvAccount.id }, data: { balance: { increment: sched.amount } } });
        await tx.transfer.create({
          data: {
            senderId: sched.senderId, recipientId: sched.recipientId,
            amount: sched.amount, currency: sched.currency,
            description: sched.description || 'Scheduled transfer',
            referenceNumber: ref, status: 'completed',
            senderAccountId: sendAccount.id, recipientAccountId: recvAccount.id,
          },
        });
        const nextDate = calculateNextRun(sched.nextRunDate, sched.frequency);
        await tx.scheduledTransfer.update({
          where: { id: sched.id },
          data: { lastRunDate: new Date(), nextRunDate: nextDate, runCount: { increment: 1 } },
        });
      });
    } catch (err) {
      console.error(`Failed to process scheduled transfer ${sched.id}:`, err);
    }
  }
}

function calculateNextRun(current: Date, frequency: string): Date {
  const next = new Date(current);
  switch (frequency) {
    case 'daily': next.setDate(next.getDate() + 1); break;
    case 'weekly': next.setDate(next.getDate() + 7); break;
    case 'biweekly': next.setDate(next.getDate() + 14); break;
    case 'monthly': next.setMonth(next.getMonth() + 1); break;
    default: next.setFullYear(next.getFullYear() + 100);
  }
  return next;
}
