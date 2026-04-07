import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, emailTemplate } from '@/lib/notifications';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { action, adminNote } = await req.json(); // action: 'approve' | 'reject'

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  try {
    const kycStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { kycStatus },
    });

    // Log the admin action
    await prisma.adminAuditLog.create({
      data: {
        adminId: 'admin',
        action: `KYC_${kycStatus}`,
        entityType: 'USER',
        entityId: params.id,
        metadata: { note: adminNote || `KYC ${kycStatus.toLowerCase()} via admin panel` },
      },
    });

    // Create in-app notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: action === 'approve' ? 'KYC_APPROVED' : 'KYC_REJECTED',
        message: action === 'approve'
          ? 'Your identity verification has been approved. You can now invest in properties.'
          : `Your identity verification was not approved. ${adminNote || 'Please contact support for more information.'}`,
        channel: 'IN_APP',
        sentAt: new Date(),
      },
    });

    // Send email notification
    if (user.email) {
      const subject = action === 'approve'
        ? 'Your ChainDeed identity verification is approved ✓'
        : 'ChainDeed identity verification update';

      const html = action === 'approve'
        ? emailTemplate(`
            <h2 style="color:#0f172a">Identity Verified ✓</h2>
            <p>Hi ${user.name || 'there'},</p>
            <p>Your identity has been successfully verified. You're now approved to invest in tokenized properties on ChainDeed.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/invest" style="display:inline-block;background:#0ea5e9;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:16px">Browse Investment Properties</a>
          `)
        : emailTemplate(`
            <h2 style="color:#0f172a">Identity Verification Update</h2>
            <p>Hi ${user.name || 'there'},</p>
            <p>We were unable to verify your identity at this time.</p>
            ${adminNote ? `<p><strong>Reason:</strong> ${adminNote}</p>` : ''}
            <p>Please contact <a href="mailto:support@chaindeed.io">support@chaindeed.io</a> for assistance.</p>
          `);

      await sendEmail(user.email, subject, html);
    }

    return NextResponse.json({ success: true, kycStatus });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update KYC status' }, { status: 500 });
  }
}
