'use client';

import { RefreshCw } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SignOutButton } from '@/components/SignOutButton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useDashboard } from '@/components/DashboardWrapper';

export function DashboardHeader() {
  const { onRefresh, isRefreshing, lastUpdate, userEmail } = useDashboard();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 sticky top-0 bg-background z-10">
      <div className="flex items-center gap-2" suppressHydrationWarning>
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
      </div>
      
      {/* User info and last update - hidden on mobile */}
      {(userEmail || lastUpdate) && (
        <div className="hidden lg:flex flex-col text-xs text-muted-foreground">
          {userEmail && <span>{userEmail}</span>}
          {lastUpdate && (
            <span suppressHydrationWarning>
              Updated: {lastUpdate.toLocaleTimeString('en-US', { hour12: true })}
            </span>
          )}
        </div>
      )}
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-2">
        {onRefresh && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} suppressHydrationWarning />
              <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
            <Separator orientation="vertical" className="h-6" />
          </>
        )}
        
        <ThemeToggle />
        <SignOutButton />
      </div>
    </header>
  );
}
