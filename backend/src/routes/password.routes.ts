import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import * as passwordService from '../services/password.service';

const router = Router();

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

router.put('/change', authenticate, validate(changePasswordSchema), async (req: Request, res: Response) => {
  try {
    const result = await passwordService.changePassword(req.user!.userId, req.body.currentPassword, req.body.newPassword);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/forgot', validate(forgotPasswordSchema), async (req: Request, res: Response) => {
  try {
    const result = await passwordService.forgotPassword(req.body.email);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/reset', validate(resetPasswordSchema), async (req: Request, res: Response) => {
  try {
    const result = await passwordService.resetPassword(req.body.token, req.body.newPassword);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
