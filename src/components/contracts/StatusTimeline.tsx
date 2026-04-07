'use client';

import { CheckCircle2, Circle, Clock, AlertTriangle, Eye, PenLine, DollarSign, FileCheck, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

export interface TimelineEvent {
  id: string;
  status: 'complete' | 'active' | 'pending' | 'blocked';
  icon: 'created' | 'viewed' | 'signed' | 'amended' | 'funded' | 'conditions' | 'closed';
  title: string;
  description: string;
  timestamp?: Date | string;
  actor?: string;
  badge?: string;
}

interface StatusTimelineProps {
  events: TimelineEvent[];
  contractId: string;
}

function EventIcon({ icon, status }: { icon: TimelineEvent['icon']; status: TimelineEvent['status'] }) {
  const iconMap = {
    created: FileCheck,
    viewed: Eye,
    signed: PenLine,
    amended: PenLine,
    funded: DollarSign,
    conditions: CheckCircle2,
    closed: Home,
  };
  const IconComponent = iconMap[icon] || Circle;

  if (status === 'complete') {
    return (
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-green-100 border-2 border-green-400 shrink-0">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
      </div>
    );
  }
  if (status === 'active') {
    return (
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 border-2 border-blue-400 shrink-0 relative">
        <span className="absolute inset-0 rounded-full bg-blue-200 animate-ping opacity-50" />
        <IconComponent className="w-4 h-4 text-blue-600 relative z-10" />
      </div>
    );
  }
  if (status === 'blocked') {
    return (
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-100 border-2 border-red-400 shrink-0">
        <AlertTriangle className="w-5 h-5 text-red-600" />
      </div>
    );
  }
  // pending
  return (
    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted border-2 border-border shrink-0">
      <Circle className="w-4 h-4 text-muted-foreground" />
    </div>
  );
}

export function StatusTimeline({ events, contractId: _contractId }: StatusTimelineProps) {
  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const isActive = event.status === 'active';

        return (
          <div key={event.id} className="flex gap-4">
            {/* Left: icon + connector line */}
            <div className="flex flex-col items-center">
              <EventIcon icon={event.icon} status={event.status} />
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 flex-1 mt-1 mb-1 min-h-6',
                    event.status === 'complete' ? 'bg-green-300' : 'border-l-2 border-dashed border-border'
                  )}
                />
              )}
            </div>

            {/* Right: content */}
            <div
              className={cn(
                'flex-1 pb-6 rounded-lg px-3 py-2 -ml-1',
                isActive ? 'bg-blue-50 border border-blue-100' : 'bg-transparent'
              )}
            >
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span className={cn('font-semibold text-sm', event.status === 'pending' ? 'text-muted-foreground' : 'text-foreground')}>
                  {event.title}
                </span>
                {event.badge && (
                  <Badge variant={isActive ? 'info' : event.status === 'complete' ? 'success' : 'pending'} className="text-xs">
                    {event.badge}
                  </Badge>
                )}
                {isActive && (
                  <Badge variant="info" className="text-xs">In Progress</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{event.description}</p>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                {event.timestamp && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(event.timestamp)}
                  </span>
                )}
                {event.actor && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {event.actor}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Helper to build timeline from contract data ----

interface ContractData {
  id: string;
  status: string;
  createdAt: string | Date;
  purchasePrice?: number;
  closingDate?: string | Date;
}

interface ViewRecord {
  id: string;
  viewedBy: string;
  viewedAt: string | Date;
}

interface AmendmentRecord {
  id: string;
  version: number;
  status: string;
  proposedBy: string;
  summary: string;
  createdAt: string | Date;
  respondedAt?: string | Date;
}

const STATUS_ORDER: Record<string, number> = {
  DRAFT: 0,
  PENDING_SIGNATURES: 1,
  ACTIVE: 2,
  IN_ESCROW: 3,
  PENDING_CLOSING: 4,
  CLOSED: 5,
  CANCELLED: 5,
  DISPUTED: 2,
};

function statusReached(currentStatus: string, targetStatus: string): boolean {
  return (STATUS_ORDER[currentStatus] ?? 0) >= (STATUS_ORDER[targetStatus] ?? 0);
}

export function buildTimelineFromContract(
  contract: ContractData,
  views: ViewRecord[],
  amendments: AmendmentRecord[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const st = contract.status;

  // 1. Created
  events.push({
    id: 'created',
    status: 'complete',
    icon: 'created',
    title: 'Agreement created',
    description: 'The purchase agreement was drafted and saved.',
    timestamp: contract.createdAt,
    actor: undefined,
  });

  // 2. Viewed by buyer
  const buyerViews = views.filter(v => v.viewedBy === 'buyer');
  if (buyerViews.length > 0) {
    events.push({
      id: 'viewed-buyer',
      status: 'complete',
      icon: 'viewed',
      title: 'Viewed by buyer',
      description: 'The buyer has reviewed the agreement.',
      timestamp: buyerViews[0].viewedAt,
      actor: 'Buyer',
    });
  }

  // 3. Viewed by seller
  const sellerViews = views.filter(v => v.viewedBy === 'seller');
  if (sellerViews.length > 0) {
    events.push({
      id: 'viewed-seller',
      status: 'complete',
      icon: 'viewed',
      title: 'Viewed by seller',
      description: 'The seller has reviewed the agreement.',
      timestamp: sellerViews[0].viewedAt,
      actor: 'Seller',
    });
  }

  // 4. Amendments
  const sortedAmendments = [...amendments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  for (const amendment of sortedAmendments) {
    const isResponded = amendment.status !== 'PENDING' && amendment.status !== 'SUPERSEDED';
    const isPending = amendment.status === 'PENDING';
    events.push({
      id: `amendment-${amendment.id}`,
      status: isPending ? 'active' : 'complete',
      icon: 'amended',
      title: `Changes proposed by ${amendment.proposedBy}`,
      description: amendment.summary,
      timestamp: amendment.createdAt,
      actor: amendment.proposedBy,
      badge: amendment.status === 'ACCEPTED'
        ? 'Accepted'
        : amendment.status === 'DECLINED'
        ? 'Declined'
        : amendment.status === 'REVISED'
        ? 'Revised'
        : amendment.status === 'SUPERSEDED'
        ? 'Superseded'
        : 'Pending response',
    });
  }

  // 5. Signatures required
  const signaturesComplete = statusReached(st, 'ACTIVE');
  const signaturesActive = st === 'PENDING_SIGNATURES';
  events.push({
    id: 'signatures',
    status: signaturesComplete ? 'complete' : signaturesActive ? 'active' : 'pending',
    icon: 'signed',
    title: 'Signatures required',
    description: 'Both buyer and seller must sign the agreement to proceed.',
    timestamp: signaturesComplete ? undefined : undefined,
  });

  // 6. Funds deposited into escrow
  const escrowComplete = statusReached(st, 'IN_ESCROW');
  const escrowActive = st === 'ACTIVE';
  events.push({
    id: 'escrow',
    status: escrowComplete ? 'complete' : escrowActive ? 'active' : 'pending',
    icon: 'funded',
    title: 'Funds deposited into escrow',
    description: 'Buyer deposits earnest money into secure hold.',
  });

  // 7. All conditions met
  const conditionsComplete = statusReached(st, 'PENDING_CLOSING');
  const conditionsActive = st === 'IN_ESCROW';
  events.push({
    id: 'conditions',
    status: conditionsComplete ? 'complete' : conditionsActive ? 'active' : 'pending',
    icon: 'conditions',
    title: 'All conditions met',
    description: 'Title clear, disclosures delivered, inspection complete.',
  });

  // 8. Agreement closed
  const closedComplete = st === 'CLOSED';
  const closingActive = st === 'PENDING_CLOSING';
  events.push({
    id: 'closed',
    status: closedComplete ? 'complete' : closingActive ? 'active' : 'pending',
    icon: 'closed',
    title: 'Agreement closed',
    description: 'Ownership transferred and deed recorded.',
    timestamp: closedComplete && contract.closingDate ? contract.closingDate : undefined,
  });

  return events;
}
