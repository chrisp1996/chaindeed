import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'No account found with this email.' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    const token = await createSession(user.id);

    const res = NextResponse.json({
      id: user.id, name: user.name, email: user.email, role: user.role,
      kycStatus: user.kycStatus, walletAddress: user.walletAddress,
    });

    res.cookies.set('cd_session', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 30 * 24 * 60 * 60, path: '/',
    });

    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 });
  }
}
