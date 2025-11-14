'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Package, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { getLogisticsStatusLabel, getLogisticsStatusColor, isStatusVisibleInInterface } from '@/utils/status-mappings';

// Labels français pour les statuts principaux (conservés pour les statuts non-logistiques)
const statusLabels: { [key: string]: string } = {
  'draft': 'Brouillon non finalisé',
  'pending': 'Payé - En attente réception',
  'to_warehouse': 'Acheminé vers entrepôt Tubize',
  'from_warehouse_to_congo': 'En route vers la RD Congo',
  'arrived_in_congo': 'Arrivé en RD Congo',
  'delivered': 'Livré au destinataire'
};
import { Parcel } from '@/types/parcel';
import ParcelService from '@/services/firebase';

export function RecentReceptions() {
  const [receptions, setReceptions] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReceptions = async () => {
    try {
      setLoading(true);
      
      // Récupérer les réceptions récentes depuis Firestore
      const recentParcels = await ParcelService.getRecentReceptions(10);
      console.log(`📦 [RecentReceptions] Loaded ${recentParcels.length} recent parcels`);
      
      setReceptions(recentParcels);
    } catch (error) {
      console.error('❌ [RecentReceptions] Error fetching receptions:', error);
      setReceptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceptions();
    
    // Écouter les événements de mise à jour de réception
    const handleReceptionUpdate = () => {
      fetchReceptions();
    };
    
    window.addEventListener('receptionUpdated', handleReceptionUpdate);
    
    return () => {
      window.removeEventListener('receptionUpdated', handleReceptionUpdate);
    };
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} min`;
    }
    if (diffInMinutes < 1440) {
      return `Il y a ${Math.floor(diffInMinutes / 60)} h`;
    }
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const refreshReceptions = () => {
    fetchReceptions();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Réceptions Récentes</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshReceptions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {receptions.map((reception) => (
              <div key={reception.id} className="flex items-start space-x-3 group">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 text-green-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 font-mono">
                      {reception.trackingID}
                    </p>
                    <div className="flex space-x-1">
                      <Badge className={getLogisticsStatusColor(reception.logisticsStatus || reception.logisticStatus || 'received')}>
                        {getLogisticsStatusLabel(reception.logisticsStatus || reception.logisticStatus || 'received')}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {statusLabels[reception.status] || reception.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mt-1">
                    <p><span className="font-medium">De:</span> {reception.sender_name}</p>
                    <p><span className="font-medium">Vers:</span> {reception.receiver_name}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>
                      {reception.city || 'RDC'} • {reception.totalWeight} kg • {reception.cost.toFixed(2)}€
                    </span>
                    {reception.receivedAt && (
                      <span>{formatTimestamp(reception.receivedAt)}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">
                      Type: {reception.type} • {reception.pickupMethod === 'warehouse' ? 'Point relais' : 'Domicile'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2"
                      asChild
                    >
                      <Link href={`/logistic/colis/detail?id=${reception.id}`}>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {receptions.length === 0 && !loading && (
          <div className="text-center py-6 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune réception récente</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}