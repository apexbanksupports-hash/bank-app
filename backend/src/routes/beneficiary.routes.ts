import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  listBeneficiaries,
  getBeneficiary,
  createBeneficiary,
  updateBeneficiary,
  deleteBeneficiary,
  toggleFavorite,
} from '../services/beneficiary.service';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  bankName: z.string().min(1).max(200),
  bankCountry: z.string().min(1).max(100),
  bankCountryCode: z.string().length(2),
  swiftCode: z.string().min(8).max(11),
  accountNumber: z.string().min(1).max(50),
  currency: z.string().length(3).default('USD'),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional().nullable(),
  bankName: z.string().min(1).max(200).optional(),
  bankCountry: z.string().min(1).max(100).optional(),
  bankCountryCode: z.string().length(2).optional(),
  swiftCode: z.string().min(8).max(11).optional(),
  accountNumber: z.string().min(1).max(50).optional(),
  currency: z.string().length(3).optional(),
  isFavorite: z.boolean().optional(),
});

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const beneficiaries = await listBeneficiaries(req.user!.userId);
    res.json(beneficiaries);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const beneficiary = await getBeneficiary(req.user!.userId, req.params.id);
    res.json(beneficiary);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.post('/', authenticate, validate(createSchema), async (req: Request, res: Response) => {
  try {
    const beneficiary = await createBeneficiary(req.user!.userId, req.body);
    res.status(201).json(beneficiary);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', authenticate, validate(updateSchema), async (req: Request, res: Response) => {
  try {
    const beneficiary = await updateBeneficiary(req.user!.userId, req.params.id, req.body);
    res.json(beneficiary);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    await deleteBeneficiary(req.user!.userId, req.params.id);
    res.json({ message: 'Beneficiary deleted' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/favorite', authenticate, async (req: Request, res: Response) => {
  try {
    const beneficiary = await toggleFavorite(req.user!.userId, req.params.id);
    res.json(beneficiary);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
