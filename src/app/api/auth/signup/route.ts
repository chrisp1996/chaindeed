import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: role || 'BUYER' },
    });

    const token = await createSession(user.id);

    const res = NextResponse.json({
      id: user.id, name: user.name, email: user.email, role: user.role, kycStatus: user.kycStatus,
    }, { status: 201 });

    res.cookies.set('cd_session', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 30 * 24 * 60 * 60, path: '/',
    });

    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 });
  }
}
