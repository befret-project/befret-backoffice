'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Truck, 
  MapPin, 
  Calendar, 
  Download,
  RefreshCw,
  Filter,
  FileText,
  PieChart as PieChartIcon,
  BarChart3,
  Users,
  Euro,
  Clock
} from 'lucide-react';

interface ReportData {
  performanceMetrics: {
    totalColis: number;
    colisTrend: number;
    delaiMoyenLivraison: number;
    tauxReussite: number;
    chiffreAffaires: number;
  };
  expeditionsParMois: Array<{
    mois: string;
    expeditions: number;
    colis: number;
    revenus: number;
  }>;
  statusDistribution?: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  repartitionStatuts?: Array<{
    statut: string;
    nombre: number;
    pourcentage: number;
    couleur: string;
  }>;
  topDestinations: Array<{
    destination?: string;
    ville?: string;
    pays?: string;
    count?: number;
    nbColis?: number;
    revenus?: number;
    percentage?: number;
  }>;
  transporteurPerformance?: Array<{
    transporteur: string;
    totalColis: number;
    colisLivres: number;
    tauxReussite: number;
  }>;
  performanceTransporteurs?: Array<{
    nom: string;
    nbExpeditions: number;
    delaiMoyen: number;
    tauxReussite: number;
  }>;
}

export default function ReportingPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.append('period', selectedPeriod);
      
      const response = await fetch(`/api/logistic/reporting?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setReportData(data);
      } else {
        console.error('API Error:', data.error);
        setReportData(null);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de reporting:', error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: number) => {
    return trend >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getTrendColor = (trend: number) => {
    return trend >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Génération des rapports en cours...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reporting Logistique</h1>
            <p className="text-gray-600">Analyses et rapports de performance</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 derniers jours</SelectItem>
                <SelectItem value="30days">30 derniers jours</SelectItem>
                <SelectItem value="3months">3 derniers mois</SelectItem>
                <SelectItem value="6months">6 derniers mois</SelectItem>
                <SelectItem value="1year">1 an</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchReportData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="destinations">Destinations</TabsTrigger>
            <TabsTrigger value="transporteurs">Transporteurs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Métriques principales */}
            {reportData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Colis</p>
                        <p className="text-3xl font-bold">{reportData.performanceMetrics.totalColis.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <Package className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div className={`flex items-center mt-2 ${getTrendColor(reportData.performanceMetrics.colisTrend)}`}>
                      {getTrendIcon(reportData.performanceMetrics.colisTrend)}
                      <span className="text-sm ml-1">
                        {Math.abs(reportData.performanceMetrics.colisTrend)}% vs période précédente
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Délai Moyen</p>
                        <p className="text-3xl font-bold">{reportData.performanceMetrics.delaiMoyenLivraison}j</p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-full">
                        <Clock className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                    <div className="flex items-center mt-2 text-gray-500">
                      <span className="text-sm">
                        Délai de livraison moyen
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Taux de Réussite</p>
                        <p className="text-3xl font-bold">{reportData.performanceMetrics.tauxReussite}%</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div className="flex items-center mt-2 text-gray-500">
                      <span className="text-sm">
                        Taux de réussite global
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Chiffre d'Affaires</p>
                        <p className="text-3xl font-bold">{formatCurrency(reportData.performanceMetrics.chiffreAffaires)}</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-full">
                        <Euro className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex items-center mt-2 text-gray-500">
                      <span className="text-sm">
                        Chiffre d'affaires total
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Graphiques principaux */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Évolution Mensuelle</CardTitle>
                  <CardDescription>Groupages et revenus par mois</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData?.expeditionsParMois}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="expeditions" fill="#1a7125" name="Groupages" />
                      <Line yAxisId="right" type="monotone" dataKey="revenus" stroke="#10b981" strokeWidth={3} name="Revenus (€)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Répartition par Statut</CardTitle>
                  <CardDescription>Distribution des colis par statut</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData?.statusDistribution || reportData?.repartitionStatuts}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ status, percentage }) => `${status} (${percentage}%)`}
                      >
                        {(reportData?.statusDistribution || reportData?.repartitionStatuts || []).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`hsl(${index * 45}, 70%, 60%)`}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance des Transporteurs</CardTitle>
                <CardDescription>Comparaison des performances par transporteur</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(reportData?.transporteurPerformance || reportData?.performanceTransporteurs || []).map((transporteur: any, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">
                          {transporteur.transporteur || transporteur.nom || 'Transporteur inconnu'}
                        </h4>
                        <Badge variant="outline">
                          {transporteur.totalColis || transporteur.nbExpeditions || 0} 
                          {transporteur.totalColis ? ' colis' : ' groupages'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {transporteur.delaiMoyen && (
                          <div>
                            <Label className="text-xs text-gray-500">Délai moyen</Label>
                            <p className="text-lg font-medium">{transporteur.delaiMoyen} jours</p>
                          </div>
                        )}
                        <div>
                          <Label className="text-xs text-gray-500">Taux de réussite</Label>
                          <p className="text-lg font-medium text-green-600">{transporteur.tauxReussite}%</p>
                        </div>
                        {transporteur.colisLivres && (
                          <div>
                            <Label className="text-xs text-gray-500">Colis livrés</Label>
                            <p className="text-lg font-medium text-green-600">{transporteur.colisLivres}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="destinations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Destinations</CardTitle>
                <CardDescription>Destinations les plus populaires</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData?.topDestinations.map((destination, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="font-bold text-green-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-semibold">
                            {destination.destination || destination.ville || 'Destination inconnue'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {destination.pays || 'Pays non spécifié'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {destination.count || destination.nbColis || 0} colis
                        </p>
                        {destination.revenus && (
                          <p className="text-sm text-gray-600">{formatCurrency(destination.revenus)}</p>
                        )}
                        {destination.percentage && (
                          <p className="text-sm text-gray-600">{destination.percentage}%</p>
                        )}
                      </div>
                    </div>
                  )) || []}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transporteurs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analyse Comparative</CardTitle>
                <CardDescription>Performance détaillée des transporteurs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData?.transporteurPerformance || reportData?.performanceTransporteurs || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="transporteur" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalColis" fill="#1a7125" name="Total colis" />
                    <Bar dataKey="colisLivres" fill="#10b981" name="Colis livrés" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}