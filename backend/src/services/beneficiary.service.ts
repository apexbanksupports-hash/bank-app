import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function listBeneficiaries(userId: string) {
  return prisma.beneficiary.findMany({
    where: { userId },
    orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
  });
}

export async function getBeneficiary(userId: string, id: string) {
  const b = await prisma.beneficiary.findFirst({ where: { id, userId } });
  if (!b) throw new Error('Beneficiary not found');
  return b;
}

export async function createBeneficiary(userId: string, data: {
  name: string;
  email?: string;
  bankName: string;
  bankCountry: string;
  bankCountryCode: string;
  swiftCode: string;
  accountNumber: string;
  currency?: string;
}) {
  return prisma.beneficiary.create({
    data: {
      userId,
      name: data.name,
      email: data.email,
      bankName: data.bankName,
      bankCountry: data.bankCountry,
      bankCountryCode: data.bankCountryCode,
      swiftCode: data.swiftCode.toUpperCase(),
      accountNumber: data.accountNumber,
      currency: data.currency || 'USD',
    },
  });
}

export async function updateBeneficiary(userId: string, id: string, data: {
  name?: string;
  email?: string;
  bankName?: string;
  bankCountry?: string;
  bankCountryCode?: string;
  swiftCode?: string;
  accountNumber?: string;
  currency?: string;
  isFavorite?: boolean;
}) {
  const existing = await prisma.beneficiary.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Beneficiary not found');

  return prisma.beneficiary.update({
    where: { id },
    data: {
      ...data,
      swiftCode: data.swiftCode ? data.swiftCode.toUpperCase() : undefined,
    },
  });
}

export async function deleteBeneficiary(userId: string, id: string) {
  const existing = await prisma.beneficiary.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Beneficiary not found');

  return prisma.beneficiary.delete({ where: { id } });
}

export async function toggleFavorite(userId: string, id: string) {
  const existing = await prisma.beneficiary.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Beneficiary not found');

  return prisma.beneficiary.update({
    where: { id },
    data: { isFavorite: !existing.isFavorite },
  });
}
