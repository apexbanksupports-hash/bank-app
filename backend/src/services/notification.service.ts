import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  return prisma.notification.create({ data });
}

export async function notifyTransferSent(transfer: {
  senderId: string; recipientId: string; amount: number; currency: string;
  referenceNumber: string; recipient: { firstName: string; lastName: string };
  sender: { firstName: string; lastName: string };
}) {
  const currencySym = transfer.currency === 'USD' ? '$' : transfer.currency + ' ';

  await createNotification({
    userId: transfer.senderId,
    type: 'transfer_sent',
    title: 'Transfer Sent',
    message: `You sent ${currencySym}${transfer.amount.toFixed(2)} to ${transfer.recipient.firstName} ${transfer.recipient.lastName}`,
    link: `/transactions?ref=${transfer.referenceNumber}`,
  });

  await createNotification({
    userId: transfer.recipientId,
    type: 'transfer_received',
    title: 'Payment Received',
    message: `You received ${currencySym}${transfer.amount.toFixed(2)} from ${transfer.sender.firstName} ${transfer.sender.lastName}`,
    link: `/transactions?ref=${transfer.referenceNumber}`,
  });
}

export async function notifyKycStatus(userId: string, status: string) {
  const title = status === 'approved' ? 'KYC Approved' : 'KYC Rejected';
  const message = status === 'approved'
    ? 'Your identity verification has been approved.'
    : 'Your identity verification has been rejected. Please upload new documents.';
  await createNotification({ userId, type: 'kyc_' + status, title, message, link: '/kyc' });
}
