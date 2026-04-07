import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { viewedBy } = await req.json();
    const view = await prisma.contractView.create({
      data: { contractId: params.id, viewedBy },
    });
    return NextResponse.json(view, { status: 201 });
  } catch {
    return NextResponse.json({ ok: true }); // silent fail
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const views = await prisma.contractView.findMany({
      where: { contractId: params.id },
      orderBy: { viewedAt: 'asc' },
    });
    return NextResponse.json(views);
  } catch {
    return NextResponse.json([]);
  }
}
