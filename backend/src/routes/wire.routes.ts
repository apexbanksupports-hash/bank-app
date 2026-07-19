import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { sendWireTransferReceipt } from '../services/email.service';
import { generateWireReferenceNumber, generateTrackingNumber, calculateWireFee, getEstimatedArrival } from '../utils/wireReference';
import { convertCurrency, getExchangeRate, getSupportedCurrencies } from '../utils/currency';
import { validateSwiftCode } from '../utils/swift';

const prisma = new PrismaClient();
const router = Router();

const wireSchema = z.object({
  senderAccountId: z.string(),
  beneficiaryId: z.string().optional(),
  beneficiaryName: z.string().min(1).max(200),
  beneficiaryAccountNumber: z.string().min(1).max(50),
  beneficiaryEmail: z.string().email().optional(),
  bankName: z.string().min(1).max(200),
  bankCountry: z.string().min(1).max(100).optional(),
  bankCountryCode: z.string().length(2),
  swiftCode: z.string().min(8).max(20),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  receiveCurrency: z.string().length(3).optional(),
  description: z.string().max(200).optional(),
  purposeOfTransfer: z.string().max(200).optional(),
  correspondentBank: z.string().max(200).optional(),
  correspondentSwift: z.string().max(11).optional(),
});

router.post('/', authenticate, validate(wireSchema), async (req: Request, res: Response) => {
  try {
    const body = req.body;

    const swiftValidation = validateSwiftCode(body.swiftCode);
    if (!swiftValidation.valid) {
      res.status(400).json({ error: swiftValidation.error });
      return;
    }

    const senderAccount = await prisma.account.findFirst({
      where: { id: body.senderAccountId, userId: req.user!.userId, isActive: true },
    });
    if (!senderAccount) {
      res.status(400).json({ error: 'Sender account not found' });
      return;
    }

    const fee = calculateWireFee(body.amount, body.currency);
    const total = body.amount + fee;

    if (senderAccount.balance < total) {
      res.status(400).json({ error: `Insufficient funds. Required: $${total.toFixed(2)} (amount + $${fee.toFixed(2)} fee)` });
      return;
    }

    const receiveCurrency = body.receiveCurrency || body.currency;
    const exchangeRate = getExchangeRate(body.currency, receiveCurrency);
    const convertedAmount = convertCurrency(body.amount, body.currency, receiveCurrency);
    const referenceNumber = generateWireReferenceNumber();
    const trackingNumber = generateTrackingNumber();
    const estimatedArrival = getEstimatedArrival(body.bankCountryCode);

    const statusHistory = JSON.stringify([
      { status: 'initiated', timestamp: new Date().toISOString(), note: 'Transfer initiated' },
    ]);

    const transfer = await prisma.$transaction(async (tx: any) => {
      await tx.account.update({
        where: { id: senderAccount.id },
        data: { balance: { decrement: total } },
      });

      return tx.wireTransfer.create({
        data: {
          userId: req.user!.userId,
          senderAccountId: senderAccount.id,
          beneficiaryId: body.beneficiaryId || null,
          beneficiaryName: body.beneficiaryName,
          beneficiaryAccount: body.beneficiaryAccountNumber,
          beneficiaryEmail: body.beneficiaryEmail || null,
          bankName: body.bankName,
          bankCountry: body.bankCountry || '',
          bankCountryCode: body.bankCountryCode,
          swiftCode: body.swiftCode.toUpperCase(),
          amount: body.amount,
          sendCurrency: body.currency,
          receiveCurrency,
          exchangeRate,
          convertedAmount: body.currency !== receiveCurrency ? convertedAmount : null,
          fee,
          totalDeducted: total,
          referenceNumber,
          trackingNumber,
          correspondentBank: body.correspondentBank || null,
          correspondentSwift: body.correspondentSwift?.toUpperCase() || null,
          purposeOfTransfer: body.purposeOfTransfer || null,
          estimatedArrival,
          status: 'processing',
          statusHistory,
        },
      });
    });

    await txWireNotification(prisma, req.user!.userId, transfer);

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });

    if (user) {
      sendWireTransferReceipt({
        referenceNumber,
        amount: body.amount,
        currency: body.currency,
        senderName: `${user.firstName} ${user.lastName}`,
        senderEmail: user.email,
        beneficiaryName: body.beneficiaryName,
        bankName: body.bankName,
        swiftCode: body.swiftCode,
        beneficiaryAccountNumber: body.beneficiaryAccountNumber,
        destinationCountry: body.bankCountryCode,
        fee,
        recipientEmail: body.beneficiaryEmail,
      }).catch(() => {});
    }

    res.status(201).json({
      id: transfer.id,
      referenceNumber,
      trackingNumber,
      amount: body.amount,
      sendCurrency: body.currency,
      receiveCurrency,
      exchangeRate,
      convertedAmount: body.currency !== receiveCurrency ? convertedAmount : null,
      fee,
      totalDeducted: total,
      status: 'processing',
      estimatedArrival,
      beneficiaryName: body.beneficiaryName,
      beneficiaryAccount: body.beneficiaryAccountNumber,
      bankName: body.bankName,
      swiftCode: body.swiftCode.toUpperCase(),
      bankCountryCode: body.bankCountryCode,
      createdAt: transfer.createdAt,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;

    const where: any = { userId: req.user!.userId };
    if (status) where.status = status;

    const [transfers, total] = await Promise.all([
      prisma.wireTransfer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.wireTransfer.count({ where }),
    ]);

    res.json({
      transfers,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const transfer = await prisma.wireTransfer.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!transfer) {
      res.status(404).json({ error: 'Wire transfer not found' });
      return;
    }
    res.json({
      ...transfer,
      statusHistory: JSON.parse(transfer.statusHistory || '[]'),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/reference/:ref', authenticate, async (req: Request, res: Response) => {
  try {
    const transfer = await prisma.wireTransfer.findFirst({
      where: { referenceNumber: req.params.ref, userId: req.user!.userId },
    });
    if (!transfer) {
      res.status(404).json({ error: 'Wire transfer not found' });
      return;
    }
    res.json({
      ...transfer,
      statusHistory: JSON.parse(transfer.statusHistory || '[]'),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/track/:trackingNumber', authenticate, async (req: Request, res: Response) => {
  try {
    const transfer = await prisma.wireTransfer.findFirst({
      where: { trackingNumber: req.params.trackingNumber, userId: req.user!.userId },
    });
    if (!transfer) {
      res.status(404).json({ error: 'Wire transfer not found' });
      return;
    }
    res.json({
      ...transfer,
      statusHistory: JSON.parse(transfer.statusHistory || '[]'),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/cancel', authenticate, async (req: Request, res: Response) => {
  try {
    const transfer = await prisma.wireTransfer.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!transfer) {
      res.status(404).json({ error: 'Wire transfer not found' });
      return;
    }
    if (!['initiated', 'processing'].includes(transfer.status)) {
      res.status(400).json({ error: 'Transfer cannot be cancelled at this stage' });
      return;
    }

    const statusHistory = JSON.parse(transfer.statusHistory || '[]');
    statusHistory.push({ status: 'cancelled', timestamp: new Date().toISOString(), note: 'Cancelled by user' });

    await prisma.$transaction(async (tx: any) => {
      await tx.account.update({
        where: { id: transfer.senderAccountId },
        data: { balance: { increment: transfer.totalDeducted } },
      });

      await tx.wireTransfer.update({
        where: { id: transfer.id },
        data: { status: 'cancelled', statusHistory: JSON.stringify(statusHistory) },
      });
    });

    res.json({ message: 'Transfer cancelled', refund: transfer.totalDeducted });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/currencies/list', authenticate, (_req: Request, res: Response) => {
  res.json(getSupportedCurrencies());
});

router.post('/quote', authenticate, async (req: Request, res: Response) => {
  try {
    const { amount, fromCurrency, toCurrency, countryCode } = req.body;
    if (!amount || !fromCurrency || !toCurrency) {
      res.status(400).json({ error: 'amount, fromCurrency, and toCurrency are required' });
      return;
    }

    const fee = calculateWireFee(amount, fromCurrency);
    const exchangeRate = getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency);
    const estimatedArrival = countryCode ? getEstimatedArrival(countryCode) : null;

    res.json({
      amount,
      fromCurrency,
      toCurrency,
      exchangeRate,
      convertedAmount,
      fee,
      totalDeducted: amount + fee,
      estimatedArrival,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

async function txWireNotification(prisma: PrismaClient, userId: string, transfer: any) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: 'wire_transfer',
        title: 'International Wire Transfer Initiated',
        message: `Your wire transfer of ${transfer.sendCurrency} ${transfer.amount.toFixed(2)} to ${transfer.beneficiaryName} is being processed. Reference: ${transfer.referenceNumber}`,
        link: '/transfer',
      },
    });
  } catch {}
}

export default router;
