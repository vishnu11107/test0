'use client';

import { Sidebar } from './sidebar';
import { Navbar } from './navbar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden md:ml-0">
        {/* Top navbar */}
        <Navbar />
        
        {/* Page content */}
        <main className={cn('flex-1 overflow-y-auto p-4 md:p-6', className)}>
          {children}
        </main>
      </div>
    </div>
  );
}