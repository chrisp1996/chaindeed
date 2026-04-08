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

  const comments = await prisma.contractComment.findMany({
    where: { contractId: params.id },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(comments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.cookies.get('cd_session')?.value;
  const user = await getSessionUser(token ?? '');
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { authorRole, authorName, anchorText, text, revisionId } = await req.json();

  if (!authorRole || !text) {
    return NextResponse.json({ error: 'authorRole and text are required' }, { status: 400 });
  }

  const comment = await prisma.contractComment.create({
    data: {
      contractId: params.id,
      revisionId: revisionId ?? null,
      authorRole,
      authorId:   user.id,
      authorName: authorName ?? user.name ?? user.email,
      anchorText: anchorText ?? null,
      text,
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
