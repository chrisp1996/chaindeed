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

  const revisions = await prisma.contractRevision.findMany({
    where: { contractId: params.id },
    orderBy: { version: 'desc' },
    include: { comments: { orderBy: { createdAt: 'asc' } } },
  });

  return NextResponse.json(revisions);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.cookies.get('cd_session')?.value;
  const user = await getSessionUser(token ?? '');
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { proposedHtml, authorRole, authorName, message } = await req.json();

  if (!proposedHtml || !authorRole) {
    return NextResponse.json({ error: 'proposedHtml and authorRole are required' }, { status: 400 });
  }

  // Fetch the current accepted document as the base for this revision
  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    select: { documentHtml: true },
  });
  if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });

  // Supersede any existing PENDING revision so only one pending round exists at a time
  await prisma.contractRevision.updateMany({
    where: { contractId: params.id, status: 'PENDING' },
    data: { status: 'SUPERSEDED' },
  });

  const count = await prisma.contractRevision.count({ where: { contractId: params.id } });

  const revision = await prisma.contractRevision.create({
    data: {
      contractId:   params.id,
      version:      count + 1,
      baseHtml:     contract.documentHtml ?? '',
      proposedHtml,
      authorRole,
      authorId:     user.id,
      authorName:   authorName ?? user.name ?? user.email,
      message:      message ?? null,
      status:       'PENDING',
    },
  });

  await prisma.adminAuditLog.create({
    data: {
      adminId:    user.id,
      action:     'DOCUMENT_REVISION_PROPOSED',
      entityType: 'CONTRACT',
      entityId:   params.id,
      metadata:   { revisionId: revision.id, version: revision.version, authorRole },
    },
  });

  return NextResponse.json(revision, { status: 201 });
}
