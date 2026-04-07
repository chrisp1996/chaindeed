import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('cd_session')?.value;
  const user = await getSessionUser(token || '');
  if (!user) return NextResponse.json(null);
  return NextResponse.json({
    id: user.id, name: user.name, email: user.email, role: user.role,
    kycStatus: user.kycStatus, walletAddress: user.walletAddress,
    additionalWallets: user.additionalWallets, avatarUrl: user.avatarUrl,
    isAdmin: user.isAdmin, createdAt: user.createdAt,
  });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('cd_session')?.value;
  const user = await getSessionUser(token || '');
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { name, phone, bio, walletAddress } = await req.json();
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(bio !== undefined && { bio }),
        ...(walletAddress !== undefined && { walletAddress }),
      },
    });
    return NextResponse.json({
      id: updated.id, name: updated.name, email: updated.email,
      role: updated.role, walletAddress: updated.walletAddress,
      phone: updated.phone, bio: updated.bio,
    });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'That wallet address is already linked to another account.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Update failed.' }, { status: 500 });
  }
}
