import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('cd_session')?.value;
  const user = await getSessionUser(token || '');
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('cd_session')?.value;
  const user = await getSessionUser(token || '');
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { id, markAllRead } = await req.json();

  // Mark all unread as read
  if (markAllRead) {
    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  // Mark single notification as read
  const notification = await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });
  return NextResponse.json(notification);
}
