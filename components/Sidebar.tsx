'use client';

import { LayoutDashboard, Clock, TrendingUp, History, BarChart3 } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { useEffect, useRef, useState } from 'react';

export function AppSidebar() {
  const navItems = [
    { href: '#overview', label: 'Overview', icon: LayoutDashboard },
    { href: '#peak-times', label: 'Peak Times', icon: Clock },
    { href: '#utilization', label: 'Utilization', icon: TrendingUp },
    { href: '#stock-outs', label: 'Stock-Outs', icon: BarChart3 },
    { href: '#transactions', label: 'Transactions', icon: History },
  ];

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const hash = href.replace('#', '');
    if (hash) {
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const { state } = useSidebar();

  useEffect(() => {
    if (state === 'collapsed') return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;

      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 400) {
        sidebarRef.current.style.setProperty('--sidebar-width', `${newWidth}px`);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, state]);

  return (
    <Sidebar collapsible="icon" ref={sidebarRef}>
      <SidebarHeader>
        <SidebarGroupLabel className="text-xs sm:text-sm md:text-base">
          Inventory Sidebar
        </SidebarGroupLabel>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild tooltip={item.label}>
                      <a
                        href={item.href}
                        onClick={(e) => handleClick(e, item.href)}
                        className="text-xs sm:text-sm"
                      >
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" suppressHydrationWarning />
                        <span className="text-xs sm:text-sm">{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      {/* Custom resize handle */}
      {state === 'expanded' && (
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-sidebar-border transition-colors z-50 touch-none"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
        />
      )}
      
      <SidebarRail />
    </Sidebar>
  );
}
