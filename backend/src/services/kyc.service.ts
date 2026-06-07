import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

export async function uploadDocument(data: {
  userId: string;
  type: string;
  filePath: string;
}) {
  const doc = await prisma.kycDocument.create({
    data: {
      userId: data.userId,
      type: data.type,
      filePath: data.filePath,
    },
  });

  await prisma.user.update({
    where: { id: data.userId },
    data: { kycStatus: 'pending' },
  });

  return doc;
}

export async function getKycStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true },
  });
  return user;
}

export async function getDocuments(userId: string) {
  const docs = await prisma.kycDocument.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return docs;
}

export async function updateProfile(userId: string, data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
}) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      dateOfBirth: true,
      address: true,
    },
  });
  return user;
}
