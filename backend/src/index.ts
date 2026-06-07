import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth.routes';
import accountRoutes from './routes/account.routes';
import transferRoutes from './routes/transfer.routes';
import kycRoutes from './routes/kyc.routes';
import adminRoutes from './routes/admin.routes';
import passwordRoutes from './routes/password.routes';
import notificationRoutes from './routes/notification.routes';
import scheduleRoutes from './routes/schedule.routes';
import categoryRoutes from './routes/category.routes';
import statementRoutes from './routes/statement.routes';
import safeboxRoutes from './routes/safebox.routes';
import entertainmentRoutes from './routes/entertainment.routes';
import banksRoutes from './routes/banks.routes';
import wireRoutes from './routes/wire.routes';
import { verifyToken } from './utils/jwt';
import { blacklistToken } from './services/blacklist.service';

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/statements', statementRoutes);
app.use('/api/safebox', safeboxRoutes);
app.use('/api/entertainment', entertainmentRoutes);
app.use('/api/banks', banksRoutes);
app.use('/api/wire', wireRoutes);

app.post('/api/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = verifyToken(token);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      blacklistToken(token, expiresAt);
    } catch {}
  }
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Bank backend running on http://localhost:${PORT}`);
});
