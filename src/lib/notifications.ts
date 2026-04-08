import { prisma } from './prisma';

type NotificationType = 'SIGNATURE_NEEDED' | 'DOCUMENT_UPLOADED' | 'DOCUMENT_REQUIRED' | 'DEADLINE_APPROACHING' | 'STEP_COMPLETED' | 'STEP_OVERDUE' | 'FUNDS_DEPOSITED' | 'FUNDS_RELEASED' | 'DISPUTE_RAISED' | 'HOMESTEAD_REMINDER' | 'SALES_DISCLOSURE_REMINDER' | 'KYC_APPROVED' | 'KYC_REJECTED' | 'GENERAL';
type NotificationChannel = 'EMAIL' | 'IN_APP' | 'SMS';

export async function createNotification(input: {
  userId: string; contractId?: string; type: NotificationType;
  message: string; metadata?: Record<string, unknown>; channel: NotificationChannel;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      contractId: input.contractId,
      type: input.type,
      message: input.message,
      metadata: input.metadata as any,
      channel: input.channel,
      sentAt: new Date(),
    },
  });
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  return sendEmailWithAttachment(to, subject, html);
}

export async function sendEmailWithAttachment(
  to: string,
  subject: string,
  html: string,
  attachment?: { filename: string; content: Buffer },
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.warn('RESEND_API_KEY not set'); return false; }
  try {
    const body: Record<string, unknown> = {
      from: process.env.FROM_EMAIL || 'noreply@chaindeed.io',
      to,
      subject,
      html,
    };
    if (attachment) {
      body.attachments = [{ filename: attachment.filename, content: attachment.content.toString('base64') }];
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch { return false; }
}

export function buildInvitationEmail(
  recipientName: string,
  senderName: string,
  contractId: string,
  contractType: string,
  assetDescription: string,
  appUrl: string,
): string {
  const typeLabel = contractType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  const loginUrl = `${appUrl}/auth/login?redirect=/contracts/${contractId}`;
  const signupUrl = `${appUrl}/auth/signup?redirect=/contracts/${contractId}`;
  return emailTemplate(
    `<h2 style="color:#0f172a">You've been invited to an agreement</h2>
    <p>Hi ${recipientName},</p>
    <p><strong>${senderName}</strong> has created a <strong>${typeLabel}</strong> on ChainDeed and listed you as a party. The agreement covers:</p>
    <p style="background:#f8fafc;border-left:3px solid #0ea5e9;padding:10px 14px;border-radius:4px;font-weight:600">${assetDescription}</p>
    <p>You'll need a ChainDeed account to view, negotiate, and sign the agreement. It only takes a minute to create one.</p>
    <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap">
      <a href="${signupUrl}" style="display:inline-block;background:#0ea5e9;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Create Account & View Agreement</a>
      <a href="${loginUrl}" style="display:inline-block;background:white;color:#0ea5e9;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;border:1px solid #0ea5e9">Sign In</a>
    </div>
    <p style="color:#64748b;font-size:13px;margin-top:20px">If you believe you received this email in error, you can safely ignore it.</p>`
  );
}

export function buildTitleCompanyInvitationEmail(
  titleCompanyName: string,
  contractId: string,
  contractType: string,
  assetDescription: string,
  appUrl: string,
  titleCompanySteps: string[],
): string {
  const typeLabel = contractType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  const loginUrl = `${appUrl}/auth/login?redirect=/contracts/${contractId}`;
  const signupUrl = `${appUrl}/auth/signup?redirect=/contracts/${contractId}`;
  const stepsHtml = titleCompanySteps.length
    ? `<ul style="padding-left:18px;margin:8px 0">${titleCompanySteps.map(s => `<li style="margin-bottom:4px;font-size:13px;color:#334155">${s}</li>`).join('')}</ul>`
    : '<p style="font-size:13px;color:#64748b">Your assigned steps will appear when you access the agreement.</p>';
  return emailTemplate(
    `<h2 style="color:#0f172a">You've been assigned as Title Company on a ChainDeed agreement</h2>
    <p>Hi ${titleCompanyName},</p>
    <p>A <strong>${typeLabel}</strong> has been created on ChainDeed for the following property, and your firm has been designated as the title company:</p>
    <p style="background:#f8fafc;border-left:3px solid #0ea5e9;padding:10px 14px;border-radius:4px;font-weight:600">${assetDescription}</p>
    <p><strong>Your assigned responsibilities include:</strong></p>
    ${stepsHtml}
    <p>You'll need a ChainDeed account to access the agreement, view your checklist, upload documents, and mark conditions as satisfied. Creating an account is free.</p>
    <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap">
      <a href="${signupUrl}" style="display:inline-block;background:#0ea5e9;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Create Account & View Agreement</a>
      <a href="${loginUrl}" style="display:inline-block;background:white;color:#0ea5e9;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;border:1px solid #0ea5e9">Sign In</a>
    </div>
    <p style="color:#64748b;font-size:13px;margin-top:20px">Only conditions within your assigned scope can be marked complete under your login. If you believe you received this in error, you can safely ignore it.</p>`
  );
}

export function buildExecutedContractEmail(
  recipientName: string,
  contractId: string,
  assetDescription: string,
  appUrl: string,
): string {
  return emailTemplate(
    `<h2 style="color:#0f172a">Your agreement has been fully executed</h2>
    <p>Hi ${recipientName},</p>
    <p>Great news — your agreement for <strong>${assetDescription}</strong> has been signed by all parties and is now fully executed.</p>
    <p>A certified copy of the executed contract is attached to this email as a PDF for your records. You can also view the agreement and download it at any time from your ChainDeed account.</p>
    <a href="${appUrl}/contracts/${contractId}" style="display:inline-block;background:#0ea5e9;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:16px;font-weight:600">View Executed Agreement</a>
    <p style="color:#64748b;font-size:13px;margin-top:20px">Please retain this document for your records. ChainDeed is not a law firm. Consult an attorney with any questions about your rights and obligations.</p>`
  );
}

export function emailTemplate(content: string): string {
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><div style="background:#0ea5e9;padding:24px;border-radius:8px 8px 0 0"><h1 style="color:white;margin:0;font-size:22px">ChainDeed</h1></div><div style="padding:32px;background:white;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">${content}<p style="color:#94a3b8;font-size:12px;margin-top:32px">ChainDeed — Digital Real Estate Agreements. Questions? Reply to this email.</p></div></div>`;
}

export function buildDeadlineEmail(recipientName: string, contractId: string, deadlineType: string, daysUntil: number, propertyAddress: string): string {
  const urgency = daysUntil <= 1 ? '🚨 URGENT: ' : daysUntil <= 3 ? '⚠️ ' : '';
  return emailTemplate(`<h2 style="color:#0f172a">${urgency}${deadlineType} Deadline in ${daysUntil} Day${daysUntil !== 1 ? 's' : ''}</h2><p>Hi ${recipientName},</p><p>Your <strong>${deadlineType}</strong> deadline for <strong>${propertyAddress}</strong> is approaching in <strong>${daysUntil} day${daysUntil !== 1 ? 's' : ''}</strong>.</p><a href="${process.env.NEXT_PUBLIC_APP_URL}/contracts/${contractId}" style="display:inline-block;background:#0ea5e9;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:16px">View Your Transaction</a>`);
}

export function buildHomesteadEmail(recipientName: string, state: string, propertyAddress: string, estimatedSavings: number): string {
  const info: Record<string, { office: string; deadline: string; formUrl: string }> = {
    IN: { office: 'County Auditor', deadline: 'January 5', formUrl: 'https://www.in.gov/dlgf/files/State_Form_5473.pdf' },
    OH: { office: 'County Auditor', deadline: 'December 31', formUrl: 'https://tax.ohio.gov/static/forms/real_estate/dte105a.pdf' },
    KY: { office: 'County PVA', deadline: 'December 31', formUrl: 'https://www.kentucky.gov' },
  };
  const { office, deadline, formUrl } = info[state] || info['OH'];
  return emailTemplate(`<h2 style="color:#0f172a">💰 Save up to $${estimatedSavings.toFixed(0)}/year on property taxes!</h2><p>Hi ${recipientName},</p><p>As a homeowner at <strong>${propertyAddress}</strong>, you may qualify for a homestead tax deduction saving <strong>$${estimatedSavings.toFixed(0)}/year</strong>.</p><p>File with your <strong>${office}</strong> by <strong>${deadline}</strong>.</p><a href="${formUrl}" style="display:inline-block;background:#0ea5e9;color:white;padding:12px 24px;border-radius:6px;text-decoration:none">Download Homestead Form</a>`);
}
