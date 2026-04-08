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
import { FileText, Home, DollarSign, Calendar, Download } from 'lucide-react';
import { toast } from 'sonner';
import { StatusTimeline, buildTimelineFromContract } from '@/components/contracts/StatusTimeline';
import { AmendmentPanel, Amendment, Change } from '@/components/contracts/AmendmentPanel';

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

  const contractData = {
    price: contract.purchasePrice ?? undefined,
    closingDate: contract.closingDate ?? undefined,
    inspectionDays: undefined as number | undefined,
    conditions: undefined as string | undefined,
    earnestMoney: contract.earnestMoneyAmount ?? undefined,
  };

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

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Status &amp; History</TabsTrigger>
          <TabsTrigger value="negotiate">Negotiate</TabsTrigger>
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
                Propose changes to the agreement. The other party will be notified and can accept, decline, or counter.
              </p>
            </div>
            <AmendmentPanel
              contractId={id}
              amendments={amendments}
              currentUserRole={currentUserRole === 'seller' ? 'seller' : 'buyer'}
              onAmendmentAction={handleAmendmentAction}
              onProposeChanges={handleProposeChanges}
              contractData={contractData}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
