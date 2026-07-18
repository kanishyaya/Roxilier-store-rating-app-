import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes  from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import userRoutes  from './routes/user.routes.js';
import ownerRoutes from './routes/owner.routes.js';
import { sanitizeInputs } from './middleware/sanitize.middleware.js';

dotenv.config();

const app = express();

// ── Security headers ─────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));   // reject oversized payloads

// ── Input sanitization (XSS) — runs before every route ───────────────────────
app.use(sanitizeInputs);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user',  userRoutes);
app.use('/api/owner', ownerRoutes);

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'An unexpected error occurred.' });
});

const PORT = process.env.PORT || 6001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
