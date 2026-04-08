import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; revId: string } }
) {
  const token = req.cookies.get('cd_session')?.value;
  const user = await getSessionUser(token ?? '');
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { action, respondedBy } = await req.json();

  if (!['accept', 'decline'].includes(action)) {
    return NextResponse.json({ error: 'action must be accept or decline' }, { status: 400 });
  }

  const revision = await prisma.contractRevision.findUnique({ where: { id: params.revId } });
  if (!revision)              return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
  if (revision.status !== 'PENDING') return NextResponse.json({ error: 'Revision is not pending' }, { status: 409 });

  // Prevent the proposing party from accepting their own revision
  if (action === 'accept' && revision.authorId === user.id) {
    return NextResponse.json({ error: 'You cannot accept your own revision' }, { status: 403 });
  }

  const updated = await prisma.contractRevision.update({
    where: { id: params.revId },
    data: {
      status:      action === 'accept' ? 'ACCEPTED' : 'DECLINED',
      respondedAt: new Date(),
      respondedBy: respondedBy ?? user.email,
    },
  });

  // On acceptance: update the contract's live documentHtml to the proposed content
  if (action === 'accept') {
    await prisma.contract.update({
      where: { id: params.id },
      data:  { documentHtml: revision.proposedHtml },
    });
  }

  await prisma.adminAuditLog.create({
    data: {
      adminId:    user.id,
      action:     action === 'accept' ? 'DOCUMENT_REVISION_ACCEPTED' : 'DOCUMENT_REVISION_DECLINED',
      entityType: 'CONTRACT',
      entityId:   params.id,
      metadata:   { revisionId: params.revId, respondedBy: respondedBy ?? user.email },
    },
  });

  return NextResponse.json(updated);
}
