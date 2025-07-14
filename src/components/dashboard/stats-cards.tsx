'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, Users, DollarSign, FileText, BarChart3 } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase-config';

interface StatsData {
  totalParcels: number;
  draftParcels?: number;
  totalAllParcels?: number;
  parcelsTrend: number;
  activeUsers: number;
  usersTrend: number;
  revenue: number;
  revenueTrend: number;
  deliveredToday: number;
  deliveredTrend: number;
}

export function StatsCards() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData>({
    totalParcels: 0,
    draftParcels: 0,
    totalAllParcels: 0,
    parcelsTrend: 0,
    activeUsers: 0,
    usersTrend: 0,
    revenue: 0,
    revenueTrend: 0,
    deliveredToday: 0,
    deliveredTrend: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Éviter les appels API pendant le build
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }
      
      try {
        // Récupération des vraies données depuis Firebase Functions
        const response = await fetch('https://api-rcai6nfrla-uc.a.run.app/api/dashboard/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Vérifier si c'est une erreur d'API
        if (data.error) {
          throw new Error(data.error);
        }

        // Récupération directe des comptages complets depuis Firestore
        const parcelsRef = collection(db, 'parcel');
        
        // Compter TOUS les colis
        const allParcelsSnapshot = await getDocs(parcelsRef);
        const totalAllParcels = allParcelsSnapshot.size;
        
        // Compter uniquement les brouillons
        const draftQuery = query(parcelsRef, where('status', '==', 'draft'));
        const draftSnapshot = await getDocs(draftQuery);
        const draftParcels = draftSnapshot.size;

        console.log(`📊 Stats récupérées: ${data.totalParcels} actifs, ${draftParcels} brouillons, ${totalAllParcels} total`);

        setStats({
          ...data,
          draftParcels,
          totalAllParcels
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        
        // Fallback vers des données par défaut en cas d'erreur
        const fallbackStats: StatsData = {
          totalParcels: 0,
          draftParcels: 0,
          totalAllParcels: 0,
          parcelsTrend: 0,
          activeUsers: 0,
          usersTrend: 0,
          revenue: 0,
          revenueTrend: 0,
          deliveredToday: 0,
          deliveredTrend: 0
        };
        
        setStats(fallbackStats);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsConfig = [
    {
      title: 'Colis Actifs',
      value: stats.totalParcels.toLocaleString(),
      trend: stats.parcelsTrend,
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      iconBg: 'bg-green-600',
      description: 'Colis en traitement',
      link: '/logistic/colis/search'
    },
    {
      title: 'Brouillons',
      value: (stats.draftParcels || 0).toLocaleString(),
      trend: 0,
      icon: FileText,
      color: 'text-slate-600',
      bgColor: 'bg-gradient-to-br from-slate-50 to-slate-100',
      iconBg: 'bg-slate-600',
      description: 'Colis en préparation',
      link: '/logistic/colis/search?status=draft'
    },
    {
      title: 'Total Général',
      value: (stats.totalAllParcels || 0).toLocaleString(),
      trend: 0,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      iconBg: 'bg-purple-600',
      description: 'Tous colis confondus',
      link: '/logistic/colis/search'
    },
    {
      title: 'Utilisateurs Actifs',
      value: stats.activeUsers.toLocaleString(),
      trend: stats.usersTrend,
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      iconBg: 'bg-emerald-600',
      description: 'Clients actifs cette semaine',
      link: '/settings/users'
    },
    {
      title: 'Chiffre d\'Affaires',
      value: `${stats.revenue.toLocaleString()} €`,
      trend: stats.revenueTrend,
      icon: DollarSign,
      color: 'text-amber-600',
      bgColor: 'bg-gradient-to-br from-amber-50 to-amber-100',
      iconBg: 'bg-amber-600',
      description: 'Revenus du mois',
      link: '/finance/invoices'
    },
    {
      title: 'Livrés Aujourd\'hui',
      value: stats.deliveredToday.toString(),
      trend: stats.deliveredTrend,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
      iconBg: 'bg-indigo-600',
      description: 'Livraisons réussies aujourd\'hui',
      link: '/logistic/colis/search?status=delivered'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {statsConfig.map((stat, index) => {
        const Icon = stat.icon;
        const isPositiveTrend = stat.trend > 0;
        
        return (
          <Card 
            key={index} 
            className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
            onClick={() => router.push(stat.link)}
          >
            <div className={`absolute inset-0 ${stat.bgColor} group-hover:opacity-90 transition-opacity`} />
            <div className="relative bg-white/80 backdrop-blur-sm h-full group-hover:bg-white/90 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                    {stat.title}
                  </CardTitle>
                  <p className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.iconBg} shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-slate-900 mb-3 group-hover:scale-105 transition-transform">
                  {stat.value}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm">
                    <span className={`flex items-center font-medium ${
                      isPositiveTrend ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      <TrendingUp 
                        className={`h-4 w-4 mr-1 ${
                          !isPositiveTrend ? 'rotate-180' : ''
                        }`} 
                      />
                      {Math.abs(stat.trend)}%
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors">
                    Cliquer pour détails →
                  </span>
                </div>
              </CardContent>
            </div>
          </Card>
        );
      })}
    </div>
  );
}