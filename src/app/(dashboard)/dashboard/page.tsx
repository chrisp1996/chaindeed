'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowRight, Home, FileText, TrendingUp, Clock, CheckCircle2, AlertTriangle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, getContractStatusLabel } from '@/lib/utils';
import { useAuth } from '@/lib/useAuth';

const statusIcon = {
  IN_ESCROW: Clock,
  PENDING_SIGNATURES: AlertTriangle,
  CLOSED: CheckCircle2,
  ACTIVE: CheckCircle2,
  DISPUTED: AlertTriangle,
};
const statusVariant: Record<string, any> = {
  IN_ESCROW: 'info',
  PENDING_SIGNATURES: 'warning',
  CLOSED: 'success',
  ACTIVE: 'success',
  DISPUTED: 'destructive',
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setContractsLoading(true);
    fetch('/api/account/contracts')
      .then(r => r.json())
      .then(data => setContracts(Array.isArray(data) ? data : []))
      .catch(() => setContracts([]))
      .finally(() => setContractsLoading(false));
  }, [user]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Home className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Sign in to view your dashboard</h2>
          <p className="text-muted-foreground max-w-sm">
            Create a free ChainDeed account to track your agreements, manage transactions, and get started.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/auth/signup"><Plus className="h-4 w-4 mr-2" />Create Account</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/auth/login"><LogIn className="h-4 w-4 mr-2" />Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {user.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Your Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">Manage all your agreements in one place.</p>
        </div>
        <Button asChild>
          <Link href="/contracts/new"><Plus className="h-4 w-4 mr-2" />New Agreement</Link>
        </Button>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href: '/contracts/new?type=residential', icon: Home,       title: 'Buy or Sell a Home',   desc: 'Residential real estate',       color: 'bg-blue-50 text-blue-600'   },
          { href: '/contracts/new/simple',           icon: FileText,   title: 'Simple Agreement',     desc: 'Any asset or transaction',      color: 'bg-purple-50 text-purple-600'},
          { href: '/contracts/new/tokenize',         icon: TrendingUp, title: 'Tokenize a Property',  desc: 'List for fractional investment', color: 'bg-green-50 text-green-600'  },
        ].map(({ href, icon: Icon, title, desc, color }) => (
          <Link key={href} href={href}>
            <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="pt-6 flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Contracts list */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Agreements</h2>

        {contractsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : contracts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center space-y-3">
              <p className="text-muted-foreground">No agreements yet.</p>
              <Button asChild variant="outline">
                <Link href="/contracts/new"><Plus className="h-4 w-4 mr-2" />Start your first agreement</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract: any) => {
              const StatusIcon = statusIcon[contract.status as keyof typeof statusIcon] || Clock;
              const wd = (contract.wizardData as Record<string, any>) ?? {};
              const label =
                contract.property?.streetAddress ||
                wd.propertyAddress ||
                wd.assetDescription ||
                wd.assetName ||
                contract.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
              const stepsTotal    = contract.offChainSteps?.length ?? 0;
              const stepsComplete = contract.offChainSteps?.filter((s: any) => s.status === 'COMPLETE').length ?? 0;

              return (
                <Link key={contract.id} href={`/contracts/${contract.id}`}>
                  <Card className="hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer">
                    <CardContent className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Home className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{label}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge variant={statusVariant[contract.status] || 'pending'} className="text-xs">
                              {getContractStatusLabel(contract.status)}
                            </Badge>
                            {contract.purchasePrice && (
                              <span className="text-xs text-muted-foreground">{formatCurrency(contract.purchasePrice)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {stepsTotal > 0 && (
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-muted-foreground">Steps</p>
                            <p className="text-sm font-medium">{stepsComplete}/{stepsTotal}</p>
                          </div>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
