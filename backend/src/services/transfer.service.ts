import { PrismaClient } from '@prisma/client';
import { generateReferenceNumber } from '../utils/reference';
import { sendTransferReceipt } from './email.service';
import { notifyTransferSent } from './notification.service';

const prisma = new PrismaClient();

export async function sendMoney(data: {
  senderId: string;
  recipientAccountNumber: string;
  amount: number;
  description?: string;
  senderAccountId: string;
  categoryId?: string | null;
}) {
  if (data.amount <= 0) throw new Error('Amount must be greater than zero');

  const senderAccount = await prisma.account.findFirst({
    where: { id: data.senderAccountId, userId: data.senderId, isActive: true },
  });
  if (!senderAccount) throw new Error('Sender account not found');
  if (senderAccount.balance < data.amount) throw new Error('Insufficient funds');

  const recipientAccount = await prisma.account.findUnique({
    where: { accountNumber: data.recipientAccountNumber },
    include: { user: true },
  });
  if (!recipientAccount) throw new Error('Recipient account not found');
  if (recipientAccount.userId === data.senderId) throw new Error('Cannot send money to your own account');

  const referenceNumber = generateReferenceNumber();

  const transfer = await prisma.$transaction(async (tx) => {
    await tx.account.update({
      where: { id: senderAccount.id },
      data: { balance: { decrement: data.amount } },
    });
    await tx.account.update({
      where: { id: recipientAccount.id },
      data: { balance: { increment: data.amount } },
    });
    return tx.transfer.create({
      data: {
        senderId: data.senderId,
        recipientId: recipientAccount.userId,
        amount: data.amount,
        description: data.description || 'Money transfer',
        referenceNumber,
        status: 'completed',
        senderAccountId: senderAccount.id,
        recipientAccountId: recipientAccount.id,
        categoryId: data.categoryId || null,
      },
      include: {
        sender: { select: { firstName: true, lastName: true, email: true } },
        recipient: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  });

  try { await sendTransferReceipt(transfer); } catch (err) { console.error('Email failed:', err); }
  try { await notifyTransferSent(transfer); } catch (err) { console.error('Notification failed:', err); }

  return transfer;
}

export async function reverseTransfer(transferId: string, userId: string) {
  const original = await prisma.transfer.findUnique({
    where: { id: transferId },
    include: { sender: { select: { firstName: true, lastName: true, email: true } }, recipient: { select: { firstName: true, lastName: true, email: true } } },
  });

  if (!original) throw new Error('Transfer not found');
  if (original.senderId !== userId) throw new Error('Only the sender can reverse a transfer');
  if (original.status !== 'completed') throw new Error('Transfer cannot be reversed');
  if (original.reversedFromId) throw new Error('This is already a reversal');
  if (original.amount <= 0) throw new Error('Invalid transfer amount');

  const now = new Date();
  const hoursDiff = (now.getTime() - new Date(original.createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursDiff > 72) throw new Error('Reversal window has expired (72 hours)');

  const ref = generateReferenceNumber();

  const reversal = await prisma.$transaction(async (tx) => {
    const senderAcc = await tx.account.findFirst({ where: { userId: original.recipientId, isActive: true } });
    const recipientAcc = await tx.account.findFirst({ where: { userId: original.senderId, isActive: true } });
    if (!senderAcc || !recipientAcc) throw new Error('Accounts not found');
    if (senderAcc.balance < original.amount) throw new Error('Recipient has insufficient funds for reversal');

    await tx.account.update({ where: { id: senderAcc.id }, data: { balance: { decrement: original.amount } } });
    await tx.account.update({ where: { id: recipientAcc.id }, data: { balance: { increment: original.amount } } });

    await tx.transfer.update({ where: { id: original.id }, data: { status: 'reversed' } });

    return tx.transfer.create({
      data: {
        senderId: original.recipientId,
        recipientId: original.senderId,
        amount: original.amount,
        currency: original.currency,
        description: `Reversal: ${original.referenceNumber}`,
        referenceNumber: ref,
        status: 'completed',
        senderAccountId: senderAcc.id,
        recipientAccountId: recipientAcc.id,
        reversedFromId: original.id,
      },
      include: {
        sender: { select: { firstName: true, lastName: true, email: true } },
        recipient: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  });

  try { await sendTransferReceipt(reversal); } catch (err) { console.error('Email failed:', err); }

  return reversal;
}

export async function getTransferHistory(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  const [transfers, total] = await Promise.all([
    prisma.transfer.findMany({
      where: { OR: [{ senderId: userId }, { recipientId: userId }] },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, email: true } },
        recipient: { select: { id: true, firstName: true, lastName: true, email: true } },
        category: { select: { id: true, name: true, icon: true, color: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    prisma.transfer.count({ where: { OR: [{ senderId: userId }, { recipientId: userId }] } }),
  ]);
  return { transfers, total, page, pages: Math.ceil(total / limit) };
}

export async function getTransferByReference(referenceNumber: string, userId: string) {
  const transfer = await prisma.transfer.findFirst({
    where: { referenceNumber },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, email: true } },
      recipient: { select: { id: true, firstName: true, lastName: true, email: true } },
      category: { select: { id: true, name: true, icon: true, color: true } },
      reversedFrom: { select: { referenceNumber: true, amount: true } },
      reversals: { select: { referenceNumber: true, amount: true, createdAt: true } },
    },
  });
  if (!transfer) throw new Error('Transfer not found');
  if (transfer.senderId !== userId && transfer.recipientId !== userId) throw new Error('Access denied');
  return transfer;
}

export async function getDailyLimit(userId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayTransfers = await prisma.transfer.findMany({
    where: { senderId: userId, status: 'completed', createdAt: { gte: todayStart } },
    select: { amount: true },
  });

  const dailyUsed = todayTransfers.reduce((sum, t) => sum + t.amount, 0);
  const dailyLimit = 10000;

  return { dailyLimit, dailyUsed, dailyRemaining: Math.max(0, dailyLimit - dailyUsed) };
}

export async function getAccountTransfers(accountId: string, userId: string, page: number = 1, limit: number = 20) {
  const account = await prisma.account.findFirst({ where: { id: accountId, userId, isActive: true } });
  if (!account) throw new Error('Account not found');

  const skip = (page - 1) * limit;
  const [transfers, total] = await Promise.all([
    prisma.transfer.findMany({
      where: { OR: [{ senderAccountId: accountId }, { recipientAccountId: accountId }] },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, email: true } },
        recipient: { select: { id: true, firstName: true, lastName: true, email: true } },
        category: { select: { id: true, name: true, icon: true, color: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    prisma.transfer.count({ where: { OR: [{ senderAccountId: accountId }, { recipientAccountId: accountId }] } }),
  ]);
  return { transfers, total, page, pages: Math.ceil(total / limit) };
}
