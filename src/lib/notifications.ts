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
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.warn('RESEND_API_KEY not set'); return false; }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.FROM_EMAIL || 'noreply@chaindeed.io', to, subject, html }),
    });
    return res.ok;
  } catch { return false; }
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
