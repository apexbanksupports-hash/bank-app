import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import * as transferService from '../services/transfer.service';

const router = Router();

const sendMoneySchema = z.object({
  recipientAccountNumber: z.string().regex(/^\d{10}$/, 'Account number must be exactly 10 digits'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().max(200).optional(),
  senderAccountId: z.string(),
  categoryId: z.string().nullable().optional(),
});

router.post('/', authenticate, validate(sendMoneySchema), async (req: Request, res: Response) => {
  try {
    const transfer = await transferService.sendMoney({
      senderId: req.user!.userId,
      recipientAccountNumber: req.body.recipientAccountNumber,
      amount: req.body.amount,
      description: req.body.description,
      senderAccountId: req.body.senderAccountId,
      categoryId: req.body.categoryId,
    });
    res.status(201).json(transfer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/reverse', authenticate, async (req: Request, res: Response) => {
  try {
    const reversal = await transferService.reverseTransfer(req.params.id, req.user!.userId);
    res.json(reversal);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await transferService.getTransferHistory(req.user!.userId, page, limit);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/reference/:ref', authenticate, async (req: Request, res: Response) => {
  try {
    const transfer = await transferService.getTransferByReference(req.params.ref, req.user!.userId);
    res.json(transfer);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.get('/limits', authenticate, async (req: Request, res: Response) => {
  try {
    const limits = await transferService.getDailyLimit(req.user!.userId);
    res.json(limits);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/account/:accountId', authenticate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await transferService.getAccountTransfers(req.params.accountId, req.user!.userId, page, limit);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
