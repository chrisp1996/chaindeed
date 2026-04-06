'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButtonClient } from './ConnectButtonClient';
import { Home, FileText, TrendingUp, Menu, X, Bell } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/contracts/new', label: 'New Agreement', icon: FileText },
  { href: '/invest', label: 'Invest', icon: TrendingUp },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between px-4 mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold">CD</div>
          ChainDeed
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname.startsWith(href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}>
              <Icon className="h-4 w-4" />{label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative hidden md:flex">
            <Bell className="h-5 w-5" />
          </Button>
          <ConnectButtonClient />
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background px-4 py-3 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={cn('flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium', pathname.startsWith(href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}
            >
              <Icon className="h-4 w-4" />{label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
