import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStateConfig } from '@/config/stateLaws';
import { sendEmail, buildInvitationEmail, buildTitleCompanyInvitationEmail } from '@/lib/notifications';
import { getSessionUser } from '@/lib/auth';

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

    // Determine the creating user from session
    const token = req.cookies.get('cd_session')?.value;
    const sessionUser = token ? await getSessionUser(token) : null;

    const contract = await prisma.contract.create({
      data: { type, buyerId, sellerId, propertyId, state, wizardData, ...rest },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
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

    // Send invitation email to the counterparty
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chaindeed.vercel.app';
    const wd = (wizardData as Record<string, string> | null) ?? {};
    const senderName = sessionUser?.name || sessionUser?.email || 'A ChainDeed user';
    const assetDescription =
      wd.assetDescription || wd.propertyAddress || wd.address ||
      (type as string).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());

    const counterpartyEmail =
      sessionUser?.id === buyerId
        ? (contract.seller?.email ?? wd.sellerEmail ?? null)
        : (contract.buyer?.email ?? wd.buyerEmail ?? null);

    const counterpartyName =
      sessionUser?.id === buyerId
        ? (contract.seller?.name ?? wd.sellerName ?? 'the other party')
        : (contract.buyer?.name ?? wd.buyerName ?? 'the other party');

    if (counterpartyEmail) {
      const html = buildInvitationEmail(
        counterpartyName as string,
        senderName,
        contract.id,
        type as string,
        assetDescription,
        appUrl,
        wd.titleCompanyName as string | undefined,
        wd.titleCompanyEmail as string | undefined,
      );
      sendEmail(
        counterpartyEmail,
        `You've been invited to review an agreement on ChainDeed`,
        html,
      ).catch(() => {});
    }

    // Send title company invitation if provided
    const titleCompanyEmail = wd.titleCompanyEmail as string | undefined;
    const titleCompanyName = (wd.titleCompanyName as string | undefined) || 'Title Company';
    if (titleCompanyEmail) {
      // Build a plain-English list of title_company-responsibility steps for this contract
      const titleSteps: string[] = [];
      if (state && (state === 'OH' || state === 'KY' || state === 'IN')) {
        const stateConfig = getStateConfig(state as 'OH' | 'KY' | 'IN');
        if (stateConfig) {
          stateConfig.offChainSteps
            .filter(s => s.responsibility === 'title_company')
            .forEach(s => titleSteps.push(s.title));
        }
      }
      // Always include the universal title steps if not already added
      if (!titleSteps.length) {
        titleSteps.push('Order and certify title search', 'Issue title commitment / insurance', 'Confirm funds received at closing', 'File deed and closing documents');
      }
      const html = buildTitleCompanyInvitationEmail(
        titleCompanyName,
        contract.id,
        type as string,
        assetDescription,
        appUrl,
        titleSteps,
      );
      sendEmail(
        titleCompanyEmail,
        `You've been designated as title company on a ChainDeed agreement`,
        html,
      ).catch(() => {});
    }

    return NextResponse.json(contract, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
  }
}
