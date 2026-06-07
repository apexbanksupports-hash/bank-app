import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import * as kycService from '../services/kyc.service';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpg, .jpeg, .png, .pdf files allowed'));
    }
  },
});

const router = Router();

const uploadSchema = z.object({
  type: z.enum(['passport', 'drivers_license', 'national_id']),
});

router.post('/upload', authenticate, upload.single('document'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const type = req.body.type || 'passport';
    const doc = await kycService.uploadDocument({
      userId: req.user!.userId,
      filePath: req.file.path,
      type,
    });
    res.status(201).json(doc);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/status', authenticate, async (req: Request, res: Response) => {
  try {
    const status = await kycService.getKycStatus(req.user!.userId);
    res.json(status);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/documents', authenticate, async (req: Request, res: Response) => {
  try {
    const docs = await kycService.getDocuments(req.user!.userId);
    res.json(docs);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
});

router.put('/profile', authenticate, validate(updateProfileSchema), async (req: Request, res: Response) => {
  try {
    const user = await kycService.updateProfile(req.user!.userId, req.body);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
