'use client';

import { useState, useEffect } from 'react';
import { SortingStatsCards } from './sorting-stats-cards';
import { SortedParcelsList } from './sorted-parcels-list';
import { SortingCharts } from './sorting-charts';
import { SortingQuickActions } from './sorting-quick-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Zap,
  Activity
} from 'lucide-react';

export function SortingDashboard() {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline' | 'maintenance'>('online');

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // Actualiser toutes les 30 secondes

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
  };

  const getStatusIcon = () => {
    switch (systemStatus) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'offline':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'maintenance':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (systemStatus) {
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'offline':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleManualRefresh = () => {
    setLastUpdate(new Date());
    // Trigger refresh of all components
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* En-tête du dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
            <Package className="h-8 w-8 text-green-600" />
            <span>Dashboard de Tri</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Suivi et gestion des opérations de tri en temps réel
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Statut du système */}
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <Badge className={getStatusColor()}>
              {systemStatus === 'online' && 'Système en ligne'}
              {systemStatus === 'offline' && 'Système hors ligne'}
              {systemStatus === 'maintenance' && 'Maintenance'}
            </Badge>
          </div>
          
          {/* Actualisation */}
          <div className="text-sm text-gray-500">
            Mis à jour: {formatLastUpdate(lastUpdate)}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Alertes système */}
      {systemStatus === 'maintenance' && (
        <Alert className="bg-orange-50 border-orange-200">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Le système de tri est en maintenance. Certaines fonctionnalités peuvent être limitées.
          </AlertDescription>
        </Alert>
      )}

      {systemStatus === 'offline' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connexion au système de tri interrompue. Veuillez vérifier votre connexion réseau.
          </AlertDescription>
        </Alert>
      )}

      {/* Métriques principales */}
      <SortingStatsCards />

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actions rapides */}
        <div className="lg:col-span-1">
          <SortingQuickActions />
        </div>

        {/* Graphiques */}
        <div className="lg:col-span-2">
          <SortingCharts />
        </div>
      </div>

      {/* Liste des colis triés */}
      <SortedParcelsList />

      {/* Indicateurs de performance temps réel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-600" />
              <span>Taux de tri</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {systemStatus === 'online' ? '12.5' : '0.0'}
            </div>
            <div className="text-xs text-gray-600">
              colis/minute (temps réel)
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: systemStatus === 'online' ? '75%' : '0%' }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Zap className="h-4 w-4 text-green-600" />
              <span>Efficacité</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {systemStatus === 'online' ? '94.8%' : '0%'}
            </div>
            <div className="text-xs text-gray-600">
              tri automatique réussi
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: systemStatus === 'online' ? '95%' : '0%' }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <span>Temps moyen</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {systemStatus === 'online' ? '2.3' : '0.0'}
            </div>
            <div className="text-xs text-gray-600">
              minutes par colis
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: systemStatus === 'online' ? '60%' : '0%' }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informations sur l'auto-refresh */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span>
            {autoRefresh ? 'Actualisation automatique activée' : 'Actualisation automatique désactivée'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="text-xs"
          >
            {autoRefresh ? 'Désactiver' : 'Activer'}
          </Button>
        </div>
      </div>
    </div>
  );
}