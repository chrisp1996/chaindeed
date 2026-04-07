import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const session = await prisma.userSession.create({
    data: { userId, expiresAt },
  });
  return session.token;
}

export async function getSessionUser(token: string) {
  if (!token) return null;
  const session = await prisma.userSession.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function deleteSession(token: string) {
  await prisma.userSession.deleteMany({ where: { token } });
}
