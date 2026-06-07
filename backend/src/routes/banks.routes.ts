import { Router, Request, Response } from 'express';
import * as bankService from '../services/bank.service';

const router = Router();

router.get('/search', (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const country = req.query.country as string | undefined;
    const results = bankService.searchBanks(q, country);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/countries', (_req: Request, res: Response) => {
  try {
    const countries = bankService.getCountries();
    res.json(countries);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/country/:code', (req: Request, res: Response) => {
  try {
    const banks = bankService.getBanksByCountry(req.params.code);
    if (!banks.length) {
      res.status(404).json({ error: 'Country not found' });
      return;
    }
    res.json(banks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
