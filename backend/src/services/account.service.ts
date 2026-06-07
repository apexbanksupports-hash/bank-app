import { PrismaClient } from '@prisma/client';
import { generateAccountNumber } from '../utils/reference';

const prisma = new PrismaClient();

export async function createAccount(userId: string, accountType: string = 'checking', currency: string = 'USD') {
  const existing = await prisma.account.findFirst({
    where: { userId, accountType, isActive: true },
  });

  if (existing && accountType === 'checking') {
    throw new Error('You already have a checking account');
  }

  const accountNumber = generateAccountNumber();

  const account = await prisma.account.create({
    data: {
      userId,
      accountNumber,
      accountType,
      currency,
      balance: 10000.00,
    },
  });

  return account;
}

export async function getUserAccounts(userId: string) {
  return prisma.account.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAccountById(accountId: string, userId: string) {
  return prisma.account.findFirst({
    where: { id: accountId, userId, isActive: true },
  });
}

export async function getAccountByNumber(accountNumber: string) {
  return prisma.account.findUnique({
    where: { accountNumber },
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });
}

export async function searchAccounts(query: string, excludeUserId: string) {
  return prisma.account.findMany({
    where: {
      isActive: true,
      userId: { not: excludeUserId },
      OR: [
        { accountNumber: { contains: query } },
        { user: { firstName: { contains: query } } },
        { user: { lastName: { contains: query } } },
        { user: { email: { contains: query } } },
      ],
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    take: 10,
  });
}

export async function closeAccount(accountId: string, userId: string) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId, isActive: true },
  });
  if (!account) throw new Error('Account not found');
  if (account.balance > 0) throw new Error('Please transfer out remaining funds before closing');

  return prisma.account.update({
    where: { id: accountId },
    data: { isActive: false, closedAt: new Date() },
  });
}
