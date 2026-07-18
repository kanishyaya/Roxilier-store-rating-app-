import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { protect } from '../src/middleware/auth.middleware.js';

const app = express();
app.get('/protected', protect(['ADMIN']), (req, res) => res.json({ ok: true }));

describe('protect middleware', () => {
  it('returns 401 for a protected route when no token is provided', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('returns 401 for a malformed Authorization header', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'not-a-bearer-token');
    expect(res.status).toBe(401);
  });
});
