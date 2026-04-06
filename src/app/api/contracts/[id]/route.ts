import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        property: true,
        buyer: { select: { id: true, name: true, email: true, walletAddress: true } },
        seller: { select: { id: true, name: true, email: true, walletAddress: true } },
        offChainSteps: { orderBy: { sortOrder: 'asc' } },
        signatures: true,
        generatedDocuments: true,
        dispute: true,
      },
    });
    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    return NextResponse.json(contract);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const contract = await prisma.contract.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json(contract);
  } catch {
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
  }
}
