import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as entertainmentService from '../services/entertainment.service';

const router = Router();

router.post('/spin', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await entertainmentService.dailySpin(req.user!.userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/spin/status', authenticate, async (req: Request, res: Response) => {
  try {
    const status = await entertainmentService.checkSpinStatus(req.user!.userId);
    res.json(status);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/daily-reward', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await entertainmentService.dailyReward(req.user!.userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/daily-reward/status', authenticate, async (req: Request, res: Response) => {
  try {
    const status = await entertainmentService.checkDailyRewardStatus(req.user!.userId);
    res.json(status);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
