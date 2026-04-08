import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStateConfig } from '@/config/stateLaws';
import { sendEmail, buildInvitationEmail, buildTitleCompanyInvitationEmail } from '@/lib/notifications';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status  = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (userId) where.OR = [{ buyerId: userId }, { sellerId: userId }, { agentId: userId }];
    if (status)  where.status = status;

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        property: true,
        buyer:  { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(contracts);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, state, wizardData, ...rest } = body;

    // ── 1. Authenticate the creating user ───────────────────────────────────
    const token       = req.cookies.get('cd_session')?.value;
    const sessionUser = token ? await getSessionUser(token) : null;

    const wd = (wizardData as Record<string, any> | null) ?? {};

    // ── 2. Resolve buyer / seller IDs ───────────────────────────────────────
    // The wizard collects names + emails for both parties but does not look up
    // user IDs.  We do that here server-side so the dashboard query works.
    //
    // Rule: the session user is treated as the CREATOR.  They may be the buyer
    // or seller depending on what role they selected.  The counterparty is
    // looked up by email; if no account exists yet they'll be null until they
    // create one via the invite link.

    let buyerId:  string | null = body.buyerId  ?? null;
    let sellerId: string | null = body.sellerId ?? null;

    if (sessionUser) {
      // Determine creator's role from wizardData if not explicitly passed
      const creatorRole = (wd.creatorRole as string | undefined)?.toLowerCase();

      if (!buyerId && !sellerId) {
        // Default: creator is the seller (most common — someone listing their asset)
        if (creatorRole === 'buyer') {
          buyerId = sessionUser.id;
        } else {
          sellerId = sessionUser.id;
        }
      }
    }

    // Look up counterparty by email if they already have an account
    if (sellerId === null && wd.sellerEmail) {
      const found = await prisma.user.findUnique({ where: { email: wd.sellerEmail as string }, select: { id: true } });
      if (found) sellerId = found.id;
    }
    if (buyerId === null && wd.buyerEmail) {
      const found = await prisma.user.findUnique({ where: { email: wd.buyerEmail as string }, select: { id: true } });
      if (found) buyerId = found.id;
    }

    // ── 3. Create the contract ───────────────────────────────────────────────
    const contract = await prisma.contract.create({
      data: {
        type,
        state: state ?? null,
        buyerId,
        sellerId,
        wizardData,
        ...rest,
      },
      include: {
        buyer:  { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
    });

    // ── 4. Off-chain steps ───────────────────────────────────────────────────
    if (state && ['OH', 'KY', 'IN'].includes(state)) {
      const stateConfig = getStateConfig(state);
      if (stateConfig) {
        await prisma.offChainStep.createMany({
          data: stateConfig.offChainSteps.map((step: any) => ({
            contractId:    contract.id,
            stepKey:       step.key,
            state,
            title:         step.title,
            description:   step.description,
            responsibility: step.responsibility.toUpperCase(),
            estimatedCost: step.estimatedCost,
            estimatedTime: step.estimatedTime,
            isRequired:    step.isRequired,
            isBlocker:     step.isBlocker,
            sortOrder:     step.sortOrder,
            status:        'PENDING',
          })),
        });
      }
    }

    // ── 5. Send invitation emails ────────────────────────────────────────────
    const appUrl      = process.env.NEXT_PUBLIC_APP_URL || 'https://chaindeed.vercel.app';
    const senderName  = sessionUser?.name ?? sessionUser?.email ?? 'A ChainDeed user';
    const assetDescription =
      (wd.assetDescription as string | undefined) ??
      (wd.propertyAddress as string | undefined) ??
      (type as string).replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

    // Figure out who the counterparty is (not the session user)
    const counterpartyEmail: string | null =
      (sessionUser?.id === sellerId)
        ? (contract.buyer?.email  ?? wd.buyerEmail  ?? null)
        : (contract.seller?.email ?? wd.sellerEmail ?? null);

    const counterpartyName: string =
      (sessionUser?.id === sellerId)
        ? (contract.buyer?.name  ?? wd.buyerName  ?? 'the buyer')
        : (contract.seller?.name ?? wd.sellerName ?? 'the seller');

    if (counterpartyEmail) {
      const html = buildInvitationEmail(
        counterpartyName,
        senderName,
        contract.id,
        type as string,
        assetDescription,
        appUrl,
        wd.titleCompanyName as string | undefined,
        wd.titleCompanyEmail as string | undefined,
      );

      const emailOk = await sendEmail(
        counterpartyEmail,
        `You've been invited to review an agreement on ChainDeed`,
        html,
      );

      // Log result so errors are visible in server logs
      if (!emailOk) {
        console.error(`[contracts/POST] Invitation email FAILED to ${counterpartyEmail} for contract ${contract.id}`);
      }

      // Create an in-app notification for the counterparty if they have an account
      const counterpartyUserId =
        sessionUser?.id === sellerId ? contract.buyer?.id : contract.seller?.id;

      if (counterpartyUserId) {
        await prisma.notification.create({
          data: {
            userId:     counterpartyUserId,
            contractId: contract.id,
            type:       'GENERAL',
            message:    `${senderName} has invited you to review a new agreement: "${assetDescription}".`,
            channel:    'IN_APP',
            sentAt:     new Date(),
          },
        });
      }
    }

    // ── 6. Title company invitation ─────────────────────────────────────────
    const titleCompanyEmail = wd.titleCompanyEmail as string | undefined;
    const titleCompanyName  = (wd.titleCompanyName as string | undefined) ?? 'Title Company';

    if (titleCompanyEmail) {
      const titleSteps: string[] = [];
      if (state && ['OH', 'KY', 'IN'].includes(state)) {
        const stateConfig = getStateConfig(state as 'OH' | 'KY' | 'IN');
        if (stateConfig) {
          stateConfig.offChainSteps
            .filter((s: any) => s.responsibility === 'title_company')
            .forEach((s: any) => titleSteps.push(s.title));
        }
      }
      if (!titleSteps.length) {
        titleSteps.push(
          'Order and certify title search',
          'Issue title commitment / insurance',
          'Confirm funds received at closing',
          'File deed and closing documents',
        );
      }
      const html = buildTitleCompanyInvitationEmail(
        titleCompanyName,
        contract.id,
        type as string,
        assetDescription,
        appUrl,
        titleSteps,
      );

      const tcOk = await sendEmail(
        titleCompanyEmail,
        `You've been designated as title company on a ChainDeed agreement`,
        html,
      );
      if (!tcOk) {
        console.error(`[contracts/POST] Title company email FAILED to ${titleCompanyEmail} for contract ${contract.id}`);
      }
    }

    return NextResponse.json(contract, { status: 201 });

  } catch (err) {
    console.error('[contracts/POST] Error:', err);
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
  }
}
