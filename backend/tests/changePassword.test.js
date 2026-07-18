import { describe, it, expect, vi } from 'vitest';
import bcrypt from 'bcrypt';
import { changeUserPassword } from '../src/utils/changePassword.js';

describe('changeUserPassword (shared by user & owner routes)', () => {
  it('rejects a new password that fails the complexity rule, without hitting the DB', async () => {
    const fakePrisma = { user: { findUnique: vi.fn(), update: vi.fn() } };

    const result = await changeUserPassword(fakePrisma, 'user-1', 'whatever', 'weak');

    expect(result.status).toBe(400);
    expect(fakePrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects when the current password does not match', async () => {
    const hashed = await bcrypt.hash('OldPass1!', 12);
    const fakePrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'user-1', password: hashed }),
        update: vi.fn(),
      },
    };

    const result = await changeUserPassword(fakePrisma, 'user-1', 'WrongOldPass1!', 'NewPass1!');

    expect(result.status).toBe(400);
    expect(fakePrisma.user.update).not.toHaveBeenCalled();
  });

  it('updates the password when the current password matches', async () => {
    const hashed = await bcrypt.hash('OldPass1!', 12);
    const fakePrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'user-1', password: hashed }),
        update: vi.fn().mockResolvedValue({}),
      },
    };

    const result = await changeUserPassword(fakePrisma, 'user-1', 'OldPass1!', 'NewPass1!');

    expect(result.status).toBe(200);
    expect(fakePrisma.user.update).toHaveBeenCalledOnce();
  });
});
