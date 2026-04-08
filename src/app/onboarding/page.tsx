'use client';

import { useState } from 'react';
import { ArrowRight, Mail, Smartphone, CheckCircle2, Zap, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const accountOptions = [
  {
    id: 'email',
    icon: '📧',
    title: 'Sign In with Email',
    subtitle: 'Easiest — no app download needed',
    description: 'Create a free ChainDeed account using just your email and a password. No seed phrases, no crypto knowledge required. You can always link a crypto wallet later from your Account Settings.',
    badge: 'Recommended',
    badgeVariant: 'success' as const,
    action: 'signup' as const,
    steps: [
      'Click "Create Account" below',
      'Enter your name, email address, and a password',
      'Start creating or reviewing agreements right away',
    ],
  },
  {
    id: 'coinbase',
    icon: '🔵',
    title: 'Coinbase Wallet',
    subtitle: 'For users with an existing Coinbase Wallet',
    description: 'If you already have a Coinbase Wallet, you can link it to your ChainDeed account after signing up. Your wallet is used to hold earnest money and sign transactions — it\'s separate from your ChainDeed login.',
    badge: 'Crypto-native',
    badgeVariant: 'info' as const,
    action: 'wallet' as const,
    steps: [
      'First create a ChainDeed account with your email',
      'Download the Coinbase Wallet app if you haven\'t already',
      'Go to Account → Wallets and connect your Coinbase Wallet',
    ],
    walletLink: 'https://wallet.coinbase.com/',
    walletLinkLabel: 'Get Coinbase Wallet',
  },
  {
    id: 'metamask',
    icon: '🦊',
    title: 'MetaMask',
    subtitle: 'For users with an existing MetaMask wallet',
    description: 'If you already have MetaMask installed, you can link it to your ChainDeed account after signing up. MetaMask is a browser extension or mobile app that stores your crypto keys.',
    badge: 'Most popular',
    badgeVariant: 'pending' as const,
    action: 'wallet' as const,
    steps: [
      'First create a ChainDeed account with your email',
      'Install MetaMask from metamask.io if you haven\'t already',
      'Go to Account → Wallets and connect your MetaMask wallet',
      'Add the Polygon network — we\'ll help you do this automatically',
    ],
    walletLink: 'https://metamask.io/download/',
    walletLinkLabel: 'Get MetaMask',
  },
];

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string | null>('email');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-primary">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold">CD</div>
            ChainDeed
          </Link>
          <h1 className="text-3xl font-bold">Get Started with ChainDeed</h1>
          <p className="text-muted-foreground text-lg">
            Create a free account to start, track, and sign digital agreements.
          </p>
        </div>

        {/* What is ChainDeed */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-2">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2">
            <Zap className="h-4 w-4" />How ChainDeed accounts work
          </h3>
          <p className="text-sm text-blue-800 leading-relaxed">
            Your <strong>ChainDeed account</strong> uses your email and password — just like any website. This is what lets you create and manage agreements.
          </p>
          <p className="text-sm text-blue-800 leading-relaxed">
            Separately, a <strong>crypto wallet</strong> (MetaMask, Coinbase Wallet, etc.) is used to hold earnest money and sign transactions on-chain. You don't need one to get started — you can add one later from your account settings.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {accountOptions.map(opt => (
            <Card
              key={opt.id}
              className={`cursor-pointer transition-all ${selected === opt.id ? 'border-2 border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}
              onClick={() => setSelected(selected === opt.id ? null : opt.id)}
            >
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
                    <p className="text-xs font-semibold mb-2">Steps:</p>
                    <ol className="space-y-1.5">
                      {opt.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">{i + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {opt.action === 'signup' ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button className="flex-1" size="lg" asChild>
                        <Link href="/auth/signup">
                          Create Free Account <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                      <Button variant="outline" className="flex-1" size="lg" asChild>
                        <Link href="/auth/login">
                          Already have an account? Sign In
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button className="w-full" size="lg" asChild>
                        <Link href="/auth/signup">
                          Create Account First <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                      {opt.walletLink && (
                        <Button variant="outline" className="w-full gap-2" size="lg" asChild>
                          <a href={opt.walletLink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            {opt.walletLinkLabel}
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* How to get MATIC */}
        <Card className="border-dashed">
          <CardContent className="pt-5 space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Smartphone className="h-4 w-4" />What is MATIC / POL and do I need it?
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ChainDeed uses the Polygon network for on-chain transactions. Each blockchain action (depositing funds, recording an agreement) costs about $0.01 in "POL" — Polygon's fee currency. You only need this if you plan to use crypto wallet features.
            </p>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Buy $5–10 of POL on Coinbase, Binance, or Kraken</li>
              <li>2. Send it to your linked wallet address</li>
              <li>3. That's enough for hundreds of transactions</li>
            </ol>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary hover:underline">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}
