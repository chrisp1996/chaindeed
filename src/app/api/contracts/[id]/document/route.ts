/**
 * GET  /api/contracts/[id]/document  → { documentHtml: string | null }
 * PATCH /api/contracts/[id]/document  ← { documentHtml: string }  → updated contract fragment
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.cookies.get('cd_session')?.value;
  const user = await getSessionUser(token ?? '');
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    select: { documentHtml: true },
  });
  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ documentHtml: contract.documentHtml });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.cookies.get('cd_session')?.value;
  const user = await getSessionUser(token ?? '');
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { documentHtml } = await req.json();
  if (typeof documentHtml !== 'string') {
    return NextResponse.json({ error: 'documentHtml must be a string' }, { status: 400 });
  }

  // Verify contract exists and user is a party
  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    select: { buyerId: true, sellerId: true, agentId: true },
  });
  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isParty = contract.buyerId === user.id || contract.sellerId === user.id || contract.agentId === user.id || user.isAdmin;
  if (!isParty) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const updated = await prisma.contract.update({
    where: { id: params.id },
    data:  { documentHtml },
    select: { id: true, documentHtml: true, updatedAt: true },
  });

  await prisma.adminAuditLog.create({
    data: {
      adminId:    user.id,
      action:     'DOCUMENT_SAVED',
      entityType: 'CONTRACT',
      entityId:   params.id,
      metadata:   { length: documentHtml.length },
    },
  });

  return NextResponse.json(updated);
}
