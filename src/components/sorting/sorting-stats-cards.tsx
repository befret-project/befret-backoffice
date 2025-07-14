'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Package, 
  Clock, 
  AlertTriangle, 
  CreditCard,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';

interface SortingStats {
  destinations: {
    kinshasa: {
      count: number;
      weight: number;
      lastActivity: string | null;
    };
    lubumbashi: {
      count: number;
      weight: number;
      lastActivity: string | null;
    };
  };
  specialCases: {
    count: number;
    pendingPayment: number;
  };
  performance: {
    sortedToday: number;
    sortedThisWeek: number;
    avgPerDay: number;
  };
  lastUpdated: string;
}

export function SortingStatsCards() {
  const [stats, setStats] = useState<SortingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('https://api-rcai6nfrla-uc.a.run.app/api/sorting/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching sorting stats:', err);
        setError('Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatLastActivity = (timestamp: string | null) => {
    if (!timestamp) return 'Aucune activité';
    
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)} h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)} j`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-gray-500 text-sm">{error || 'Erreur de chargement'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Kinshasa */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Kinshasa</CardTitle>
          <MapPin className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.destinations.kinshasa.count}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {stats.destinations.kinshasa.weight} kg total
          </div>
          <div className="flex items-center justify-between mt-2">
            <Badge variant="secondary" className="text-xs">
              Zone A
            </Badge>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              {formatLastActivity(stats.destinations.kinshasa.lastActivity)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lubumbashi */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lubumbashi</CardTitle>
          <MapPin className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.destinations.lubumbashi.count}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {stats.destinations.lubumbashi.weight} kg total
          </div>
          <div className="flex items-center justify-between mt-2">
            <Badge variant="secondary" className="text-xs">
              Zone B
            </Badge>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              {formatLastActivity(stats.destinations.lubumbashi.lastActivity)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cas spéciaux */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cas spéciaux</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats.specialCases.count}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            En attente résolution
          </div>
          <div className="flex items-center justify-between mt-2">
            <Badge variant="secondary" className="text-xs">
              Zone C
            </Badge>
            <div className="flex items-center text-xs text-gray-500">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Attention requise
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paiements */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paiements</CardTitle>
          <CreditCard className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {stats.specialCases.pendingPayment}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            En attente paiement
          </div>
          <div className="flex items-center justify-between mt-2">
            <Badge variant="secondary" className="text-xs">
              Zone D
            </Badge>
            <div className="flex items-center text-xs text-gray-500">
              <CreditCard className="h-3 w-3 mr-1" />
              Bloqué
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance du jour */}
      <Card className="hover:shadow-md transition-shadow md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Performance du jour</CardTitle>
          <Activity className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.performance.sortedToday}
              </div>
              <div className="text-xs text-gray-600">
                Colis triés aujourd'hui
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-700">
                {stats.performance.avgPerDay.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">
                Moyenne par jour
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center text-xs text-gray-500">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              {stats.performance.sortedThisWeek} cette semaine
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Efficacité */}
      <Card className="hover:shadow-md transition-shadow md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Efficacité du tri</CardTitle>
          <Package className="h-4 w-4 text-indigo-600" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-indigo-600">
                {stats.performance.sortedThisWeek > 0 ? '95%' : '0%'}
              </div>
              <div className="text-xs text-gray-600">
                Taux de tri automatique
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-700">
                {stats.performance.sortedToday > 0 ? '2.3' : '0.0'}
              </div>
              <div className="text-xs text-gray-600">
                Min/colis moyen
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center text-xs text-gray-500">
              {stats.performance.sortedToday > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  Performance optimale
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 mr-1 text-gray-400" />
                  Pas d'activité aujourd'hui
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}