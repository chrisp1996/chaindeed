'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Wallet, FileText, TrendingUp, Settings, LogOut,
  Plus, ArrowRight, CheckCircle2, Clock, AlertTriangle,
  Home, DollarSign, Shield, Edit2, ExternalLink, Copy, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/lib/useAuth';
import { useAccount } from 'wagmi';
import { formatCurrency, getContractStatusLabel, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_VARIANT: Record<string, any> = {
  DRAFT: 'secondary', PENDING_SIGNATURES: 'warning', ACTIVE: 'info',
  IN_ESCROW: 'info', PENDING_CLOSING: 'warning', CLOSED: 'success',
  CANCELLED: 'secondary', DISPUTED: 'destructive',
};

const STATUS_ICON: Record<string, any> = {
  CLOSED: CheckCircle2, PENDING_SIGNATURES: AlertTriangle, IN_ESCROW: Clock,
  ACTIVE: Clock, DISPUTED: AlertTriangle, DRAFT: FileText,
};

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, logout, updateProfile } = useAuth();
  const { address: connectedWallet } = useAccount();

  const [contracts, setContracts] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Profile edit state
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    setEditName(user.name || '');

    Promise.all([
      fetch('/api/account/contracts').then(r => r.json()).catch(() => []),
      fetch('/api/account/investments').then(r => r.json()).catch(() => []),
    ]).then(([c, i]) => {
      setContracts(Array.isArray(c) ? c : []);
      setInvestments(Array.isArray(i) ? i : []);
      setLoadingData(false);
    });
  }, [user]);

  async function handleSaveProfile() {
    setSavingProfile(true);
    const { error } = await updateProfile({ name: editName, phone: editPhone, bio: editBio });
    if (error) toast.error(error);
    else { toast.success('Profile updated'); setEditMode(false); }
    setSavingProfile(false);
  }

  async function handleLinkWallet() {
    if (!connectedWallet) {
      toast.error('Connect your wallet first using the button in the top navigation.');
      return;
    }
    const { error } = await updateProfile({ walletAddress: connectedWallet });
    if (error) toast.error(error);
    else toast.success('Wallet linked to your account!');
  }

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
  if (!user) return null;

  const activeContracts = contracts.filter(c => !['CLOSED', 'CANCELLED'].includes(c.status));
  const completedContracts = contracts.filter(c => ['CLOSED', 'CANCELLED'].includes(c.status));
  const totalInvested = investments.reduce((sum: number, h: any) => sum + (h.totalInvested || 0), 0);
  const totalValue = investments.reduce((sum: number, h: any) => sum + (h.currentValue || h.totalInvested || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-2xl shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.name || 'My Account'}</h1>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'} className="text-xs capitalize">
                  {user.role.toLowerCase()}
                </Badge>
                <Badge variant={user.kycStatus === 'APPROVED' ? 'success' : user.kycStatus === 'PENDING' ? 'warning' : 'outline'} className="text-xs">
                  {user.kycStatus === 'APPROVED' ? '✓ Identity Verified' : user.kycStatus === 'PENDING' ? 'KYC Pending' : 'Identity Not Verified'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />Sign Out
            </Button>
            <Button size="sm" asChild>
              <Link href="/contracts/new"><Plus className="h-4 w-4 mr-2" />New Agreement</Link>
            </Button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active Agreements', value: activeContracts.length, icon: FileText, color: 'text-blue-600 bg-blue-50' },
            { label: 'Completed', value: completedContracts.length, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
            { label: 'Invested', value: formatCurrency(totalInvested), icon: DollarSign, color: 'text-purple-600 bg-purple-50' },
            { label: 'Portfolio Value', value: formatCurrency(totalValue), icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color} shrink-0`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main tabs */}
        <Tabs defaultValue="contracts">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="contracts" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Agreements</TabsTrigger>
            <TabsTrigger value="investments" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Investments</TabsTrigger>
            <TabsTrigger value="wallets" className="gap-1.5"><Wallet className="h-3.5 w-3.5" />Wallets</TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5"><Settings className="h-3.5 w-3.5" />Profile</TabsTrigger>
          </TabsList>

          {/* ─── AGREEMENTS TAB ─── */}
          <TabsContent value="contracts" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Agreements</h2>
              <Button asChild size="sm">
                <Link href="/contracts/new"><Plus className="h-4 w-4 mr-2" />New Agreement</Link>
              </Button>
            </div>

            {loadingData ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : contracts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center space-y-4">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-semibold text-lg">No agreements yet</p>
                    <p className="text-muted-foreground text-sm mt-1">Start a new real estate agreement, simple transaction, or tokenize a property.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild><Link href="/contracts/new/real-estate">Start Real Estate Agreement</Link></Button>
                    <Button variant="outline" asChild><Link href="/contracts/new/simple">Simple Agreement</Link></Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Active */}
                {activeContracts.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active ({activeContracts.length})</h3>
                    {activeContracts.map(c => <ContractRow key={c.id} contract={c} />)}
                  </div>
                )}
                {/* Completed */}
                {completedContracts.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Completed ({completedContracts.length})</h3>
                    {completedContracts.map(c => <ContractRow key={c.id} contract={c} />)}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ─── INVESTMENTS TAB ─── */}
          <TabsContent value="investments" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Investment Portfolio</h2>
              <Button variant="outline" asChild size="sm">
                <Link href="/invest"><TrendingUp className="h-4 w-4 mr-2" />Browse Properties</Link>
              </Button>
            </div>

            {loadingData ? (
              <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>
            ) : investments.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center space-y-4">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-semibold text-lg">No investments yet</p>
                    <p className="text-muted-foreground text-sm mt-1">Browse fractional property investments and start earning rental income.</p>
                  </div>
                  <Button asChild><Link href="/invest">Browse Investment Properties</Link></Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Portfolio summary */}
                <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                  <CardContent className="pt-5 pb-5">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{investments.length}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Properties</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Total Invested</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(totalValue - totalInvested)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Unrealized Gain</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {investments.map((holding: any) => (
                  <Card key={holding.id}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="font-semibold">{holding.offering?.property?.streetAddress || 'Investment Property'}</p>
                            <p className="text-xs text-muted-foreground">{holding.offering?.property?.city}, {holding.offering?.property?.state}</p>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Shares</p>
                              <p className="font-semibold">{holding.sharesOwned || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Invested</p>
                              <p className="font-semibold">{formatCurrency(holding.totalInvested || 0)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Est. Return</p>
                              <p className="font-semibold text-green-600">{holding.offering?.projectedReturn || '—'}%/yr</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Offering progress</span>
                              <span>{holding.offering?.percentFunded || 0}% funded</span>
                            </div>
                            <Progress value={holding.offering?.percentFunded || 0} className="h-1.5" />
                          </div>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/invest/${holding.offering?.id}`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── WALLETS TAB ─── */}
          <TabsContent value="wallets" className="space-y-6 mt-6">
            <h2 className="text-xl font-semibold">Connected Wallets</h2>
            <p className="text-sm text-muted-foreground">Your wallet is your secure digital identity for signing agreements and holding funds. You can link your connected wallet to your account here.</p>

            {/* Primary wallet */}
            <Card>
              <CardHeader><CardTitle className="text-base">Primary Wallet</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {user.walletAddress ? (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-medium">
                          {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                        </p>
                        <p className="text-xs text-muted-foreground">Primary wallet · Polygon network</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyToClipboard(user.walletAddress!)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                        <a href={`https://polygonscan.com/address/${user.walletAddress}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                      <p className="text-sm text-amber-800">No wallet linked to your account yet. Connect a wallet using the button in the navigation bar, then link it below.</p>
                    </div>
                    {connectedWallet && (
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="text-sm font-medium">Wallet connected (not yet linked)</p>
                          <p className="font-mono text-xs text-muted-foreground">{connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}</p>
                        </div>
                        <Button size="sm" onClick={handleLinkWallet}>Link to Account</Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* What your wallet does */}
            <Card>
              <CardHeader><CardTitle className="text-base">What your wallet is used for</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { icon: Shield, title: 'Sign agreements', desc: 'Your wallet signature is your legally-binding digital signature on contracts.' },
                    { icon: DollarSign, title: 'Hold earnest money', desc: 'Funds deposited into escrow are held in your wallet-linked smart contract.' },
                    { icon: Home, title: 'Receive deeds', desc: 'When a transaction closes, the digital deed NFT is sent to your wallet.' },
                    { icon: TrendingUp, title: 'Investment shares', desc: 'Fractional property shares are tokens held in your wallet.' },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{title}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── PROFILE TAB ─── */}
          <TabsContent value="profile" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Profile Settings</h2>
              {!editMode && (
                <Button variant="outline" size="sm" onClick={() => { setEditMode(true); setEditName(user.name || ''); }}>
                  <Edit2 className="h-4 w-4 mr-2" />Edit Profile
                </Button>
              )}
            </div>

            <Card>
              <CardContent className="pt-6 space-y-5">
                {editMode ? (
                  <>
                    <div className="space-y-1.5">
                      <Label>Full Name</Label>
                      <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your full name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone Number</Label>
                      <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="(513) 555-0100" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Bio (optional)</Label>
                      <Input value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="A short bio about yourself" />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={handleSaveProfile} loading={savingProfile}>Save Changes</Button>
                      <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {[
                      { label: 'Full Name', value: user.name || '—' },
                      { label: 'Email', value: user.email },
                      { label: 'Account Type', value: user.role.charAt(0) + user.role.slice(1).toLowerCase() },
                      { label: 'Member Since', value: new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
                      { label: 'Identity Verification', value: user.kycStatus === 'APPROVED' ? 'Verified ✓' : user.kycStatus === 'PENDING' ? 'Under review' : 'Not started' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center py-2 border-b last:border-0">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <span className="text-sm font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* KYC section */}
            {user.kycStatus !== 'APPROVED' && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="pt-5 pb-5 flex items-center gap-4">
                  <Shield className="h-8 w-8 text-amber-600 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold">Verify your identity</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Identity verification is required to invest in tokenized properties and for large transactions.</p>
                  </div>
                  <Button size="sm" variant="warning">Start Verification</Button>
                </CardContent>
              </Card>
            )}

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Danger Zone</h3>
              <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />Sign Out of All Devices
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ── Contract row component ──
function ContractRow({ contract }: { contract: any }) {
  const StatusIcon = STATUS_ICON[contract.status] || Clock;
  const isComplete = ['CLOSED', 'CANCELLED'].includes(contract.status);
  const label = contract.property?.streetAddress || contract.wizardData?.assetTypeKey
    ? (contract.property?.streetAddress || contract.wizardData?.assetFields?.vehicleMake || 'Transaction Agreement')
    : 'Transaction Agreement';

  return (
    <Link href={`/contracts/${contract.id}`}>
      <Card className={`hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer ${isComplete ? 'opacity-75' : ''}`}>
        <CardContent className="py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <StatusIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{label}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge variant={STATUS_VARIANT[contract.status] || 'secondary'} className="text-xs">
                  {getContractStatusLabel(contract.status)}
                </Badge>
                {contract.purchasePrice && (
                  <span className="text-xs text-muted-foreground">{formatCurrency(contract.purchasePrice)}</span>
                )}
                <span className="text-xs text-muted-foreground">{formatDate(contract.updatedAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="ghost" asChild>
              <span><ChevronRight className="h-4 w-4" /></span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
