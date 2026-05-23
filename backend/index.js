import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import adminStaffRoutes from './routes/adminStaff.js';
import authRoutes from './routes/auth.js';
import guestRoutes from './routes/guests.js';
import roomRoutes from './routes/rooms.js';
import reservationRoutes from './routes/reservations.js';
import reportRoutes from './routes/reports.js';
import hotelSettingsRoutes from './routes/settings.js';
import { ensureBootstrapAdmin } from './lib/bootstrapAdmin.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  }),
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin/staff', adminStaffRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', hotelSettingsRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

async function start() {
  await ensureBootstrapAdmin();
  app.listen(PORT, () => {
    console.log(`Hotel API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
