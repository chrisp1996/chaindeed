'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import { CheckCircle2, ChevronDown, ChevronUp, ArrowRight, Plus } from 'lucide-react';

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

export interface AmendmentPanelProps {
  contractId: string;
  amendments: Amendment[];
  currentUserRole: 'buyer' | 'seller';
  onAmendmentAction: (amendId: string, action: 'accept' | 'decline' | 'revise', changes?: Change[]) => void;
  onProposeChanges: (changes: Change[], summary: string, message?: string) => void;
  contractData: {
    price?: number;
    closingDate?: string;
    inspectionDays?: number;
    conditions?: string;
    earnestMoney?: number;
  };
}

function statusBadgeVariant(status: string): 'warning' | 'success' | 'destructive' | 'info' | 'secondary' {
  switch (status) {
    case 'PENDING': return 'warning';
    case 'ACCEPTED': return 'success';
    case 'DECLINED': return 'destructive';
    case 'REVISED': return 'info';
    case 'SUPERSEDED': return 'secondary';
    default: return 'secondary';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'PENDING': return 'Awaiting Response';
    case 'ACCEPTED': return 'Accepted';
    case 'DECLINED': return 'Declined';
    case 'REVISED': return 'Revised';
    case 'SUPERSEDED': return 'Superseded';
    default: return status;
  }
}

interface AmendmentCardProps {
  amendment: Amendment;
  currentUserRole: 'buyer' | 'seller';
  onAction: (action: 'accept' | 'decline' | 'revise') => void;
}

function AmendmentCard({ amendment, currentUserRole, onAction }: AmendmentCardProps) {
  const [expanded, setExpanded] = useState(amendment.status === 'PENDING');
  const canRespond = amendment.status === 'PENDING' && amendment.proposedBy !== currentUserRole;

  return (
    <Card className={cn(
      'border',
      amendment.status === 'PENDING' ? 'border-amber-200 bg-amber-50/30' : '',
      amendment.status === 'ACCEPTED' ? 'border-green-200 bg-green-50/20' : '',
      amendment.status === 'DECLINED' ? 'border-gray-200 opacity-70' : '',
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold text-sm">
                v{amendment.version} — Changes proposed by{' '}
                <span className="capitalize">{amendment.proposedBy}</span>
              </span>
              <Badge variant={statusBadgeVariant(amendment.status)}>
                {statusLabel(amendment.status)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{amendment.summary}</p>
            {amendment.message && (
              <p className="text-sm italic text-muted-foreground mt-1">"{amendment.message}"</p>
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{formatDate(amendment.createdAt)}</p>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Diff table */}
          {amendment.changes && amendment.changes.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1.5 pr-3 font-medium text-muted-foreground text-xs w-1/3">Field</th>
                    <th className="text-left py-1.5 pr-3 font-medium text-muted-foreground text-xs">Current</th>
                    <th className="py-1.5 px-1 text-muted-foreground text-xs w-4"></th>
                    <th className="text-left py-1.5 font-medium text-muted-foreground text-xs">Proposed</th>
                  </tr>
                </thead>
                <tbody>
                  {amendment.changes.map((change, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium text-xs">{change.label}</td>
                      <td className="py-2 pr-3 text-xs">
                        <span className="line-through text-red-500">{change.oldValue}</span>
                      </td>
                      <td className="py-2 px-1">
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      </td>
                      <td className="py-2 text-xs">
                        <span className="font-semibold text-green-700">{change.newValue}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Accepted banner */}
          {amendment.status === 'ACCEPTED' && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-md px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-sm text-green-800 font-medium">
                Accepted{amendment.respondedBy ? ` by ${amendment.respondedBy}` : ''}
                {amendment.respondedAt ? ` on ${formatDate(amendment.respondedAt)}` : ''}
              </span>
            </div>
          )}

          {/* Declined banner */}
          {amendment.status === 'DECLINED' && (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
              <span className="text-sm text-gray-600">
                Declined{amendment.respondedBy ? ` by ${amendment.respondedBy}` : ''}
                {amendment.respondedAt ? ` on ${formatDate(amendment.respondedAt)}` : ''}
              </span>
            </div>
          )}

          {/* Action buttons for the other party */}
          {canRespond && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onAction('accept')}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Accept All
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => onAction('decline')}
              >
                Decline All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction('revise')}
              >
                Propose Counter-Changes
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ---- Propose Changes Form ----

const INSPECTION_DAY_OPTIONS = [3, 5, 7, 10, 14, 21, 30];

interface ProposeFormProps {
  contractData: AmendmentPanelProps['contractData'];
  currentUserRole: 'buyer' | 'seller';
  onSubmit: (changes: Change[], summary: string, message?: string) => void;
  onCancel: () => void;
}

function ProposeForm({ contractData, currentUserRole, onSubmit, onCancel }: ProposeFormProps) {
  const [price, setPrice] = useState(contractData.price?.toString() || '');
  const [closingDate, setClosingDate] = useState(
    contractData.closingDate
      ? new Date(contractData.closingDate).toISOString().split('T')[0]
      : ''
  );
  const [inspectionDays, setInspectionDays] = useState(contractData.inspectionDays?.toString() || '');
  const [conditions, setConditions] = useState(contractData.conditions || '');
  const [earnestMoney, setEarnestMoney] = useState(contractData.earnestMoney?.toString() || '');
  const [message, setMessage] = useState('');
  const [reviewMode, setReviewMode] = useState(false);

  function buildChanges(): Change[] {
    const changes: Change[] = [];

    const origPrice = contractData.price?.toString() || '';
    if (price !== origPrice && price !== '') {
      changes.push({
        field: 'purchasePrice',
        label: 'Sale Price',
        oldValue: contractData.price ? formatCurrency(contractData.price) : '—',
        newValue: price ? formatCurrency(Number(price)) : price,
        category: 'financial',
      });
    }

    const origClosingDate = contractData.closingDate
      ? new Date(contractData.closingDate).toISOString().split('T')[0]
      : '';
    if (closingDate !== origClosingDate && closingDate !== '') {
      changes.push({
        field: 'closingDate',
        label: 'Closing Date',
        oldValue: contractData.closingDate ? formatDate(contractData.closingDate) : '—',
        newValue: closingDate ? formatDate(closingDate) : closingDate,
        category: 'timeline',
      });
    }

    const origInspection = contractData.inspectionDays?.toString() || '';
    if (inspectionDays !== origInspection && inspectionDays !== '') {
      changes.push({
        field: 'inspectionDays',
        label: 'Inspection Period',
        oldValue: contractData.inspectionDays ? `${contractData.inspectionDays} days` : '—',
        newValue: `${inspectionDays} days`,
        category: 'timeline',
      });
    }

    const origConditions = contractData.conditions || '';
    if (conditions !== origConditions && conditions.trim() !== '') {
      changes.push({
        field: 'conditions',
        label: 'Conditions / Contingencies',
        oldValue: origConditions || '—',
        newValue: conditions,
        category: 'conditions',
      });
    }

    const origEarnest = contractData.earnestMoney?.toString() || '';
    if (earnestMoney !== origEarnest && earnestMoney !== '') {
      changes.push({
        field: 'earnestMoney',
        label: 'Earnest Money / Deposit',
        oldValue: contractData.earnestMoney ? formatCurrency(contractData.earnestMoney) : '—',
        newValue: earnestMoney ? formatCurrency(Number(earnestMoney)) : earnestMoney,
        category: 'financial',
      });
    }

    return changes;
  }

  const changes = buildChanges();
  const hasChanges = changes.length > 0;

  function handleSubmit() {
    if (!hasChanges) return;
    const summary = changes.map(c => `${c.label}: ${c.oldValue} → ${c.newValue}`).join('; ');
    onSubmit(changes, summary, message || undefined);
  }

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Sale Price */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Sale Price</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0 w-20 truncate">
              Current: {contractData.price ? formatCurrency(contractData.price) : '—'}
            </span>
            <Input
              type="number"
              placeholder="New price"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Closing Date */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Closing Date</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0 w-20 truncate">
              Current: {contractData.closingDate ? formatDate(contractData.closingDate) : '—'}
            </span>
            <Input
              type="date"
              value={closingDate}
              onChange={e => setClosingDate(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Inspection Period */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Inspection Period</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0 w-20 truncate">
              Current: {contractData.inspectionDays ? `${contractData.inspectionDays} days` : '—'}
            </span>
            <Select value={inspectionDays} onValueChange={setInspectionDays}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select days" />
              </SelectTrigger>
              <SelectContent>
                {INSPECTION_DAY_OPTIONS.map(d => (
                  <SelectItem key={d} value={d.toString()}>{d} days</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Earnest Money */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Earnest Money / Deposit</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0 w-20 truncate">
              Current: {contractData.earnestMoney ? formatCurrency(contractData.earnestMoney) : '—'}
            </span>
            <Input
              type="number"
              placeholder="New amount"
              value={earnestMoney}
              onChange={e => setEarnestMoney(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Conditions */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Conditions / Contingencies</Label>
        <p className="text-xs text-muted-foreground">
          Current: {contractData.conditions || '—'}
        </p>
        <Textarea
          placeholder="Proposed conditions or contingencies..."
          value={conditions}
          onChange={e => setConditions(e.target.value)}
          className="text-sm min-h-20"
        />
      </div>

      <Separator />

      {/* Message */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Your Message (optional)</Label>
        <Textarea
          placeholder="Add a note to the other party..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="text-sm min-h-16"
        />
      </div>

      {/* Review summary */}
      {reviewMode && hasChanges && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-foreground">Summary of proposed changes:</p>
          <ul className="space-y-1">
            {changes.map((c, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="font-medium text-foreground">{c.label}:</span>
                <span className="line-through text-red-500">{c.oldValue}</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-semibold text-green-700">{c.newValue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!hasChanges && (
        <p className="text-xs text-muted-foreground italic">
          No changes detected yet. Modify at least one field above to propose a change.
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {!reviewMode ? (
          <Button
            size="sm"
            variant="outline"
            disabled={!hasChanges}
            onClick={() => setReviewMode(true)}
          >
            Review Changes ({changes.length})
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={!hasChanges}
            onClick={handleSubmit}
            className="bg-primary"
          >
            Send Proposed Changes
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ---- Main AmendmentPanel ----

export function AmendmentPanel({
  contractId: _contractId,
  amendments,
  currentUserRole,
  onAmendmentAction,
  onProposeChanges,
  contractData,
}: AmendmentPanelProps) {
  const [showForm, setShowForm] = useState(false);

  const hasPending = amendments.some(a => a.status === 'PENDING');

  function handleAction(amendId: string, action: 'accept' | 'decline' | 'revise') {
    if (action === 'revise') {
      onAmendmentAction(amendId, 'revise');
      setShowForm(true);
    } else {
      onAmendmentAction(amendId, action);
    }
  }

  function handleProposeSubmit(changes: Change[], summary: string, message?: string) {
    onProposeChanges(changes, summary, message);
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      {/* Amendment History */}
      {amendments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Amendment History</h3>
          {amendments.map(amendment => (
            <AmendmentCard
              key={amendment.id}
              amendment={amendment}
              currentUserRole={currentUserRole}
              onAction={(action) => handleAction(amendment.id, action)}
            />
          ))}
        </div>
      )}

      {amendments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No amendments or negotiations yet.</p>
          <p className="text-xs mt-1">Use the button below to propose changes to the agreement terms.</p>
        </div>
      )}

      <Separator />

      {/* Propose Changes Section */}
      {!hasPending && !showForm && (
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Propose Changes to This Agreement
          </Button>
        </div>
      )}

      {hasPending && !showForm && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          There is a pending amendment awaiting response. You can propose counter-changes after responding.
        </p>
      )}

      {showForm && (
        <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
          <h3 className="text-sm font-semibold">Propose Changes</h3>
          <p className="text-xs text-muted-foreground">
            Modify any fields below. Only changed fields will be included in your proposal.
          </p>
          <ProposeForm
            contractData={contractData}
            currentUserRole={currentUserRole}
            onSubmit={handleProposeSubmit}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
    </div>
  );
}
