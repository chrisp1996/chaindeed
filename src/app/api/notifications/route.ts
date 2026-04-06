import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const { id, readAt } = await req.json();
  const notification = await prisma.notification.update({
    where: { id },
    data: { readAt: readAt ? new Date() : null },
  });
  return NextResponse.json(notification);
}
