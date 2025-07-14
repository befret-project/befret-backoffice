'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Users, 
  FileText, 
  BarChart3,
  Target,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  UserPlus,
  PieChart,
  RefreshCw
} from 'lucide-react';

interface CommercialStats {
  totalClients: number;
  activeClients: number;
  totalOpportunities: number;
  totalPipelineValue: number;
  conversionRate: number;
  averageDealSize: number;
  totalQuotes: number;
  acceptedQuotes: number;
  pipelineTrend: number;
}

export default function CommercialHomePage() {
  const [stats, setStats] = useState<CommercialStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/commercial/stats?period=30days');
      
      if (!response.ok) {
        throw new Error('Failed to fetch commercial stats');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading commercial stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getTrendIcon = (trend: number) => {
    return trend >= 0 ? (
      <TrendingUp className="h-3 w-3 mr-1" />
    ) : (
      <TrendingDown className="h-3 w-3 mr-1" />
    );
  };

  const getTrendColor = (trend: number) => {
    return trend >= 0 ? 'text-green-500' : 'text-red-500';
  };
  const modules = [
    {
      title: 'CRM Clients',
      description: 'Gestion de la relation client',
      href: '/commercial/crm',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Devis & Propositions',
      description: 'Créer et suivre les devis commerciaux',
      href: '/commercial/quotes',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Pipeline Commercial',
      description: 'Suivi des opportunités de vente',
      href: '/commercial/pipeline',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Rapports Commerciaux',
      description: 'Analyses et performances commerciales',
      href: '/commercial/reports',
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Module Commercial
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              CRM, devis et gestion commerciale
            </p>
          </div>
          <Button onClick={fetchStats} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${module.color}`} />
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{module.description}</p>
                  <Button asChild className="w-full">
                    <Link href={module.href}>
                      Accéder
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : stats ? (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Clients Actifs</p>
                      <p className="text-2xl font-bold text-green-600">{stats.activeClients}</p>
                      <p className="text-xs text-green-500">
                        Total: {stats.totalClients} clients
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Opportunités</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.totalOpportunities}</p>
                      <p className="text-xs text-orange-500">{formatCurrency(stats.totalPipelineValue)}</p>
                    </div>
                    <Target className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Taux de Conversion</p>
                      <p className="text-2xl font-bold text-green-600">{stats.conversionRate}%</p>
                      <p className={`text-xs ${getTrendColor(stats.pipelineTrend)} flex items-center`}>
                        {getTrendIcon(stats.pipelineTrend)}
                        {Math.abs(stats.pipelineTrend).toFixed(1)}%
                      </p>
                    </div>
                    <PieChart className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Devis en Attente</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.totalQuotes}</p>
                      <p className="text-xs text-purple-500">Acceptés: {stats.acceptedQuotes}</p>
                    </div>
                    <FileText className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="col-span-4 text-center py-8">
              <p className="text-gray-500">Impossible de charger les statistiques</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}