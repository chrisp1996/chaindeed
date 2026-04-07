'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ConnectButtonClient } from './ConnectButtonClient';
import { Home, FileText, TrendingUp, Menu, X, Bell, User, LogOut, LogIn } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/contracts/new', label: 'New Agreement', icon: FileText },
  { href: '/invest', label: 'Invest', icon: TrendingUp },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push('/');
  }

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

          {!loading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hidden md:flex">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                      {(user.name ?? user.email).charAt(0).toUpperCase()}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{user.name ?? 'Account'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" /> My Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/login" className="hidden md:flex">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <LogIn className="h-4 w-4" /> Sign In
                </Button>
              </Link>
            )
          )}

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
          <div className="pt-2 border-t">
            {user ? (
              <>
                <Link href="/account" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" /> My Account
                </Link>
                <button onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-destructive">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </>
            ) : (
              <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-primary">
                <LogIn className="h-4 w-4" /> Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
