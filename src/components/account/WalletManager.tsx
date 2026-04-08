'use client';

import { useState } from 'react';
import { useAccount, useSignMessage, useChainId, useSwitchChain, useBalance } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2, AlertTriangle, ExternalLink, Copy, Wallet,
  Shield, DollarSign, Home, TrendingUp, Trash2, Star, Plus, RefreshCw,
} from 'lucide-react';
import { ConnectButtonClient } from '@/components/layout/ConnectButtonClient';
import { toast } from 'sonner';
import { AuthUser } from '@/lib/useAuth';

interface Props {
  user: AuthUser;
  onWalletsUpdated: (primary: string | null, additional: string[]) => void;
}

const POLYGON_CHAIN_ID = 137;
const AMOY_CHAIN_ID    = 80002;

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function explorerUrl(addr: string, chainId: number) {
  if (chainId === POLYGON_CHAIN_ID) return `https://polygonscan.com/address/${addr}`;
  if (chainId === AMOY_CHAIN_ID)    return `https://amoy.polygonscan.com/address/${addr}`;
  return `https://etherscan.io/address/${addr}`;
}

function WalletBalance({ address, chainId }: { address: `0x${string}`; chainId: number }) {
  const { data, isLoading } = useBalance({ address, chainId });
  if (isLoading) return <span className="text-xs text-muted-foreground">…</span>;
  if (!data) return null;
  return (
    <span className="text-xs text-muted-foreground font-mono">
      {Number(data.formatted).toFixed(4)} {data.symbol}
    </span>
  );
}

export function WalletManager({ user, onWalletsUpdated }: Props) {
  const { address: connectedAddress, isConnected, connector } = useAccount();
  const chainId  = useChainId();
  const { switchChain } = useSwitchChain();
  const { signMessage } = useSignMessage();

  const [linking, setLinking]   = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const allLinked = [
    ...(user.walletAddress ? [{ address: user.walletAddress, primary: true }] : []),
    ...(user.additionalWallets ?? []).map(a => ({ address: a, primary: false })),
  ];

  const connectedIsLinked = allLinked.some(
    w => w.address.toLowerCase() === connectedAddress?.toLowerCase()
  );

  async function handleLink(setPrimary: boolean) {
    if (!connectedAddress) return;
    setLinking(true);
    try {
      const message = `Link wallet to ChainDeed account.\nAddress: ${connectedAddress}\nTimestamp: ${Date.now()}`;
      signMessage(
        { message },
        {
          onSuccess: async (signature) => {
            const res = await fetch('/api/account/wallets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ address: connectedAddress, signature, message, setPrimary }),
            });
            const data = await res.json();
            if (!res.ok) {
              toast.error(data.error || 'Failed to link wallet');
            } else {
              toast.success(setPrimary ? 'Primary wallet linked!' : 'Additional wallet added!');
              onWalletsUpdated(data.walletAddress, data.additionalWallets);
            }
            setLinking(false);
          },
          onError: (err) => {
            toast.error('Signature cancelled or failed');
            setLinking(false);
          },
        }
      );
    } catch {
      toast.error('Failed to sign message');
      setLinking(false);
    }
  }

  async function handleRemove(address: string) {
    setRemoving(address);
    const res = await fetch('/api/account/wallets', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Failed to remove wallet');
    } else {
      toast.success('Wallet removed');
      onWalletsUpdated(data.walletAddress, data.additionalWallets);
    }
    setRemoving(null);
  }

  async function handleMakePrimary(address: string) {
    // Link with setPrimary=true — server will promote it
    setLinking(true);
    const res = await fetch('/api/account/wallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, signature: '0x', message: '', setPrimary: true }),
    });
    // Note: this skips re-verification since it's already linked; we use a simpler PATCH path
    // Instead just call updateProfile
    const patchRes = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: address }),
    });
    const data = await patchRes.json();
    if (!patchRes.ok) {
      toast.error(data.error || 'Failed to update primary wallet');
    } else {
      toast.success('Primary wallet updated');
      // Refresh full wallet data
      const me = await fetch('/api/auth/me').then(r => r.json());
      onWalletsUpdated(me.walletAddress, me.additionalWallets ?? []);
    }
    setLinking(false);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  const onPolygon = chainId === POLYGON_CHAIN_ID || chainId === AMOY_CHAIN_ID;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Connected Wallets</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Link your crypto wallet to sign agreements, hold escrow funds, and receive property tokens. Your signature proves ownership.
        </p>
      </div>

      {/* Linked wallets list */}
      {allLinked.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Linked Wallets ({allLinked.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {allLinked.map(({ address, primary }) => {
              const isActive = address.toLowerCase() === connectedAddress?.toLowerCase();
              return (
                <div
                  key={address}
                  className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                    primary ? 'border-primary/40 bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 ${
                      primary ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      {primary
                        ? <Star className="h-4 w-4 text-primary fill-primary" />
                        : <Wallet className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-mono text-sm font-medium">{shortAddr(address)}</p>
                        {primary && <Badge variant="info" className="text-xs">Primary</Badge>}
                        {isActive && <Badge variant="success" className="text-xs">Active session</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <WalletBalance address={address as `0x${string}`} chainId={chainId || POLYGON_CHAIN_ID} />
                        <span className="text-xs text-muted-foreground">· Polygon network</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!primary && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7"
                        onClick={() => handleMakePrimary(address)}
                        disabled={linking}
                      >
                        Set primary
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(address)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      asChild
                    >
                      <a href={explorerUrl(address, chainId || POLYGON_CHAIN_ID)} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(address)}
                      disabled={removing === address}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center space-y-2">
            <Wallet className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="font-medium">No wallets linked yet</p>
            <p className="text-sm text-muted-foreground">Connect a wallet below to get started</p>
          </CardContent>
        </Card>
      )}

      {/* Connect & link panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add a Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-muted/40">
            <div className="flex-1">
              <p className="text-sm font-medium">
                {isConnected
                  ? `Connected: ${shortAddr(connectedAddress!)}`
                  : 'No wallet connected'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isConnected
                  ? `via ${connector?.name ?? 'wallet'} · ${onPolygon ? 'Polygon ✓' : 'Switch to Polygon'}`
                  : 'Use MetaMask, Coinbase Wallet, or WalletConnect'}
              </p>
            </div>
            <ConnectButtonClient />
          </div>

          {isConnected && !onPolygon && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800 flex-1">ChainDeed uses Polygon. Switch networks to enable full functionality.</p>
              <Button
                size="sm"
                variant="warning"
                onClick={() => switchChain?.({ chainId: POLYGON_CHAIN_ID })}
              >
                Switch to Polygon
              </Button>
            </div>
          )}

          {isConnected && connectedIsLinked && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              This wallet is already linked to your account.
            </div>
          )}

          {isConnected && !connectedIsLinked && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Sign a message with your wallet to prove ownership and link it. No gas fee required.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleLink(!user.walletAddress)}
                  loading={linking}
                  className="flex-1"
                >
                  {user.walletAddress ? 'Add as Additional Wallet' : 'Link as Primary Wallet'}
                </Button>
                {user.walletAddress && (
                  <Button
                    variant="outline"
                    onClick={() => handleLink(true)}
                    loading={linking}
                  >
                    Set as Primary
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                You'll be asked to sign a message in your wallet. This is a free off-chain signature — no transaction or gas fee.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network status */}
      {isConnected && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Network Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${onPolygon ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className="text-sm font-medium">
                  {chainId === POLYGON_CHAIN_ID ? 'Polygon Mainnet' :
                   chainId === AMOY_CHAIN_ID    ? 'Polygon Amoy (Testnet)' :
                   `Chain ID ${chainId}`}
                </span>
              </div>
              {!onPolygon && (
                <Button size="sm" variant="outline" onClick={() => switchChain?.({ chainId: POLYGON_CHAIN_ID })}>
                  Switch to Polygon
                </Button>
              )}
            </div>
            {onPolygon && (
              <p className="text-xs text-muted-foreground mt-1">
                Connected to the correct network. Smart contract transactions are ready.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* What wallets are used for */}
      <div>
        <h3 className="text-sm font-semibold mb-3">What your wallet enables</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: Shield, title: 'Sign agreements', desc: 'Your wallet signature is your legally-binding electronic signature on contracts and deeds.' },
            { icon: DollarSign, title: 'Escrow & earnest money', desc: 'Funds for transactions are held in smart contract escrow linked to your wallet.' },
            { icon: Home, title: 'Receive digital deeds', desc: 'When a transaction closes, the deed NFT transfers directly to your wallet.' },
            { icon: TrendingUp, title: 'Investment shares', desc: 'Fractional property tokens are held in your wallet and generate monthly distributions.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
