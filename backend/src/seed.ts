import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 12);
  const adminPw = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@apexbank.com' },
    update: {},
    create: {
      email: 'admin@apexbank.com',
      password: adminPw,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      kycStatus: 'approved',
      emailVerified: true,
    },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@demo.com' },
    update: {},
    create: {
      email: 'alice@demo.com',
      password,
      firstName: 'Alice',
      lastName: 'Johnson',
      phone: '+1-555-0101',
      kycStatus: 'approved',
      emailVerified: true,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@demo.com' },
    update: {},
    create: {
      email: 'bob@demo.com',
      password,
      firstName: 'Bob',
      lastName: 'Smith',
      phone: '+1-555-0102',
      kycStatus: 'approved',
      emailVerified: true,
    },
  });

  const aliceAccount = await prisma.account.upsert({
    where: { accountNumber: '1000000001' },
    update: {},
    create: {
      userId: alice.id,
      accountNumber: '1000000001',
      accountType: 'checking',
      balance: 50000.00,
    },
  });

  const aliceSavings = await prisma.account.upsert({
    where: { accountNumber: '1000000003' },
    update: {},
    create: {
      userId: alice.id,
      accountNumber: '1000000003',
      accountType: 'savings',
      balance: 25000.00,
    },
  });

  const bobAccount = await prisma.account.upsert({
    where: { accountNumber: '1000000002' },
    update: {},
    create: {
      userId: bob.id,
      accountNumber: '1000000002',
      accountType: 'checking',
      balance: 25000.00,
    },
  });

  await prisma.transfer.upsert({
    where: { referenceNumber: 'TXN-DEMO000001' },
    update: {},
    create: {
      senderId: alice.id,
      recipientId: bob.id,
      amount: 500.00,
      description: 'Welcome bonus',
      referenceNumber: 'TXN-DEMO000001',
      status: 'completed',
      senderAccountId: aliceAccount.id,
      recipientAccountId: bobAccount.id,
    },
  });

  await prisma.transfer.upsert({
    where: { referenceNumber: 'TXN-DEMO000002' },
    update: {},
    create: {
      senderId: bob.id,
      recipientId: alice.id,
      amount: 150.00,
      description: 'Dinner reimbursement',
      referenceNumber: 'TXN-DEMO000002',
      status: 'completed',
      senderAccountId: bobAccount.id,
      recipientAccountId: aliceAccount.id,
    },
  });

  // Create some sample categories
  const categories = ['Food & Dining', 'Shopping', 'Bills & Utilities', 'Entertainment', 'Transport'];
  const icons = ['🍽️', '🛒', '⚡', '🎮', '🚗'];
  const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981'];

  for (let i = 0; i < categories.length; i++) {
    await prisma.transactionCategory.upsert({
      where: { id: `cat-${i}` },
      update: {},
      create: {
        id: `cat-${i}`,
        userId: alice.id,
        name: categories[i],
        icon: icons[i],
        color: colors[i],
      },
    });
  }

  // Create a sample notification
  await prisma.notification.create({
    data: {
      userId: alice.id,
      type: 'welcome',
      title: 'Welcome to BankApp!',
      message: 'Your account has been created successfully. Start by exploring the dashboard.',
      link: '/dashboard',
    },
  });

  console.log('Seed data created successfully');
  console.log('---');
  console.log('Demo accounts:');
  console.log('  alice@demo.com / password123');
  console.log('  bob@demo.com / password123');
  console.log('  admin@apexbank.com / admin123');
  console.log('---');
  console.log('Alice has 2 accounts: checking (1000000001) + savings (1000000003)');
  console.log('Bob has 1 account: checking (1000000002)');
  console.log('Sample categories and notifications created');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
