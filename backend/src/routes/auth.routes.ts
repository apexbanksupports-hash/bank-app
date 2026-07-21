import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import * as authService from '../services/auth.service';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const twoFactorSchema = z.object({
  userId: z.string(),
  token: z.string().length(6),
});

router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.loginUser(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

router.post('/verify-email/:token', async (req: Request, res: Response) => {
  try {
    const result = await authService.verifyEmail(req.params.token);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/resend-verification', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await authService.resendVerification(req.user!.userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/2fa/setup', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await authService.setupTwoFactor(req.user!.userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/2fa/verify', validate(twoFactorSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.verifyTwoFactor(req.body.userId, req.body.token);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/2fa/disable', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await authService.disableTwoFactor(req.user!.userId, req.body.token);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/2fa/login', validate(twoFactorSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.verifyTwoFactorLogin(req.body.userId, req.body.token);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

router.get('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await authService.getUserProfile(req.user!.userId);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

const setPinSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  pin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d+$/, 'PIN must contain only digits'),
});

const verifyPinSchema = z.object({
  pin: z.string().length(4).regex(/^\d+$/),
});

const changePinSchema = z.object({
  currentPin: z.string().length(4).regex(/^\d+$/),
  newPin: z.string().length(4).regex(/^\d+$/),
});

router.post('/pin/set', authenticate, validate(setPinSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.setTransactionPin(req.user!.userId, req.body.password, req.body.pin);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/pin/verify', authenticate, validate(verifyPinSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.verifyTransactionPin(req.user!.userId, req.body.pin);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

router.post('/pin/change', authenticate, validate(changePinSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.changeTransactionPin(req.user!.userId, req.body.currentPin, req.body.newPin);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/pin/status', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await authService.hasTransactionPin(req.user!.userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
