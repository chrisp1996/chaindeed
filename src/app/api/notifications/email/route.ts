import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  const { to, subject, html } = await req.json();
  if (!to || !subject || !html) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const sent = await sendEmail(to, subject, html);
  return NextResponse.json({ sent });
}
