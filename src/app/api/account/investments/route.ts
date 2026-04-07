import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('cd_session')?.value;
  const user = await getSessionUser(token || '');
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const holdings = await prisma.investmentHolding.findMany({
      where: { userId: user.id },
      include: {
        offering: {
          include: { property: true },
        },
      },
      orderBy: { purchasedAt: 'desc' },
    });

    return NextResponse.json(holdings);
  } catch (err) {
    console.error(err);
    return NextResponse.json([]);
  }
}
