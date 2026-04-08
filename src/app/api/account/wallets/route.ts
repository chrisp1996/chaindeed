import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyMessage } from 'viem';

// POST /api/account/wallets — verify signature and link wallet
export async function POST(req: NextRequest) {
  const token = req.cookies.get('cd_session')?.value;
  const user = await getSessionUser(token || '');
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { address, signature, message, setPrimary } = await req.json();
  if (!address || !signature || !message) {
    return NextResponse.json({ error: 'address, signature, and message are required' }, { status: 400 });
  }

  // Verify the signature on-server so we know the user actually owns the wallet
  try {
    const valid = await verifyMessage({ address, message, signature });
    if (!valid) return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Check the address isn't already claimed by another account
  const existing = await prisma.user.findFirst({
    where: { walletAddress: address, NOT: { id: user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: 'This wallet is already linked to another account.' }, { status: 409 });
  }

  const alreadyInAdditional = user.additionalWallets?.includes(address);
  const isPrimary = !user.walletAddress || setPrimary;

  if (isPrimary) {
    // Promote to primary; move old primary into additionalWallets if it exists
    const additional = (user.additionalWallets ?? []).filter((w: string) => w !== address);
    if (user.walletAddress && user.walletAddress !== address) {
      additional.unshift(user.walletAddress);
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { walletAddress: address, additionalWallets: additional },
    });
  } else if (!alreadyInAdditional) {
    // Add as additional wallet
    await prisma.user.update({
      where: { id: user.id },
      data: { additionalWallets: { push: address } },
    });
  }

  const updated = await prisma.user.findUnique({ where: { id: user.id } });
  return NextResponse.json({
    walletAddress: updated?.walletAddress,
    additionalWallets: updated?.additionalWallets ?? [],
  });
}

// DELETE /api/account/wallets — remove a wallet from the account
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('cd_session')?.value;
  const user = await getSessionUser(token || '');
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { address } = await req.json();
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 });

  if (user.walletAddress === address) {
    // Promote first additional wallet to primary, or clear primary
    const [newPrimary, ...rest] = user.additionalWallets ?? [];
    await prisma.user.update({
      where: { id: user.id },
      data: { walletAddress: newPrimary ?? null, additionalWallets: rest ?? [] },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { additionalWallets: (user.additionalWallets ?? []).filter((w: string) => w !== address) },
    });
  }

  const updated = await prisma.user.findUnique({ where: { id: user.id } });
  return NextResponse.json({
    walletAddress: updated?.walletAddress,
    additionalWallets: updated?.additionalWallets ?? [],
  });
}
