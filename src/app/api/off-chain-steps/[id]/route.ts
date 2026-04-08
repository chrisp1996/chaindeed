import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status, uploadedDocCid, notes } = await req.json();

    // Resolve the session user
    const token = req.cookies.get('cd_session')?.value;
    const sessionUser = token ? await getSessionUser(token) : null;

    if (!sessionUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Load the step and its contract to check role
    const step = await prisma.offChainStep.findUnique({
      where: { id: params.id },
      include: {
        contract: {
          select: { buyerId: true, sellerId: true, agentId: true, titleCompanyEmail: true },
        },
      },
    });

    if (!step) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 });
    }

    const { contract } = step;

    // Determine the session user's role on this contract
    let userRole: 'buyer' | 'seller' | 'agent' | 'title_company' | null = null;
    if (contract.buyerId === sessionUser.id)  userRole = 'buyer';
    else if (contract.sellerId === sessionUser.id) userRole = 'seller';
    else if (contract.agentId  === sessionUser.id) userRole = 'agent';
    else if (contract.titleCompanyEmail && sessionUser.email.toLowerCase() === contract.titleCompanyEmail.toLowerCase()) {
      userRole = 'title_company';
    } else if (sessionUser.isAdmin) {
      userRole = 'agent'; // admins can do anything
    }

    if (!userRole) {
      return NextResponse.json({ error: 'You are not a party to this contract' }, { status: 403 });
    }

    // Check that the user's role matches the step's responsibility
    const resp = step.responsibility.toLowerCase();
    const canAct =
      userRole === 'agent' ||
      resp === 'both' ||
      (userRole === 'buyer'         && resp === 'buyer') ||
      (userRole === 'seller'        && resp === 'seller') ||
      (userRole === 'title_company' && (resp === 'title_company' || resp === 'attorney'));

    if (!canAct) {
      return NextResponse.json(
        { error: `This step is assigned to ${resp}. You are logged in as ${userRole}.` },
        { status: 403 }
      );
    }

    const data: Record<string, unknown> = { status };
    if (uploadedDocCid) data.uploadedDocCid = uploadedDocCid;
    if (notes)          data.notes = notes;
    if (status === 'COMPLETE') {
      data.completedAt = new Date();
      data.completedByUserId = sessionUser.id;
    }

    const updated = await prisma.offChainStep.update({ where: { id: params.id }, data });

    // If this was a blocker and is now complete, check if all blockers are done
    if (updated.isBlocker && status === 'COMPLETE') {
      const remainingBlockers = await prisma.offChainStep.count({
        where: { contractId: updated.contractId, isBlocker: true, status: { not: 'COMPLETE' } },
      });
      if (remainingBlockers === 0) {
        await prisma.contract.update({
          where: { id: updated.contractId },
          data: { status: 'ACTIVE' },
        }).catch(() => {});
      }
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update step' }, { status: 500 });
  }
}
