import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const walletAddress = searchParams.get('wallet');
  const email = searchParams.get('email');

  if (walletAddress) {
    const user = await prisma.user.findUnique({ where: { walletAddress } });
    return NextResponse.json(user);
  }
  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });
    return NextResponse.json(user);
  }
  return NextResponse.json({ error: 'wallet or email required' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, walletAddress, role } = await req.json();
    const user = await prisma.user.upsert({
      where: { email },
      update: { walletAddress, name },
      create: { email, name, walletAddress, role: role || 'BUYER' },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create/update user' }, { status: 500 });
  }
}
