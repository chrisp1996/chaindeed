'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { ActionCenter, OnChainStep, OffChainStep } from '@/components/action-center/ActionCenter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatCurrency, getContractStatusLabel, formatDate } from '@/lib/utils';
import { FileText, Home, DollarSign, Calendar, Download, AlertTriangle, CheckCircle2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { StatusTimeline, buildTimelineFromContract } from '@/components/contracts/StatusTimeline';
import { NegotiationPanel, Amendment, Change } from '@/components/contracts/NegotiationPanel';
import { ContractDocument } from '@/components/contracts/ContractDocument';

// Mock on-chain steps — in production, read from deployed contract events
const MOCK_ON_CHAIN_STEPS: OnChainStep[] = [
  { id: '1', title: 'Agreement created', status: 'complete', description: 'Digital agreement recorded permanently', timestamp: new Date(Date.now() - 86400000 * 3) },
  { id: '2', title: 'Buyer confirmed', status: 'complete', description: 'Buyer reviewed and confirmed the agreement', timestamp: new Date(Date.now() - 86400000 * 2) },
  { id: '3', title: 'Seller confirmed', status: 'in_progress', description: 'Waiting for seller to review and confirm' },
  { id: '4', title: 'Earnest money deposited', status: 'pending', description: 'Buyer deposits funds into secure hold' },
  { id: '5', title: 'All conditions met', status: 'pending', description: 'Title clear, disclosures delivered, inspection done' },
  { id: '6', title: 'Deed registered digitally', status: 'pending', description: 'Ownership permanently recorded' },
];

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [contract, setContract] = useState<any>(null);
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [views, setViews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingChanges, setPendingChanges] = useState<Change[]>([]);

  // Derive the current user's role from the loaded contract + session
  const currentUserRole = useMemo<'buyer' | 'seller' | 'agent' | 'title_company'>(() => {
    if (!user || !contract) return 'buyer';
    if (contract.buyerId  === user.id) return 'buyer';
    if (contract.sellerId === user.id) return 'seller';
    if (contract.agentId  === user.id) return 'agent';
    const tcEmail = contract.titleCompanyEmail ?? (contract.wizardData as any)?.titleCompanyEmail;
    if (tcEmail && user.email.toLowerCase() === tcEmail.toLowerCase()) return 'title_company';
    return 'buyer'; // fallback — read-only access still shows relevant info
  }, [user, contract]);

  const fetchAmendments = useCallback(async () => {
    try {
      const res = await fetch(`/api/contracts/${id}/amendments`);
      const data = await res.json();
      setAmendments(Array.isArray(data) ? data : []);
    } catch {
      setAmendments([]);
    }
  }, [id]);

  const fetchViews = useCallback(async () => {
    try {
      const res = await fetch(`/api/contracts/${id}/view`);
      const data = await res.json();
      setViews(Array.isArray(data) ? data : []);
    } catch {
      setViews([]);
    }
  }, [id]);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [contractRes] = await Promise.all([
          fetch(`/api/contracts/${id}`),
        ]);
        const contractData = await contractRes.json();
        setContract(contractData);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    loadAll();
    fetchAmendments();
    fetchViews();

    // Record view
    fetch(`/api/contracts/${id}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viewedBy: user?.email ?? 'unknown' }),
    }).catch(() => {});
  }, [id, fetchAmendments, fetchViews]);

  const handleApproveTitleCompany = async () => {
    const field = currentUserRole === 'buyer' ? 'buyerApprovedTitleCompany' : 'sellerApprovedTitleCompany';
    const res = await fetch(`/api/contracts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: true }),
    });
    if (res.ok) {
      const updated = await res.json();
      setContract(updated);
      toast.success('Title company designation approved.');
    } else {
      toast.error('Failed to record approval. Please try again.');
    }
  };

  const handleUpdateStep = async (stepId: string, status: string) => {
    const res = await fetch(`/api/off-chain-steps/${stepId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setContract((prev: any) => prev ? {
        ...prev,
        offChainSteps: prev.offChainSteps.map((s: any) => s.id === stepId ? updated : s),
      } : prev);
      toast.success('Step updated!');
    }
  };

  const handleAmendmentAction = async (amendId: string, action: 'accept' | 'decline' | 'revise') => {
    try {
      const res = await fetch(`/api/contracts/${id}/amendments/${amendId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, respondedBy: currentUserRole }),
      });
      if (res.ok) {
        const actionLabel = action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'marked for revision';
        toast.success(`Amendment ${actionLabel}.`);
        await fetchAmendments();
        // Re-fetch contract to get updated status
        const contractRes = await fetch(`/api/contracts/${id}`);
        if (contractRes.ok) setContract(await contractRes.json());
      } else {
        toast.error('Failed to update amendment.');
      }
    } catch {
      toast.error('Failed to update amendment.');
    }
  };

  const handleProposeChanges = async (changes: Change[], summary: string, message?: string) => {
    try {
      const res = await fetch(`/api/contracts/${id}/amendments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposedBy: currentUserRole, changes, summary, message }),
      });
      if (res.ok) {
        toast.success('Changes proposed successfully.');
        await fetchAmendments();
      } else {
        toast.error('Failed to propose changes.');
      }
    } catch {
      toast.error('Failed to propose changes.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  if (!contract) return (
    <div className="text-center py-20 space-y-3">
      <p className="text-lg font-semibold">Agreement not found</p>
      <Button asChild variant="outline"><a href="/dashboard">Back to Dashboard</a></Button>
    </div>
  );

  const offChainSteps: OffChainStep[] = (contract.offChainSteps || []).map((s: any) => ({
    id: s.id, stepKey: s.stepKey, title: s.title, plainEnglishTitle: s.title,
    description: s.description, responsibility: s.responsibility?.toLowerCase() || 'buyer',
    estimatedCost: s.estimatedCost, estimatedTime: s.estimatedTime,
    isRequired: s.isRequired, isBlocker: s.isBlocker,
    status: s.status as OffChainStep['status'],
    uploadedDocCid: s.uploadedDocCid, notes: s.notes,
  }));

  const timelineEvents = buildTimelineFromContract(contract, views, amendments);

  const wd = (contract.wizardData as Record<string, any>) ?? {};

  const contractData = {
    price: contract.purchasePrice ?? undefined,
    closingDate: contract.closingDate ?? undefined,
    inspectionDays: wd.assetFields?.inspectionDays ? Number(wd.assetFields.inspectionDays) : undefined,
    conditions: wd.assetFields?.conditions ?? undefined,
    earnestMoney: contract.earnestMoneyAmount ?? undefined,
    deedType: wd.assetFields?.deedType ?? undefined,
  };

  const buyerName  = contract.buyer?.name  ?? contract.buyer?.email  ?? undefined;
  const sellerName = contract.seller?.name ?? contract.seller?.email ?? undefined;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{contract.property?.streetAddress || 'Transaction Agreement'}</h1>
            <Badge variant="info">{getContractStatusLabel(contract.status)}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {contract.property?.city && `${contract.property.city}, ${contract.property.state} · `}
            {contract.purchasePrice && `${formatCurrency(contract.purchasePrice)} · `}
            Created {formatDate(contract.createdAt)}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={`/api/contracts/${id}/pdf`} download>
            <Download className="h-4 w-4 mr-2" />Download Summary PDF
          </a>
        </Button>
      </div>

      {/* Key details */}
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'Purchase Price', value: contract.purchasePrice ? formatCurrency(contract.purchasePrice) : '—' },
          { icon: Home, label: 'Property', value: contract.property?.streetAddress || '—' },
          { icon: Calendar, label: 'Closing Date', value: contract.closingDate ? formatDate(contract.closingDate) : 'TBD' },
          { icon: FileText, label: 'State', value: contract.state || '—' },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Icon className="h-4 w-4" />
                <span className="text-xs">{label}</span>
              </div>
              <p className="font-semibold text-sm truncate">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Title Company Approval Card — shown when a title company is designated */}
      {contract.titleCompanyEmail && (() => {
        const tcName     = contract.titleCompany ?? (contract.wizardData as any)?.titleCompanyName ?? 'Title Company';
        const tcEmail    = contract.titleCompanyEmail;
        const buyerOk    = contract.buyerApprovedTitleCompany;
        const sellerOk   = contract.sellerApprovedTitleCompany;
        const bothOk     = buyerOk && sellerOk;
        const myApproval = currentUserRole === 'buyer' ? buyerOk : currentUserRole === 'seller' ? sellerOk : true;
        const canApprove = (currentUserRole === 'buyer' || currentUserRole === 'seller') && !myApproval;

        return (
          <div className={`rounded-xl border-2 p-5 space-y-4 ${bothOk ? 'border-green-300 bg-green-50' : 'border-amber-400 bg-amber-50'}`}>
            <div className="flex items-start gap-3">
              {bothOk
                ? <ShieldCheck className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                : <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${bothOk ? 'text-green-900' : 'text-amber-900'}`}>
                  {bothOk ? 'Title Company Approved by Both Parties' : 'Title Company Designation — Approval Required'}
                </p>
                <p className={`text-xs mt-0.5 ${bothOk ? 'text-green-700' : 'text-amber-700'}`}>
                  <strong>{tcName}</strong> ({tcEmail})
                </p>
              </div>
            </div>

            {!bothOk && (
              <div className="rounded-lg border border-amber-300 bg-white p-4 space-y-3">
                <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide">What this means for this agreement</p>
                <ul className="space-y-2">
                  {[
                    { icon: '🔍', text: `${tcName} will verify whether title is clear of all liens and encumbrances.` },
                    { icon: '💰', text: `${tcName} will confirm buyer's funds have been received before closing can proceed.` },
                    { icon: '📋', text: `${tcName} will certify other required conditions on the closing checklist.` },
                    { icon: '⛔', text: 'If they mark a required condition as not met, the smart contract cannot execute and funds will not be released until resolved.' },
                    { icon: '✅', text: 'The title company cannot take any action on this agreement until both parties approve this designation.' },
                  ].map(({ icon, text }, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                      <span className="shrink-0">{icon}</span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Approval status per party */}
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: 'Buyer', approved: buyerOk },
                { label: 'Seller', approved: sellerOk },
              ].map(({ label, approved }) => (
                <div key={label} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${approved ? 'border-green-300 bg-green-50 text-green-800' : 'border-amber-300 bg-white text-amber-800'}`}>
                  {approved
                    ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    : <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
                  <span>{label}: {approved ? 'Approved' : 'Approval pending'}</span>
                </div>
              ))}
            </div>

            {canApprove && (
              <div className="space-y-2">
                <p className="text-xs text-amber-800 font-medium">
                  By approving, you acknowledge that <strong>{tcName}</strong> will have authority to verify conditions
                  that determine whether this smart contract executes and when funds are released.
                </p>
                <button
                  onClick={handleApproveTitleCompany}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Title Company Designation
                </button>
              </div>
            )}

            {bothOk && (
              <p className="text-xs text-green-700">
                Both parties have approved. {tcName} can now access their assigned checklist and verify conditions.
              </p>
            )}
          </div>
        );
      })()}

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contract">Contract</TabsTrigger>
          <TabsTrigger value="negotiate">Negotiate</TabsTrigger>
          <TabsTrigger value="timeline">Status &amp; History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <ActionCenter
            contractId={id}
            onChainSteps={MOCK_ON_CHAIN_STEPS}
            offChainSteps={offChainSteps.length > 0 ? offChainSteps : [
              {
                id: 'demo1',
                stepKey: 'demo',
                title: 'No off-chain steps yet',
                plainEnglishTitle: 'No steps required',
                description: 'Off-chain steps will appear here once the contract state is set.',
                responsibility: 'buyer',
                isRequired: false,
                isBlocker: false,
                status: 'PENDING',
              },
            ]}
            onUpdateOffChainStep={handleUpdateStep}
            currentUserRole={currentUserRole}
          />
        </TabsContent>

        {/* Contract Document Tab */}
        <TabsContent value="contract">
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold mb-1">Agreement Document</h2>
              <p className="text-sm text-muted-foreground">
                The full legal agreement as it currently stands. Any proposed changes from the Negotiate tab are highlighted inline in real time.
              </p>
            </div>
            <ContractDocument contract={contract} pendingChanges={pendingChanges} />
          </div>
        </TabsContent>

        {/* Status & History Tab */}
        <TabsContent value="timeline">
          <div className="max-w-2xl space-y-4">
            <div>
              <h2 className="text-base font-semibold mb-1">Contract Lifecycle</h2>
              <p className="text-sm text-muted-foreground">
                A complete record of every stage and action on this agreement.
              </p>
            </div>
            <StatusTimeline events={timelineEvents} contractId={id} />
          </div>
        </TabsContent>

        {/* Negotiate Tab */}
        <TabsContent value="negotiate">
          <div className="max-w-3xl space-y-4">
            <div>
              <h2 className="text-base font-semibold mb-1">Negotiate Terms</h2>
              <p className="text-sm text-muted-foreground">
                Propose changes to the agreement. The other party will be notified and can accept, decline, or counter-propose.
                Switch to the <strong>Contract</strong> tab to see all proposed changes highlighted live on the document.
              </p>
            </div>
            <NegotiationPanel
              contractId={id}
              amendments={amendments}
              currentUserRole={currentUserRole === 'seller' ? 'seller' : 'buyer'}
              buyerName={buyerName}
              sellerName={sellerName}
              onAmendmentAction={handleAmendmentAction}
              onProposeChanges={handleProposeChanges}
              contractData={contractData}
              onPendingChangesChange={setPendingChanges}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
