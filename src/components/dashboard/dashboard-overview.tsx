'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ComposedChart } from 'recharts';

interface MonthlyData {
  name: string;
  colis: number;
  revenus: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

interface OverviewData {
  monthlyData: MonthlyData[];
  statusData: StatusData[];
  totalParcels: number;
  lastUpdated: string;
  error?: string;
}

export function DashboardOverview() {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverviewData = async () => {
      // Éviter les appels API pendant le build
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch('https://api-rcai6nfrla-uc.a.run.app/api/dashboard/overview', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const overviewData = await response.json();
        setData(overviewData);
      } catch (error) {
        console.error('Error fetching overview data:', error);
        
        // Fallback data
        setData({
          monthlyData: [
            { name: 'Jan', colis: 0, revenus: 0 },
            { name: 'Fév', colis: 0, revenus: 0 },
            { name: 'Mar', colis: 0, revenus: 0 },
            { name: 'Avr', colis: 0, revenus: 0 },
            { name: 'Mai', colis: 0, revenus: 0 },
            { name: 'Juin', colis: 0, revenus: 0 },
            { name: 'Juil', colis: 0, revenus: 0 },
            { name: 'Août', colis: 0, revenus: 0 },
            { name: 'Sep', colis: 0, revenus: 0 },
            { name: 'Oct', colis: 0, revenus: 0 },
            { name: 'Nov', colis: 0, revenus: 0 },
            { name: 'Déc', colis: 0, revenus: 0 }
          ],
          statusData: [
            { name: 'Erreur de connexion', value: 1, color: '#ef4444' }
          ],
          totalParcels: 0,
          lastUpdated: new Date().toISOString(),
          error: 'Erreur de connexion à la base de données'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  const handleStatusClick = (statusName: string) => {
    // Mapper les noms de statuts vers les filtres de recherche
    const statusMap: { [key: string]: string } = {
      'En attente': 'pending',
      'En transit': 'to_warehouse',
      'Livré': 'delivered',
      'En cours': 'from_warehouse_to_congo',
      'Arrivé': 'arrived_in_congo'
    };
    
    const status = statusMap[statusName] || statusName.toLowerCase();
    router.push(`/logistic/colis/search?status=${status}`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] bg-gray-200 rounded animate-pulse"></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] bg-gray-200 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="flex items-center justify-center h-[300px]">
            <p className="text-gray-500">Impossible de charger les données</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly evolution chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Évolution Mensuelle</CardTitle>
          <CardDescription>
            Nombre de colis et revenus par mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'Revenus (€)' ? `${value}€` : value,
                  name
                ]}
              />
              <Legend />
              <Bar 
                yAxisId="left" 
                dataKey="colis" 
                fill="#1a7125" 
                name="Nombre de colis"
                fillOpacity={0.8}
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="revenus" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Revenus (€)"
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Statut des Colis</CardTitle>
          <CardDescription>
            Répartition par statut de livraison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.statusData.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                onClick={() => handleStatusClick(item.name)}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium group-hover:text-green-600 transition-colors">{item.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold">{item.value}</span>
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Récente</CardTitle>
          <CardDescription>
            Métriques des 7 derniers jours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Taux de livraison</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }} />
                </div>
                <span className="text-sm font-medium">94%</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Délai moyen</span>
              <span className="text-sm font-medium">3.2 jours</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Satisfaction client</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '89%' }} />
                </div>
                <span className="text-sm font-medium">89%</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Plaintes résolues</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '76%' }} />
                </div>
                <span className="text-sm font-medium">76%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}