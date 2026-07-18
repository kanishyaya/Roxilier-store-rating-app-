import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcrypt';

// Mock Prisma so these tests run without a real database.
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(function () {
    return { user: { findUnique: mockFindUnique, create: mockCreate } };
  }),
}));

process.env.JWT_SECRET = 'test-secret';

const authRoutes = (await import('../src/routes/auth.routes.js')).default;

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

beforeEach(() => {
  mockFindUnique.mockReset();
  mockCreate.mockReset();
});

describe('POST /api/auth/signup', () => {
  it('returns 201 and a token for valid, unused input', async () => {
    mockFindUnique.mockResolvedValue(null); // email not already registered
    mockCreate.mockResolvedValue({
      id: 'user-1',
      name: 'Jonathan Alexander Whitfield',
      role: 'USER',
    });

    const res = await request(app).post('/api/auth/signup').send({
      name: 'Jonathan Alexander Whitfield',
      email: 'jonathan@example.com',
      address: '123 Main St',
      password: 'Password1!',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ id: 'user-1', role: 'USER' });
  });
});

describe('POST /api/auth/login', () => {
  it('returns 400 when the password is wrong', async () => {
    const hashed = await bcrypt.hash('CorrectPass1!', 12);
    mockFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'jonathan@example.com',
      password: hashed,
      role: 'USER',
      name: 'Jonathan Alexander Whitfield',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'jonathan@example.com',
      password: 'WrongPass1!',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });
});
