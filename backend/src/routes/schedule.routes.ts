import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import * as scheduleService from '../services/schedule.service';

const router = Router();

const createSchema = z.object({
  recipientAccountNumber: z.string().length(10),
  amount: z.number().positive(),
  description: z.string().max(200).optional(),
  frequency: z.enum(['once', 'daily', 'weekly', 'biweekly', 'monthly']).default('once'),
  nextRunDate: z.string(),
  endDate: z.string().optional(),
  maxRuns: z.number().int().positive().optional(),
  senderAccountId: z.string(),
});

router.post('/', authenticate, validate(createSchema), async (req: Request, res: Response) => {
  try {
    const result = await scheduleService.createScheduledTransfer(req.user!.userId, req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', authenticate, async (req: Request, res: Response) => {
  const schedules = await scheduleService.getUserScheduledTransfers(req.user!.userId);
  res.json(schedules);
});

router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await scheduleService.updateScheduledTransfer(req.params.id, req.user!.userId, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    await scheduleService.cancelScheduledTransfer(req.params.id, req.user!.userId);
    res.json({ message: 'Scheduled transfer cancelled' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
