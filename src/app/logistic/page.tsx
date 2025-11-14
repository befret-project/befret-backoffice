'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Package,
  Truck,
  Clock,
  BarChart3,
  ArrowRight,
  Scan
} from 'lucide-react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-config';

interface LogisticStats {
  receivedToday: number;
  inPreparation: number;
  readyToShip: number;
  groupagesThisWeek: number;
}

export default function LogisticHomePage() {
  const router = useRouter();
  const [stats, setStats] = useState<LogisticStats>({
    receivedToday: 0,
    inPreparation: 0,
    readyToShip: 0,
    groupagesThisWeek: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      try {
        const shipmentsRef = collection(db, 'shipments');
        const now = new Date();
        const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

        // Date il y a 7 jours
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

        // Récupérer tous les shipments
        const allShipmentsSnapshot = await getDocs(shipmentsRef);

        let receivedToday = 0;
        let inPreparation = 0;
        let readyToShip = 0;
        let groupagesThisWeek = 0; // Pour l'instant on compte les shipments expédiés

        allShipmentsSnapshot.forEach((doc) => {
          const data = doc.data();
          const currentStatus = data.status?.current || '';
          const createdAt = data.timestamps?.createdAt || '';
          const receivedAt = data.timestamps?.receivedAt || '';

          // Colis reçus aujourd'hui
          if (receivedAt && receivedAt.startsWith(today)) {
            receivedToday++;
          }

          // En préparation (statut received_at_warehouse, weighed, prepared)
          if (['received_at_warehouse', 'weighed', 'prepared'].includes(currentStatus)) {
            inPreparation++;
          }

          // Prêts à expédier (statut ready_for_shipping ou grouped)
          if (['ready_for_shipping', 'grouped'].includes(currentStatus)) {
            readyToShip++;
          }

          // Groupages cette semaine (on compte les shipments expédiés pour l'instant)
          if (currentStatus === 'befret_transit' && createdAt >= sevenDaysAgoStr) {
            groupagesThisWeek++;
          }
        });

        setStats({
          receivedToday,
          inPreparation,
          readyToShip,
          groupagesThisWeek
        });
      } catch (error) {
        console.error('Error fetching logistics stats:', error);
        // Garder les valeurs par défaut en cas d'erreur
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const modules = [
    {
      title: 'Réception Départ',
      description: 'Scanner et peser les colis arrivés (Sprint 1 ✅)',
      href: '/logistic/reception-depart/recherche',
      icon: Scan,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      status: 'production' // ✅ SPRINT 1 FINALISÉ
    },
    {
      title: 'Préparation',
      description: 'Organiser les colis pour le groupage',
      href: '/logistic/colis/preparation',
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Groupage',
      description: 'Créer des conteneurs pour le Congo',
      href: '/logistic/colis/expedition',
      icon: Truck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Groupages',
      description: 'Suivi des groupages et transporteurs',
      href: '/logistic/groupages',
      icon: Truck,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Collectes',
      description: 'Planning des tournées de collecte',
      href: '/logistic/collectes',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Rapports',
      description: 'Statistiques et analyses logistiques',
      href: '/logistic/reporting',
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Module Logistique
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestion complète de la chaîne logistique Befret
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/logistic/colis/search?received=today')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Colis Reçus Aujourd&apos;hui</p>
                  {loading ? (
                    <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-green-600">{stats.receivedToday}</p>
                  )}
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/logistic/colis/search?status=preparation')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Préparation</p>
                  {loading ? (
                    <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-orange-600">{stats.inPreparation}</p>
                  )}
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/logistic/colis/search?status=ready')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Prêts à Expédier</p>
                  {loading ? (
                    <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-green-600">{stats.readyToShip}</p>
                  )}
                </div>
                <Truck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/logistic/groupages')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Groupages Cette Semaine</p>
                  {loading ? (
                    <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-purple-600">{stats.groupagesThisWeek}</p>
                  )}
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}