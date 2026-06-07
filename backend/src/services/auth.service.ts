import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { signToken } from '../utils/jwt';

const prisma = new PrismaClient();

export async function registerUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error('Email already registered');

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const verifyToken = crypto.randomBytes(20).toString('hex');

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      emailVerificationToken: verifyToken,
    },
  });

  console.log(`Email verification token for ${data.email}: ${verifyToken}`);

  const token = signToken({ userId: user.id, email: user.email });
  return {
    token,
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
    emailVerificationToken: verifyToken,
  };
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findFirst({ where: { emailVerificationToken: token } });
  if (!user) throw new Error('Invalid verification token');
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerificationToken: null },
  });
  return { message: 'Email verified successfully' };
}

export async function resendVerification(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  if (user.emailVerified) throw new Error('Email already verified');
  const verifyToken = crypto.randomBytes(20).toString('hex');
  await prisma.user.update({ where: { id: userId }, data: { emailVerificationToken: verifyToken } });
  console.log(`New verification token for ${user.email}: ${verifyToken}`);
  return { message: 'Verification email resent', emailVerificationToken: verifyToken };
}

export async function loginUser(data: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new Error('Invalid email or password');
  if (!user.isActive) throw new Error('Account has been deactivated');

  const isValid = await bcrypt.compare(data.password, user.password);
  if (!isValid) throw new Error('Invalid email or password');

  if (user.twoFactorEnabled) {
    return { requiresTwoFactor: true, userId: user.id, email: user.email };
  }

  const token = signToken({ userId: user.id, email: user.email });
  return {
    token,
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
  };
}

export async function setupTwoFactor(userId: string) {
  const secret = speakeasy.generateSecret({ name: 'BankApp', length: 20 });
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret.base32 },
  });
  const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url!);
  return { secret: secret.base32, otpauth_url: secret.otpauth_url, qrCode: qrCodeDataUrl };
}

export async function verifyTwoFactor(userId: string, token: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorSecret) throw new Error('2FA not set up');

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!verified) throw new Error('Invalid 2FA token');

  if (!user.twoFactorEnabled) {
    await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
  }

  const jwtToken = signToken({ userId: user.id, email: user.email });
  return {
    token: jwtToken,
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
  };
}

export async function disableTwoFactor(userId: string, token: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorSecret) throw new Error('2FA not set up');

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!verified) throw new Error('Invalid 2FA token');

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: null, twoFactorEnabled: false },
  });
  return { message: '2FA disabled' };
}

export async function verifyTwoFactorLogin(userId: string, token: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorSecret) throw new Error('2FA not set up');

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!verified) throw new Error('Invalid 2FA token');

  const jwtToken = signToken({ userId: user.id, email: user.email });
  return {
    token: jwtToken,
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
  };
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      dateOfBirth: true,
      address: true,
      twoFactorEnabled: true,
      kycStatus: true,
      emailVerified: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
  return user;
}
