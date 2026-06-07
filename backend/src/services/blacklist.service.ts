import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function blacklistToken(token: string, expiresAt: Date) {
  await prisma.tokenBlacklist.create({ data: { token, expiresAt } });
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const entry = await prisma.tokenBlacklist.findUnique({ where: { token } });
  if (!entry) return false;
  if (new Date() > entry.expiresAt) {
    await prisma.tokenBlacklist.delete({ where: { id: entry.id } });
    return false;
  }
  return true;
}

export async function cleanupExpiredTokens() {
  await prisma.tokenBlacklist.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
}
