import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStateConfig } from '@/config/stateLaws';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (userId) where.OR = [{ buyerId: userId }, { sellerId: userId }, { agentId: userId }];
    if (status) where.status = status;

    const contracts = await prisma.contract.findMany({
      where,
      include: { property: true, buyer: { select: { id: true, name: true, email: true } }, seller: { select: { id: true, name: true, email: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(contracts);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, buyerId, sellerId, propertyId, state, wizardData, ...rest } = body;

    const contract = await prisma.contract.create({
      data: { type, buyerId, sellerId, propertyId, state, wizardData, ...rest },
    });

    // Auto-create off-chain steps if state is provided
    if (state && (state === 'OH' || state === 'KY' || state === 'IN')) {
      const stateConfig = getStateConfig(state);
      if (stateConfig) {
        await prisma.offChainStep.createMany({
          data: stateConfig.offChainSteps.map(step => ({
            contractId: contract.id,
            stepKey: step.key,
            state,
            title: step.title,
            description: step.description,
            responsibility: step.responsibility.toUpperCase(),
            estimatedCost: step.estimatedCost,
            estimatedTime: step.estimatedTime,
            isRequired: step.isRequired,
            isBlocker: step.isBlocker,
            sortOrder: step.sortOrder,
            status: 'PENDING',
          })),
        });
      }
    }

    return NextResponse.json(contract, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
  }
}
