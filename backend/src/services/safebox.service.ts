import { PrismaClient } from '@prisma/client';
import { generateReferenceNumber } from '../utils/reference';
import { createNotification } from './notification.service';

const prisma = new PrismaClient();

export async function createSafeBox(userId: string, name: string, targetAmount?: number) {
  return prisma.safeBox.create({
    data: {
      userId,
      name,
      targetAmount: targetAmount || null,
    },
  });
}

export async function listSafeBoxes(userId: string) {
  return prisma.safeBox.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getSafeBox(id: string, userId: string) {
  const safebox = await prisma.safeBox.findFirst({
    where: { id, userId },
  });
  if (!safebox) throw new Error('SafeBox not found');
  return safebox;
}

export async function deposit(userId: string, safeBoxId: string, amount: number, senderAccountId: string) {
  if (amount <= 0) throw new Error('Amount must be greater than zero');

  const safebox = await prisma.safeBox.findFirst({
    where: { id: safeBoxId, userId },
  });
  if (!safebox) throw new Error('SafeBox not found');

  const senderAccount = await prisma.account.findFirst({
    where: { id: senderAccountId, userId, isActive: true },
  });
  if (!senderAccount) throw new Error('Sender account not found');
  if (senderAccount.balance < amount) throw new Error('Insufficient funds');

  const referenceNumber = generateReferenceNumber();

  const transfer = await prisma.$transaction(async (tx) => {
    await tx.account.update({
      where: { id: senderAccount.id },
      data: { balance: { decrement: amount } },
    });
    await tx.safeBox.update({
      where: { id: safebox.id },
      data: { balance: { increment: amount } },
    });
    return tx.transfer.create({
      data: {
        senderId: userId,
        recipientId: userId,
        amount,
        description: `Deposit to SafeBox: ${safebox.name}`,
        referenceNumber,
        status: 'completed',
        senderAccountId: senderAccount.id,
        recipientAccountId: null,
      },
    });
  });

  try {
    await createNotification({
      userId,
      type: 'safebox_deposit',
      title: 'SafeBox Deposit',
      message: `Deposited $${amount.toFixed(2)} into "${safebox.name}"`,
      link: `/safebox/${safebox.id}`,
    });
  } catch (err) {
    console.error('Notification failed:', err);
  }

  return transfer;
}

export async function withdraw(userId: string, safeBoxId: string, amount: number, recipientAccountId: string) {
  if (amount <= 0) throw new Error('Amount must be greater than zero');

  const safebox = await prisma.safeBox.findFirst({
    where: { id: safeBoxId, userId },
  });
  if (!safebox) throw new Error('SafeBox not found');
  if (safebox.balance < amount) throw new Error('Insufficient safebox funds');

  const recipientAccount = await prisma.account.findFirst({
    where: { id: recipientAccountId, userId, isActive: true },
  });
  if (!recipientAccount) throw new Error('Recipient account not found');

  const referenceNumber = generateReferenceNumber();

  const transfer = await prisma.$transaction(async (tx) => {
    await tx.safeBox.update({
      where: { id: safebox.id },
      data: { balance: { decrement: amount } },
    });
    await tx.account.update({
      where: { id: recipientAccount.id },
      data: { balance: { increment: amount } },
    });
    return tx.transfer.create({
      data: {
        senderId: userId,
        recipientId: userId,
        amount,
        description: `Withdraw from SafeBox: ${safebox.name}`,
        referenceNumber,
        status: 'completed',
        senderAccountId: null,
        recipientAccountId: recipientAccount.id,
      },
    });
  });

  try {
    await createNotification({
      userId,
      type: 'safebox_withdraw',
      title: 'SafeBox Withdrawal',
      message: `Withdrew $${amount.toFixed(2)} from "${safebox.name}"`,
      link: `/safebox/${safebox.id}`,
    });
  } catch (err) {
    console.error('Notification failed:', err);
  }

  return transfer;
}

export async function calculateInterest() {
  const safeboxes = await prisma.safeBox.findMany({
    where: { balance: { gt: 0 } },
  });

  const results: { safeboxId: string; interest: number }[] = [];

  for (const safebox of safeboxes) {
    const interest = safebox.balance * (safebox.interestRate / 365);
    if (interest <= 0) continue;

    await prisma.safeBox.update({
      where: { id: safebox.id },
      data: { balance: { increment: interest } },
    });

    try {
      await createNotification({
        userId: safebox.userId,
        type: 'safebox_interest',
        title: 'SafeBox Interest',
        message: `Your SafeBox "${safebox.name}" earned $${interest.toFixed(6)} in interest today.`,
        link: `/safebox/${safebox.id}`,
      });
    } catch (err) {
      console.error('Notification failed:', err);
    }

    results.push({ safeboxId: safebox.id, interest });
  }

  return results;
}
