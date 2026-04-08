'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import {
  CheckCircle2, ChevronDown, ChevronUp, ArrowRight, Send,
  Clock, XCircle, RotateCcw, FileText,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Change {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
  category?: string;
}

export interface Amendment {
  id: string;
  version: number;
  status: string;
  proposedBy: string;
  summary: string;
  message?: string;
  changes: Change[];
  createdAt: string;
  respondedAt?: string;
  respondedBy?: string;
}

export interface NegotiationPanelProps {
  contractId: string;
  amendments: Amendment[];
  currentUserRole: 'buyer' | 'seller';
  sellerName?: string;
  buyerName?: string;
  onAmendmentAction: (amendId: string, action: 'accept' | 'decline' | 'revise', changes?: Change[]) => Promise<void>;
  onProposeChanges: (changes: Change[], summary: string, message?: string) => Promise<void>;
  contractData: {
    price?: number;
    closingDate?: string;
    inspectionDays?: number;
    conditions?: string;
    earnestMoney?: number;
    deedType?: string;
  };
  onPendingChangesChange?: (changes: Change[]) => void; // notifies parent for doc highlight
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INSPECTION_OPTIONS = [3, 5, 7, 10, 14, 21, 30, 45, 60, 90];

function fmtVal(field: string, val: string | number | undefined): string {
  if (!val) return '—';
  if (field === 'purchasePrice' || field === 'earnestMoney') return formatCurrency(Number(val));
  if (field === 'inspectionDays') return `${val} days`;
  if (field === 'closingDate') return formatDate(String(val));
  return String(val);
}

function statusConfig(status: string) {
  switch (status) {
    case 'PENDING':    return { variant: 'warning'     as const, label: 'Awaiting Response', Icon: Clock      };
    case 'ACCEPTED':   return { variant: 'success'     as const, label: 'Accepted',          Icon: CheckCircle2};
    case 'DECLINED':   return { variant: 'destructive' as const, label: 'Declined',          Icon: XCircle    };
    case 'REVISED':    return { variant: 'info'        as const, label: 'Counter-Proposed',  Icon: RotateCcw  };
    case 'SUPERSEDED': return { variant: 'secondary'   as const, label: 'Superseded',        Icon: FileText   };
    default:           return { variant: 'secondary'   as const, label: status,              Icon: FileText   };
  }
}

// ─── Diff table ───────────────────────────────────────────────────────────────

function DiffTable({ changes }: { changes: Change[] }) {
  return (
    <div className="overflow-x-auto rounded border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground w-1/4">Field</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Current Value</th>
            <th className="py-2 px-2 w-6"></th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Proposed Value</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((c, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-2.5 px-3 text-xs font-semibold">{c.label}</td>
              <td className="py-2.5 px-3 text-xs text-red-500 line-through">{c.oldValue}</td>
              <td className="py-2 px-2 text-muted-foreground">
                <ArrowRight className="h-3 w-3" />
              </td>
              <td className="py-2.5 px-3 text-xs font-bold text-green-700">{c.newValue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Propose Form ─────────────────────────────────────────────────────────────

interface ProposeFormProps {
  contractData: NegotiationPanelProps['contractData'];
  currentUserRole: 'buyer' | 'seller';
  onSubmit: (changes: Change[], summary: string, message?: string) => Promise<void>;
  onCancel: () => void;
}

function ProposeForm({ contractData, currentUserRole: _role, onSubmit, onCancel }: ProposeFormProps) {
  const [price,        setPrice]        = useState(contractData.price?.toString() || '');
  const [closingDate,  setClosingDate]  = useState(contractData.closingDate ? new Date(contractData.closingDate).toISOString().split('T')[0] : '');
  const [inspDays,     setInspDays]     = useState(contractData.inspectionDays?.toString() || '');
  const [earnest,      setEarnest]      = useState(contractData.earnestMoney?.toString() || '');
  const [conditions,   setConditions]   = useState(contractData.conditions || '');
  const [deedType,     setDeedType]     = useState(contractData.deedType || '');
  const [message,      setMessage]      = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [reviewing,    setReviewing]    = useState(false);

  const DEED_OPTIONS = ['General Warranty Deed','Special Warranty Deed','Quit Claim Deed','Bargain and Sale Deed',"Trustee's Deed","Fiduciary / Executor's Deed"];

  function buildChanges(): Change[] {
    const out: Change[] = [];
    const origPrice = contractData.price?.toString() || '';
    if (price && price !== origPrice)
      out.push({ field:'purchasePrice', label:'Sale Price', category:'financial',
        oldValue: fmtVal('purchasePrice', contractData.price),
        newValue: fmtVal('purchasePrice', Number(price)) });

    const origCD = contractData.closingDate ? new Date(contractData.closingDate).toISOString().split('T')[0] : '';
    if (closingDate && closingDate !== origCD)
      out.push({ field:'closingDate', label:'Closing Date', category:'timeline',
        oldValue: fmtVal('closingDate', contractData.closingDate),
        newValue: fmtVal('closingDate', closingDate) });

    const origInsp = contractData.inspectionDays?.toString() || '';
    if (inspDays && inspDays !== origInsp)
      out.push({ field:'inspectionDays', label:'Inspection / Due Diligence Period', category:'timeline',
        oldValue: fmtVal('inspectionDays', contractData.inspectionDays),
        newValue: fmtVal('inspectionDays', inspDays) });

    const origEarnest = contractData.earnestMoney?.toString() || '';
    if (earnest && earnest !== origEarnest)
      out.push({ field:'earnestMoney', label:'Earnest Money Deposit', category:'financial',
        oldValue: fmtVal('earnestMoney', contractData.earnestMoney),
        newValue: fmtVal('earnestMoney', Number(earnest)) });

    const origCond = contractData.conditions || '';
    if (conditions.trim() && conditions !== origCond)
      out.push({ field:'conditions', label:'Conditions / Contingencies', category:'conditions',
        oldValue: origCond || '—', newValue: conditions });

    const origDeed = contractData.deedType || '';
    if (deedType && deedType !== origDeed)
      out.push({ field:'deedType', label:'Deed Type', category:'terms',
        oldValue: origDeed || '—', newValue: deedType });

    return out;
  }

  const changes  = buildChanges();
  const hasChanges = changes.length > 0;

  async function handleSubmit() {
    if (!hasChanges) return;
    setSubmitting(true);
    try {
      const summary = changes.map(c => `${c.label}: ${c.oldValue} → ${c.newValue}`).join('; ');
      await onSubmit(changes, summary, message || undefined);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Sale price */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Sale Price</Label>
          <p className="text-xs text-muted-foreground">Current: {contractData.price ? formatCurrency(contractData.price) : '—'}</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input type="number" placeholder="Proposed price" value={price} onChange={e => setPrice(e.target.value)} className="pl-7 h-9 text-sm" />
          </div>
        </div>

        {/* Earnest money */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Earnest Money Deposit</Label>
          <p className="text-xs text-muted-foreground">Current: {contractData.earnestMoney ? formatCurrency(contractData.earnestMoney) : '—'}</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input type="number" placeholder="Proposed amount" value={earnest} onChange={e => setEarnest(e.target.value)} className="pl-7 h-9 text-sm" />
          </div>
        </div>

        {/* Closing date */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Closing Date</Label>
          <p className="text-xs text-muted-foreground">Current: {contractData.closingDate ? formatDate(contractData.closingDate) : '—'}</p>
          <Input type="date" value={closingDate} onChange={e => setClosingDate(e.target.value)} className="h-9 text-sm" min={new Date().toISOString().split('T')[0]} />
        </div>

        {/* Inspection period */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Inspection / Due Diligence Period</Label>
          <p className="text-xs text-muted-foreground">Current: {contractData.inspectionDays ? `${contractData.inspectionDays} days` : '—'}</p>
          <Select value={inspDays} onValueChange={setInspDays}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select days" /></SelectTrigger>
            <SelectContent>{INSPECTION_OPTIONS.map(d => <SelectItem key={d} value={d.toString()}>{d} days</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {/* Deed type */}
        {contractData.deedType !== undefined && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-semibold text-muted-foreground">Deed Type</Label>
            <p className="text-xs text-muted-foreground">Current: {contractData.deedType || '—'}</p>
            <Select value={deedType} onValueChange={setDeedType}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select deed type" /></SelectTrigger>
              <SelectContent>{DEED_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Conditions */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">Conditions / Contingencies</Label>
        <p className="text-xs text-muted-foreground">Current: {contractData.conditions || '—'}</p>
        <Textarea placeholder="Proposed conditions..." value={conditions} onChange={e => setConditions(e.target.value)} className="text-sm min-h-[80px]" />
      </div>

      <Separator />

      {/* Message */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">Message to Other Party (optional)</Label>
        <Textarea placeholder="Explain your proposal…" value={message} onChange={e => setMessage(e.target.value)} className="text-sm min-h-[64px]" />
      </div>

      {/* Review mode */}
      {reviewing && hasChanges && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-1.5">
          <p className="text-xs font-semibold">Your proposed changes:</p>
          <DiffTable changes={changes} />
        </div>
      )}

      {!hasChanges && (
        <p className="text-xs text-muted-foreground italic">Change at least one field above to submit a proposal.</p>
      )}

      <div className="flex flex-wrap gap-2">
        {!reviewing ? (
          <Button size="sm" variant="outline" disabled={!hasChanges} onClick={() => setReviewing(true)}>
            Review Changes ({changes.length})
          </Button>
        ) : (
          <Button size="sm" disabled={!hasChanges || submitting} onClick={handleSubmit} className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            {submitting ? 'Sending…' : 'Send Proposal to Other Party'}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ─── History card ─────────────────────────────────────────────────────────────

function HistoryCard({ amendment, currentUserRole, onAction, responding, setResponding }: {
  amendment: Amendment;
  currentUserRole: 'buyer' | 'seller';
  onAction: (action: 'accept' | 'decline' | 'revise') => Promise<void>;
  responding: boolean;
  setResponding: (v: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(amendment.status === 'PENDING');
  const [acting,   setActing]   = useState(false);
  const { variant, label, Icon } = statusConfig(amendment.status);
  const canRespond = amendment.status === 'PENDING' && amendment.proposedBy !== currentUserRole;
  const proposed   = amendment.proposedBy.charAt(0).toUpperCase() + amendment.proposedBy.slice(1);

  async function act(action: 'accept' | 'decline' | 'revise') {
    setActing(true);
    try { await onAction(action); } finally { setActing(false); }
  }

  return (
    <div className={cn(
      'rounded-xl border transition-all',
      amendment.status === 'PENDING'   && 'border-amber-300 bg-amber-50/40',
      amendment.status === 'ACCEPTED'  && 'border-green-200 bg-green-50/30',
      amendment.status === 'DECLINED'  && 'border-gray-200 opacity-60',
      amendment.status === 'SUPERSEDED'&& 'border-gray-100 opacity-40',
    )}>
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="flex items-start gap-3 min-w-0">
          <Icon className={cn('h-4 w-4 shrink-0 mt-0.5',
            amendment.status === 'PENDING'   && 'text-amber-500',
            amendment.status === 'ACCEPTED'  && 'text-green-600',
            amendment.status === 'DECLINED'  && 'text-gray-400',
            amendment.status === 'SUPERSEDED'&& 'text-gray-300',
          )} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">Round {amendment.version}</span>
              <Badge variant={variant} className="text-xs">{label}</Badge>
              <span className="text-xs text-muted-foreground">Proposed by {proposed}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{amendment.summary}</p>
            {amendment.message && (
              <p className="text-xs italic text-muted-foreground mt-0.5">"{amendment.message}"</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(amendment.createdAt)}</p>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="shrink-0 text-muted-foreground hover:text-foreground">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t pt-3">
          {amendment.changes?.length > 0 && <DiffTable changes={amendment.changes} />}

          {amendment.status === 'ACCEPTED' && (
            <div className="flex items-center gap-2 text-green-700 text-xs font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Accepted{amendment.respondedBy ? ` by ${amendment.respondedBy}` : ''}
              {amendment.respondedAt ? ` · ${formatDate(amendment.respondedAt)}` : ''}
            </div>
          )}

          {canRespond && !responding && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1.5" disabled={acting}
                onClick={() => act('accept')}>
                <CheckCircle2 className="h-3.5 w-3.5" />Accept All Changes
              </Button>
              <Button size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-50 gap-1.5" disabled={acting}
                onClick={() => { act('revise'); setResponding(true); }}>
                <RotateCcw className="h-3.5 w-3.5" />Counter-Propose
              </Button>
              <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5" disabled={acting}
                onClick={() => act('decline')}>
                <XCircle className="h-3.5 w-3.5" />Decline
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main NegotiationPanel ────────────────────────────────────────────────────

export function NegotiationPanel({
  contractId: _cid,
  amendments,
  currentUserRole,
  sellerName,
  buyerName,
  onAmendmentAction,
  onProposeChanges,
  contractData,
  onPendingChangesChange,
}: NegotiationPanelProps) {
  const [showForm,    setShowForm]    = useState(false);
  const [responding,  setResponding]  = useState(false);

  const pendingAmendment   = amendments.find(a => a.status === 'PENDING');
  const isMyTurn           = !pendingAmendment || pendingAmendment.proposedBy !== currentUserRole;
  const waitingOnMe        = !!pendingAmendment && pendingAmendment.proposedBy !== currentUserRole;
  const waitingOnOther     = !!pendingAmendment && pendingAmendment.proposedBy === currentUserRole;

  const otherParty = currentUserRole === 'buyer'
    ? (sellerName ? sellerName.split(' ')[0] : 'Seller')
    : (buyerName  ? buyerName.split(' ')[0]  : 'Buyer');
  const myPartyLabel = currentUserRole === 'buyer' ? 'Buyer' : 'Seller';

  const isFullyAgreed = amendments.length > 0 &&
    !pendingAmendment &&
    amendments.some(a => a.status === 'ACCEPTED');

  async function handleAction(amendId: string, action: 'accept' | 'decline' | 'revise') {
    await onAmendmentAction(amendId, action);
    if (action !== 'revise') setResponding(false);
  }

  async function handlePropose(changes: Change[], summary: string, message?: string) {
    onPendingChangesChange?.(changes);
    await onProposeChanges(changes, summary, message);
    setShowForm(false);
    setResponding(false);
    onPendingChangesChange?.([]);
  }

  return (
    <div className="space-y-5">
      {/* ── Turn indicator ── */}
      {isFullyAgreed ? (
        <div className="flex items-center gap-3 rounded-xl border-2 border-green-400 bg-green-50 px-4 py-4">
          <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
          <div>
            <p className="font-bold text-green-900">Both Parties Have Agreed</p>
            <p className="text-sm text-green-700 mt-0.5">
              All proposed changes have been accepted. The contract is ready for signatures.
            </p>
          </div>
        </div>
      ) : waitingOnOther ? (
        <div className="flex items-start gap-3 rounded-xl border-2 border-sky-300 bg-sky-50 px-4 py-4">
          <Clock className="h-6 w-6 text-sky-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sky-900">Waiting for {otherParty} to Respond</p>
            <p className="text-sm text-sky-700 mt-0.5">
              You proposed changes in Round {pendingAmendment.version}. {otherParty} will receive a notification
              and can accept, decline, or counter-propose.
            </p>
            <p className="text-xs text-sky-600 mt-1 italic">
              You cannot propose new changes until {otherParty} responds.
            </p>
          </div>
        </div>
      ) : waitingOnMe ? (
        <div className="flex items-start gap-3 rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold shrink-0">!</div>
          <div>
            <p className="font-bold text-amber-900">Your Turn — {otherParty} Proposed Changes</p>
            <p className="text-sm text-amber-800 mt-0.5">
              {otherParty} has proposed changes to the agreement below. Review them and choose to
              accept, counter-propose, or decline.
            </p>
          </div>
        </div>
      ) : amendments.length === 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4">
          <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">No proposals yet</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Either party can propose changes to the agreement terms below. The other party will
              be notified and given the chance to accept, counter, or decline.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-4">
          <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-primary">Your Turn — Propose Changes or Confirm Agreement</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              No pending proposals. Use the button below to propose further changes, or both parties
              can proceed to signing if the current terms are acceptable.
            </p>
          </div>
        </div>
      )}

      {/* ── Negotiation round history ── */}
      {amendments.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Negotiation History ({amendments.length} round{amendments.length !== 1 ? 's' : ''})
          </p>
          {amendments.map(a => (
            <HistoryCard
              key={a.id}
              amendment={a}
              currentUserRole={currentUserRole}
              onAction={(action) => handleAction(a.id, action)}
              responding={responding}
              setResponding={setResponding}
            />
          ))}
        </div>
      )}

      <Separator />

      {/* ── Propose / Counter form ── */}
      {isMyTurn && !isFullyAgreed && !showForm && !responding && (
        <div className="space-y-2">
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="gap-2">
            <Send className="h-3.5 w-3.5" />
            {amendments.length === 0 ? 'Propose Changes to This Agreement' : 'Propose Additional Changes'}
          </Button>
          <p className="text-xs text-muted-foreground">
            As <strong>{myPartyLabel}</strong>, you can propose changes to any term.
            {otherParty} will be notified and must respond before the next round.
          </p>
        </div>
      )}

      {(showForm || responding) && (
        <div className="rounded-xl border bg-muted/20 p-5 space-y-3">
          <div>
            <h3 className="font-semibold text-sm">
              {responding ? `Counter-Proposal (Round ${(pendingAmendment?.version ?? 0) + 1})` : 'Propose Changes'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Only fields you modify will be included. {otherParty} will see exactly what you're proposing
              and must respond before you can propose again.
            </p>
          </div>
          <ProposeForm
            contractData={contractData}
            currentUserRole={currentUserRole}
            onSubmit={handlePropose}
            onCancel={() => { setShowForm(false); setResponding(false); onPendingChangesChange?.([]); }}
          />
        </div>
      )}

      {!isMyTurn && !isFullyAgreed && (
        <p className="text-xs text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">
          You cannot propose new changes until {otherParty} responds to your current proposal.
        </p>
      )}
    </div>
  );
}
