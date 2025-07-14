'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { Button } from '@/components/ui/button';
import { LogOut, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { signOut } = useAuth();
  
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page title with gradient background */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-green-700 to-indigo-700 p-6 shadow-xl">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Tableau de bord
              </h1>
              <p className="text-green-100 text-lg">
                Vue d&apos;ensemble de l&apos;activité logistique Befret Europe-Congo
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="secondary" 
                size="icon"
                className="bg-white/20 hover:bg-white/30 border-0 text-white"
              >
                <Bell className="h-5 w-5" />
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  signOut();
                  window.location.href = '/login';
                }}
                className="bg-white/20 hover:bg-white/30 border-0 text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-green-500/20 rounded-full blur-2xl"></div>
        </div>

        {/* Stats cards */}
        <StatsCards />

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overview chart - spans 2 columns */}
          <div className="lg:col-span-2">
            <DashboardOverview />
          </div>

          {/* Quick actions */}
          <div>
            <QuickActions />
          </div>
        </div>

        {/* Recent activity */}
        <RecentActivity />
      </div>
    </MainLayout>
  );
}