'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  CreditCard, 
  FileText, 
  BarChart3,
  Euro,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  RefreshCw
} from 'lucide-react';

interface FinanceStats {
  totalRevenue: number;
  totalUnpaid: number;
  unpaidCount: number;
  totalPayments: number;
  totalPaid: number;
  revenueTrend: number;
  averageInvoiceAmount: number;
  paymentRate: number;
}

export default function FinanceHomePage() {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/finance/stats?period=30days');
      
      if (!response.ok) {
        throw new Error('Failed to fetch finance stats');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading finance stats:', error);
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
      title: 'Facturation',
      description: 'Créer et gérer les factures clients',
      href: '/finance/invoices',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Paiements',
      description: 'Suivi des paiements et encaissements',
      href: '/finance/payments',
      icon: CreditCard,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Rapports Financiers',
      description: 'Analyses et statistiques financières',
      href: '/finance/reports',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Devis',
      description: 'Générer des devis pour les clients',
      href: '/finance/quotes',
      icon: Receipt,
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
              Module Finance
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gestion financière et comptabilité
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
                      <p className="text-sm font-medium text-gray-600">CA du Mois</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
                      <p className={`text-xs ${getTrendColor(stats.revenueTrend)} flex items-center`}>
                        {getTrendIcon(stats.revenueTrend)}
                        {Math.abs(stats.revenueTrend).toFixed(1)}%
                      </p>
                    </div>
                    <Euro className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Factures Impayées</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalUnpaid)}</p>
                      <p className="text-xs text-red-500">{stats.unpaidCount} factures</p>
                    </div>
                    <FileText className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Paiements Reçus</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
                      <p className="text-xs text-green-500">{stats.totalPayments} paiements</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Taux de Paiement</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.paymentRate}%</p>
                      <p className="text-xs text-orange-500">Facture moyenne: {formatCurrency(stats.averageInvoiceAmount)}</p>
                    </div>
                    <Receipt className="h-8 w-8 text-orange-600" />
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