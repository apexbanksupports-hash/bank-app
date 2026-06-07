import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { sendWireTransferReceipt } from '../services/email.service';

const router = Router();

const wireSchema = z.object({
  senderAccountId: z.string(),
  beneficiaryName: z.string().min(1).max(200),
  beneficiaryAccountNumber: z.string().min(1).max(50),
  bankName: z.string().min(1).max(200),
  swiftCode: z.string().min(1).max(20),
  countryCode: z.string().length(2),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  description: z.string().max(200).optional(),
  recipientEmail: z.string().email().optional(),
});

router.post('/', authenticate, validate(wireSchema), async (req: Request, res: Response) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const senderAccount = await prisma.account.findFirst({
      where: { id: req.body.senderAccountId, userId: req.user!.userId, isActive: true },
    });
    if (!senderAccount) {
      await prisma.$disconnect();
      res.status(400).json({ error: 'Sender account not found' });
      return;
    }
    if (senderAccount.balance < req.body.amount) {
      await prisma.$disconnect();
      res.status(400).json({ error: 'Insufficient funds' });
      return;
    }

    const fee = Math.round(req.body.amount * 0.015 * 100) / 100;
    const total = req.body.amount + fee;

    if (senderAccount.balance < total) {
      await prisma.$disconnect();
      res.status(400).json({ error: `Insufficient funds including wire fee ($${fee.toFixed(2)})` });
      return;
    }

    const { generateReferenceNumber } = require('../utils/reference');
    const referenceNumber = generateReferenceNumber();

    const transfer = await prisma.$transaction(async (tx: any) => {
      await tx.account.update({
        where: { id: senderAccount.id },
        data: { balance: { decrement: total } },
      });

      return tx.transfer.create({
        data: {
          senderId: req.user!.userId,
          recipientId: req.user!.userId,
          amount: req.body.amount,
          currency: req.body.currency || 'USD',
          description: `Wire: ${req.body.beneficiaryName} - ${req.body.bankName} (${req.body.swiftCode})${req.body.description ? ` - ${req.body.description}` : ''}`,
          referenceNumber,
          status: 'completed',
          senderAccountId: senderAccount.id,
        },
      });
    });

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });

    await prisma.$disconnect();

    if (user) {
      sendWireTransferReceipt({
        referenceNumber,
        amount: req.body.amount,
        currency: req.body.currency || 'USD',
        senderName: `${user.firstName} ${user.lastName}`,
        senderEmail: user.email,
        beneficiaryName: req.body.beneficiaryName,
        bankName: req.body.bankName,
        swiftCode: req.body.swiftCode,
        beneficiaryAccountNumber: req.body.beneficiaryAccountNumber,
        destinationCountry: req.body.countryCode,
        fee,
        recipientEmail: req.body.recipientEmail,
      });
    }

    res.status(201).json({
      ...transfer,
      fee,
      total,
      beneficiaryName: req.body.beneficiaryName,
      bankName: req.body.bankName,
      swiftCode: req.body.swiftCode,
      destinationCountry: req.body.countryCode,
      beneficiaryEmail: req.body.recipientEmail,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
