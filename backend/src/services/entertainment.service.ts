import { PrismaClient } from '@prisma/client';
import { generateReferenceNumber } from '../utils/reference';
import { createNotification } from './notification.service';

const prisma = new PrismaClient();

async function getPrimaryAccount(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  return account;
}

export async function dailySpin(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existingSpin = await prisma.luckySpin.findFirst({
    where: { userId, usedAt: { gte: today, lt: tomorrow } },
  });
  if (existingSpin) throw new Error('Already spun today. Come back tomorrow!');

  const basePrize = Math.floor(Math.random() * 100) + 1;
  const multipliers = ['1x', '2x', '3x', '5x', '10x'];
  const multiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
  const multiplierValue = parseInt(multiplier);
  const finalPrize = basePrize * multiplierValue;

  const account = await getPrimaryAccount(userId);
  if (!account) throw new Error('No active account found. Open an account first.');

  const referenceNumber = generateReferenceNumber();

  await prisma.$transaction(async (tx) => {
    await tx.account.update({
      where: { id: account.id },
      data: { balance: { increment: finalPrize } },
    });
    await tx.luckySpin.create({
      data: { userId, prize: finalPrize, multiplier },
    });
    await tx.transfer.create({
      data: {
        senderId: userId,
        recipientId: userId,
        amount: finalPrize,
        description: `Lucky Spin Prize: $${finalPrize.toFixed(2)} (${basePrize} x ${multiplier})`,
        referenceNumber,
        status: 'completed',
        senderAccountId: null,
        recipientAccountId: account.id,
      },
    });
  });

  try {
    await createNotification({
      userId, type: 'lucky_spin',
      title: 'Lucky Spin Result',
      message: `You won $${finalPrize.toFixed(2)} (${basePrize} x ${multiplier})!`,
      link: '/entertainment',
    });
  } catch {}

  return { prize: finalPrize, basePrize, multiplier };
}

export async function checkSpinStatus(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existingSpin = await prisma.luckySpin.findFirst({
    where: { userId, usedAt: { gte: today, lt: tomorrow } },
  });
  return { hasSpun: !!existingSpin };
}

export async function dailyReward(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existing = await prisma.dailyReward.findFirst({
    where: { userId, date: { gte: today, lt: tomorrow } },
  });
  if (existing) throw new Error('Daily reward already claimed today');

  const lastReward = await prisma.dailyReward.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
  });

  let streak = 1;
  if (lastReward) {
    const lastDate = new Date(lastReward.date);
    lastDate.setHours(0, 0, 0, 0);
    const diff = (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak = lastReward.streak + 1;
  }

  const cappedStreak = Math.min(streak, 14);
  const reward = 5 + 2 * cappedStreak;

  const account = await getPrimaryAccount(userId);
  if (!account) throw new Error('No active account found. Open an account first.');

  const referenceNumber = generateReferenceNumber();

  await prisma.$transaction(async (tx) => {
    await tx.account.update({
      where: { id: account.id },
      data: { balance: { increment: reward } },
    });
    await tx.dailyReward.create({
      data: { userId, date: today, reward, streak: cappedStreak },
    });
    await tx.transfer.create({
      data: {
        senderId: userId,
        recipientId: userId,
        amount: reward,
        description: `Daily Reward: Day ${cappedStreak} streak`,
        referenceNumber,
        status: 'completed',
        senderAccountId: null,
        recipientAccountId: account.id,
      },
    });
  });

  try {
    await createNotification({
      userId, type: 'daily_reward',
      title: 'Daily Reward',
      message: `You claimed $${reward.toFixed(2)}! Day ${cappedStreak} streak.`,
      link: '/entertainment',
    });
  } catch {}

  return { reward, streak: cappedStreak };
}

export async function checkDailyRewardStatus(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existing = await prisma.dailyReward.findFirst({
    where: { userId, date: { gte: today, lt: tomorrow } },
  });

  const lastReward = await prisma.dailyReward.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
  });

  return {
    canClaim: !existing,
    currentStreak: lastReward?.streak || 0,
    lastClaimed: lastReward?.date || null,
  };
}
