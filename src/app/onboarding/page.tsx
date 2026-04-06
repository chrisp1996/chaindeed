'use client';

import { useState } from 'react';
import { ArrowRight, Download, Mail, Smartphone, CheckCircle2, ExternalLink, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { addPolygonToWallet } from '@/lib/wagmi';
import { toast } from 'sonner';
import Link from 'next/link';

const walletOptions = [
  {
    id: 'email',
    icon: '📧',
    title: 'Sign in with Email',
    subtitle: 'Easiest — no app download needed',
    description: 'Use your email address to create a secure account. No seed phrases, no technical setup.',
    badge: 'Recommended for beginners',
    badgeVariant: 'success' as const,
    steps: ['Enter your email address', 'Check your inbox for a verification link', 'Click the link — you\'re done!'],
  },
  {
    id: 'coinbase',
    icon: '🔵',
    title: 'Coinbase Wallet',
    subtitle: 'Easy — from the world\'s largest crypto exchange',
    description: 'Download the free Coinbase Wallet app. Simple, trusted, and widely used.',
    badge: 'Good for beginners',
    badgeVariant: 'info' as const,
    steps: ['Download Coinbase Wallet from the App Store or Google Play', 'Create an account and save your recovery phrase securely', 'Connect here by tapping "Connect Secure Account"'],
  },
  {
    id: 'metamask',
    icon: '🦊',
    title: 'MetaMask',
    subtitle: 'Popular — browser extension or mobile app',
    description: 'The most widely-used crypto wallet. Available as a browser extension or mobile app.',
    badge: 'Most popular',
    badgeVariant: 'pending' as const,
    steps: ['Install MetaMask from metamask.io', 'Create a wallet and save your Secret Recovery Phrase somewhere safe (not online)', 'Add the Polygon network using the button below', 'Connect here'],
  },
];

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [polygonAdded, setPolygonAdded] = useState(false);
  const { openConnectModal } = useConnectModal();
  const { isConnected, address } = useAccount();

  const handleAddPolygon = async () => {
    const success = await addPolygonToWallet();
    if (success) { setPolygonAdded(true); toast.success('Polygon network added to your wallet!'); }
    else toast.error('Could not add Polygon automatically. Please add it manually in your wallet settings.');
  };

  if (isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-green-200">
          <CardContent className="pt-8 text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold">You're all set!</h1>
            <p className="text-muted-foreground">Your secure account is connected and ready to use.</p>
            <p className="text-xs font-mono bg-muted rounded px-2 py-1">{address?.slice(0, 10)}...{address?.slice(-8)}</p>
            <Button size="lg" className="w-full" asChild>
              <Link href="/contracts/new">Start Your First Agreement <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full" asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-primary">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold">CD</div>
            ChainDeed
          </Link>
          <h1 className="text-3xl font-bold">Set Up Your Secure Account</h1>
          <p className="text-muted-foreground text-lg">
            ChainDeed uses a "secure account" to hold your funds safely and record your agreements. Choose how you'd like to set yours up:
          </p>
        </div>

        {/* What is a secure account? */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-2">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2"><Zap className="h-4 w-4" />What is a "secure account"?</h3>
          <p className="text-sm text-blue-800 leading-relaxed">
            A secure account (technically called a "crypto wallet") is like a digital safe that only you control.
            It holds your earnest money securely until all conditions in your agreement are met.
            Unlike a bank, <strong>no one — not even ChainDeed — can access your funds without your permission.</strong>
          </p>
          <p className="text-sm text-blue-700">
            You'll also need a small amount of MATIC (about $1–2 worth) to cover network processing fees (~$0.01 per action). We'll show you how to get it.
          </p>
        </div>

        {/* Wallet options */}
        <div className="space-y-4">
          {walletOptions.map(opt => (
            <Card key={opt.id} className={`cursor-pointer transition-all ${selected === opt.id ? 'border-2 border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}
              onClick={() => setSelected(selected === opt.id ? null : opt.id)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <CardTitle className="text-base">{opt.title}</CardTitle>
                      <CardDescription>{opt.subtitle}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={opt.badgeVariant}>{opt.badge}</Badge>
                </div>
              </CardHeader>

              {selected === opt.id && (
                <CardContent className="space-y-4 border-t pt-4">
                  <p className="text-sm text-muted-foreground">{opt.description}</p>
                  <div>
                    <p className="text-xs font-semibold mb-2">How to set it up:</p>
                    <ol className="space-y-1.5">
                      {opt.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs">{i + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {opt.id === 'metamask' && (
                    <Button variant="outline" className="w-full gap-2" onClick={handleAddPolygon} disabled={polygonAdded}>
                      {polygonAdded ? <><CheckCircle2 className="h-4 w-4 text-green-500" />Polygon Added!</> : <><Zap className="h-4 w-4" />Add Polygon Network to MetaMask</>}
                    </Button>
                  )}

                  <Button className="w-full" size="lg" onClick={openConnectModal}>
                    Connect {opt.title} <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* How to get MATIC */}
        <Card className="border-dashed">
          <CardContent className="pt-5 space-y-2">
            <h3 className="font-semibold flex items-center gap-2"><Smartphone className="h-4 w-4" />How to get the $1–2 you'll need for fees</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ChainDeed uses the Polygon network, which is like a faster, cheaper version of traditional blockchain.
              Each action (creating an agreement, depositing funds, etc.) costs about $0.01 in "MATIC" — the network's fee currency.
            </p>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Buy $5–10 of MATIC on Coinbase, Binance, or Kraken</li>
              <li>2. Send it to your wallet address</li>
              <li>3. That's it — you're ready for years of transactions</li>
            </ol>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Already have a wallet?{' '}
          <button onClick={openConnectModal} className="text-primary hover:underline">Connect it directly</button>
        </p>
      </div>
    </div>
  );
}
