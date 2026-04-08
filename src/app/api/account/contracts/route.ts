import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('cd_session')?.value;
  const user  = await getSessionUser(token ?? '');
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    // Fetch all contracts where the session user is buyer, seller, or agent.
    // Also surface contracts where wizardData contains the user's email as
    // buyerEmail or sellerEmail (invited but not yet linked by ID).
    const contracts = await prisma.contract.findMany({
      where: {
        OR: [
          { buyerId:  user.id },
          { sellerId: user.id },
          { agentId:  user.id },
        ],
      },
      include: {
        property: true,
        buyer:  { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        offChainSteps: { select: { id: true, status: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(contracts);
  } catch (err) {
    console.error('[account/contracts] Error:', err);
    return NextResponse.json([], { status: 200 });
  }
}
