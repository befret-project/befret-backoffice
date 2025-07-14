'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  PieChart as PieChartIcon, 
  BarChart3, 
  Activity 
} from 'lucide-react';

interface HourlyData {
  hour: number;
  sorted: number;
  name: string;
}

interface DestinationData {
  name: string;
  value: number;
  color: string;
}

interface PerformanceData {
  date: string;
  name: string;
  sorted: number;
  efficiency: number;
}

interface SortingOverview {
  hourlyData: HourlyData[];
  destinationData: DestinationData[];
  performanceData: PerformanceData[];
  lastUpdated: string;
}

export function SortingCharts() {
  const [overview, setOverview] = useState<SortingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await fetch('https://api-rcai6nfrla-uc.a.run.app/api/sorting/overview', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setOverview(data);
      } catch (err) {
        console.error('Error fetching sorting overview:', err);
        setError('Erreur lors du chargement des graphiques');
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchOverview, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="flex items-center justify-center h-[300px]">
            <p className="text-gray-500">{error || 'Erreur de chargement'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Custom tooltip pour les graphiques
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Graphique horaire du tri */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Évolution du tri par heure</span>
          </CardTitle>
          <CardDescription>
            Nombre de colis triés par heure aujourd'hui
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={overview.hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="sorted" 
                fill="#1a7125"
                name="Colis triés"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Répartition par destination */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChartIcon className="h-5 w-5" />
            <span>Répartition par destination</span>
          </CardTitle>
          <CardDescription>
            Distribution des colis triés par destination
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={overview.destinationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => 
                  `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {overview.destinationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance sur 7 jours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Performance 7 jours</span>
          </CardTitle>
          <CardDescription>
            Évolution du tri sur la semaine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={overview.performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="sorted" 
                fill="#10b981"
                name="Colis triés"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="efficiency" 
                stroke="#f59e0b"
                strokeWidth={3}
                name="Efficacité (%)"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Métriques de performance agents */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Performance des agents</span>
          </CardTitle>
          <CardDescription>
            Statistiques de tri par agent (simulation)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Agent 1 */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-green-900">Agent A - Marie</h4>
                <span className="text-2xl font-bold text-green-600">
                  {overview.performanceData.reduce((sum, day) => sum + day.sorted, 0) > 0 ? '47' : '0'}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Colis/heure:</span>
                  <span className="font-medium">12.3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Précision:</span>
                  <span className="font-medium">98.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Aujourd'hui:</span>
                  <span className="font-medium">
                    {overview.hourlyData.reduce((sum, hour) => sum + hour.sorted, 0)} colis
                  </span>
                </div>
              </div>
            </div>

            {/* Agent 2 */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-green-900">Agent B - Pierre</h4>
                <span className="text-2xl font-bold text-green-600">
                  {overview.performanceData.reduce((sum, day) => sum + day.sorted, 0) > 0 ? '52' : '0'}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Colis/heure:</span>
                  <span className="font-medium">13.7</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Précision:</span>
                  <span className="font-medium">97.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Aujourd'hui:</span>
                  <span className="font-medium">
                    {Math.floor(overview.hourlyData.reduce((sum, hour) => sum + hour.sorted, 0) * 0.6)} colis
                  </span>
                </div>
              </div>
            </div>

            {/* Agent 3 */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-purple-900">Agent C - Sophie</h4>
                <span className="text-2xl font-bold text-purple-600">
                  {overview.performanceData.reduce((sum, day) => sum + day.sorted, 0) > 0 ? '38' : '0'}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-700">Colis/heure:</span>
                  <span className="font-medium">11.8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Précision:</span>
                  <span className="font-medium">99.1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Aujourd'hui:</span>
                  <span className="font-medium">
                    {Math.floor(overview.hourlyData.reduce((sum, hour) => sum + hour.sorted, 0) * 0.4)} colis
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}