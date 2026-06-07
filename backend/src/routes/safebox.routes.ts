import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import * as safeboxService from '../services/safebox.service';

const router = Router();

const createSchema = z.object({
  name: z.string().default('My SafeBox'),
  targetAmount: z.number().positive().optional(),
});

const depositSchema = z.object({
  amount: z.number().positive(),
  senderAccountId: z.string(),
});

const withdrawSchema = z.object({
  amount: z.number().positive(),
  recipientAccountId: z.string(),
});

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const safeboxes = await safeboxService.listSafeBoxes(req.user!.userId);
    res.json(safeboxes);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/', authenticate, validate(createSchema), async (req: Request, res: Response) => {
  try {
    const safebox = await safeboxService.createSafeBox(req.user!.userId, req.body.name, req.body.targetAmount);
    res.status(201).json(safebox);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const safebox = await safeboxService.getSafeBox(req.params.id, req.user!.userId);
    res.json(safebox);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.post('/:id/deposit', authenticate, validate(depositSchema), async (req: Request, res: Response) => {
  try {
    const transfer = await safeboxService.deposit(req.user!.userId, req.params.id, req.body.amount, req.body.senderAccountId);
    res.json(transfer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/withdraw', authenticate, validate(withdrawSchema), async (req: Request, res: Response) => {
  try {
    const transfer = await safeboxService.withdraw(req.user!.userId, req.params.id, req.body.amount, req.body.recipientAccountId);
    res.json(transfer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
