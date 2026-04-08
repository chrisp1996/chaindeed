import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  const token = req.cookies.get('cd_session')?.value;
  const user = await getSessionUser(token ?? '');
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { resolved, resolvedBy } = await req.json();

  const updated = await prisma.contractComment.update({
    where: { id: params.commentId },
    data: {
      resolved:   !!resolved,
      resolvedAt: resolved ? new Date() : null,
      resolvedBy: resolved ? (resolvedBy ?? user.email) : null,
    },
  });

  return NextResponse.json(updated);
}
