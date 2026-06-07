import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import * as accountService from '../services/account.service';

const router = Router();

const createAccountSchema = z.object({
  accountType: z.enum(['checking', 'savings']).default('checking'),
  currency: z.string().default('USD'),
});

router.post('/', authenticate, validate(createAccountSchema), async (req: Request, res: Response) => {
  try {
    const account = await accountService.createAccount(req.user!.userId, req.body.accountType, req.body.currency);
    res.status(201).json(account);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const accounts = await accountService.getUserAccounts(req.user!.userId);
    res.json(accounts);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/search/query', authenticate, async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (q.length < 2) return res.json([]);
    const results = await accountService.searchAccounts(q, req.user!.userId);
    res.json(results);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/number/:accountNumber', authenticate, async (req: Request, res: Response) => {
  try {
    const account = await accountService.getAccountByNumber(req.params.accountNumber);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const account = await accountService.getAccountById(req.params.id, req.user!.userId);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await accountService.closeAccount(req.params.id, req.user!.userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
