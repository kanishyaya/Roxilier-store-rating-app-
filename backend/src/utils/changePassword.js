import bcrypt from 'bcrypt';
import { passwordRegex } from './validation.js';

/**
 * Shared "change my own password" logic, used by both the USER/ADMIN
 * change-password route and the OWNER change-password route so the rules
 * and behavior can't drift between them.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<{status: number, body: object}>}
 */
export async function changeUserPassword(prisma, userId, currentPassword, newPassword) {
  if (!newPassword || !passwordRegex.test(newPassword)) {
    return {
      status: 400,
      body: { message: 'New password must be 8–16 chars with at least 1 uppercase and 1 special character.' },
    };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { status: 404, body: { message: 'User not found.' } };
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return { status: 400, body: { message: 'Current password is incorrect.' } };
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  return { status: 200, body: { message: 'Password updated successfully.' } };
}
