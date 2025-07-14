'use client';

import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from './sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 via-green-50/30 to-slate-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top padding for mobile menu button */}
        <div className="h-16 lg:h-0 flex-shrink-0"></div>
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}