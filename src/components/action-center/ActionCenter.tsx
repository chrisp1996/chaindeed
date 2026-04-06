'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Clock, AlertTriangle, Upload, ExternalLink, ChevronDown, ChevronUp, Shield, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface OnChainStep {
  id: string; title: string;
  status: 'pending' | 'in_progress' | 'complete' | 'failed';
  txHash?: string; timestamp?: Date; description: string;
}

export interface OffChainStep {
  id: string; stepKey: string; title: string; plainEnglishTitle: string;
  description: string; whyRequired?: string; responsibility: 'buyer' | 'seller' | 'both' | 'title_company' | 'attorney';
  estimatedCost?: string; estimatedTime?: string; isRequired: boolean; isBlocker: boolean;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'BLOCKED' | 'WAIVED';
  uploadedDocCid?: string; notes?: string;
  officialLinks?: { label: string; url: string }[];
  howToComplete?: string[]; legalBasis?: string;
}

const respLabel = { buyer: 'You (Buyer)', seller: 'Seller', both: 'Both parties', title_company: 'Title Company', attorney: 'Attorney' };
const stepStatusConfig = {
  PENDING: { badge: 'pending' as const, label: 'Not started' },
  IN_PROGRESS: { badge: 'info' as const, label: 'In progress' },
  COMPLETE: { badge: 'success' as const, label: 'Complete' },
  BLOCKED: { badge: 'destructive' as const, label: 'Blocked' },
  WAIVED: { badge: 'outline' as const, label: 'Waived' },
};

function OnChainStepItem({ step }: { step: OnChainStep }) {
  const cfg = { pending: { Icon: Circle, color: 'text-muted-foreground', bg: 'bg-muted' }, in_progress: { Icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' }, complete: { Icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' }, failed: { Icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' } };
  const { Icon, color, bg } = cfg[step.status];
  return (
    <div className="flex items-start gap-3 py-3">
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', bg)}>
        <Icon className={cn('h-4 w-4', color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate">{step.title}</p>
          {step.status === 'complete' && step.txHash && (
            <a href={`https://polygonscan.com/tx/${step.txHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0">
              Verified <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{step.description}</p>
        {step.status === 'complete' && step.timestamp && <p className="text-xs text-muted-foreground mt-0.5">{new Date(step.timestamp).toLocaleDateString()}</p>}
      </div>
    </div>
  );
}

function OffChainStepItem({ step, onUpdate, canAct }: { step: OffChainStep; onUpdate?: (id: string, status: string) => Promise<void>; canAct: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { badge, label } = stepStatusConfig[step.status] || stepStatusConfig.PENDING;

  const update = async (status: string) => {
    if (!onUpdate) return;
    setUpdating(true);
    try { await onUpdate(step.id, status); } finally { setUpdating(false); }
  };

  return (
    <div className={cn('rounded-lg border p-3 transition-all', step.status === 'COMPLETE' && 'bg-green-50 border-green-200', step.isBlocker && step.status !== 'COMPLETE' && step.status !== 'WAIVED' && 'border-amber-300 bg-amber-50')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {step.status === 'COMPLETE' ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            : step.isBlocker ? <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            : <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{step.plainEnglishTitle}</p>
              <Badge variant={badge}>{label}</Badge>
              {step.isBlocker && step.status !== 'COMPLETE' && step.status !== 'WAIVED' && <Badge variant="warning">Required to proceed</Badge>}
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-xs text-muted-foreground">{respLabel[step.responsibility]}</span>
              {step.estimatedCost && <span className="text-xs text-muted-foreground">· {step.estimatedCost}</span>}
              {step.estimatedTime && <span className="text-xs text-muted-foreground">· {step.estimatedTime}</span>}
            </div>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground shrink-0">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 pl-7">
          <p className="text-sm">{step.description}</p>

          {step.whyRequired && (
            <div className="rounded-md bg-blue-50 border border-blue-100 p-3">
              <p className="text-xs font-medium text-blue-800 mb-1">Why this is required:</p>
              <p className="text-xs text-blue-700">{step.whyRequired}</p>
              {step.legalBasis && <p className="text-xs text-blue-600 mt-1">Legal basis: {step.legalBasis}</p>}
            </div>
          )}

          {step.howToComplete && step.howToComplete.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2">How to complete this step:</p>
              <ol className="space-y-1">
                {step.howToComplete.map((instr, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="shrink-0 font-medium text-foreground">{i + 1}.</span>
                    <span>{instr}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {step.officialLinks && step.officialLinks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {step.officialLinks.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" />{link.label}
                </a>
              ))}
            </div>
          )}

          {canAct && step.status !== 'COMPLETE' && step.status !== 'WAIVED' && (
            <div className="flex flex-wrap gap-2 pt-1">
              {step.status === 'PENDING' && <Button size="sm" variant="outline" onClick={() => update('IN_PROGRESS')} loading={updating}>Mark In Progress</Button>}
              {(step.status === 'PENDING' || step.status === 'IN_PROGRESS') && (
                <>
                  <Button size="sm" variant="outline" className="gap-2"><Upload className="h-3.5 w-3.5" />Upload Document</Button>
                  <Button size="sm" variant="success" onClick={() => update('COMPLETE')} loading={updating}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Mark Complete</Button>
                </>
              )}
            </div>
          )}

          {step.uploadedDocCid && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 p-2">
              <FileText className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-700">Document uploaded and verified</span>
              <a href={`https://ipfs.io/ipfs/${step.uploadedDocCid}`} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-primary hover:underline flex items-center gap-1">View <ExternalLink className="h-3 w-3" /></a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ActionCenterProps {
  contractId: string;
  onChainSteps: OnChainStep[];
  offChainSteps: OffChainStep[];
  onUpdateOffChainStep?: (stepId: string, status: string) => Promise<void>;
  currentUserRole?: 'buyer' | 'seller' | 'agent' | 'title_company';
}

export function ActionCenter({ contractId, onChainSteps, offChainSteps, onUpdateOffChainStep, currentUserRole = 'buyer' }: ActionCenterProps) {
  const onChainComplete = onChainSteps.filter(s => s.status === 'complete').length;
  const offChainComplete = offChainSteps.filter(s => s.status === 'COMPLETE').length;
  const blockers = offChainSteps.filter(s => s.isBlocker && s.status !== 'COMPLETE' && s.status !== 'WAIVED');

  const canAct = (step: OffChainStep) => {
    if (currentUserRole === 'agent') return true;
    if (currentUserRole === 'buyer' && (step.responsibility === 'buyer' || step.responsibility === 'both')) return true;
    if (currentUserRole === 'seller' && (step.responsibility === 'seller' || step.responsibility === 'both')) return true;
    if (currentUserRole === 'title_company' && step.responsibility === 'title_company') return true;
    return false;
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Transaction Progress</h2>
        <p className="text-sm text-muted-foreground mt-1">Track every step — handled automatically and steps you complete manually.</p>
      </div>

      {blockers.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{blockers.length} required step{blockers.length > 1 ? 's' : ''} blocking progress</p>
            <p className="text-xs text-amber-700 mt-0.5">Complete the highlighted steps below to continue.</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Steps</TabsTrigger>
          <TabsTrigger value="onchain" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" />Automatic ({onChainComplete}/{onChainSteps.length})
          </TabsTrigger>
          <TabsTrigger value="offchain">You Do ({offChainComplete}/{offChainSteps.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /><CardTitle className="text-sm">Handled Automatically</CardTitle></div>
                  <Badge variant="info">{onChainComplete}/{onChainSteps.length}</Badge>
                </div>
                <Progress value={(onChainComplete / Math.max(onChainSteps.length, 1)) * 100} className="h-1.5" />
              </CardHeader>
              <CardContent className="divide-y">
                {onChainSteps.map(s => <OnChainStepItem key={s.id} step={s} />)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-orange-500" /><CardTitle className="text-sm">Steps to Complete</CardTitle></div>
                  <Badge variant={blockers.length > 0 ? 'warning' : 'success'}>{offChainComplete}/{offChainSteps.length}</Badge>
                </div>
                <Progress value={(offChainComplete / Math.max(offChainSteps.length, 1)) * 100} className="h-1.5" />
              </CardHeader>
              <CardContent className="space-y-2">
                {offChainSteps.map(s => <OffChainStepItem key={s.id} step={s} onUpdate={onUpdateOffChainStep} canAct={canAct(s)} />)}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="onchain" className="mt-4">
          <Card><CardContent className="pt-4 divide-y">{onChainSteps.map(s => <OnChainStepItem key={s.id} step={s} />)}</CardContent></Card>
        </TabsContent>

        <TabsContent value="offchain" className="mt-4 space-y-2">
          {offChainSteps.map(s => <OffChainStepItem key={s.id} step={s} onUpdate={onUpdateOffChainStep} canAct={canAct(s)} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
