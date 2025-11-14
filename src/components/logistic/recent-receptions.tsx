'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Package, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { UnifiedShipment, ShipmentPhase } from '@/types/unified-shipment';
import ShipmentService from '@/services/shipment.service';

// Labels français pour les phases
const phaseLabels: { [key in ShipmentPhase]: string } = {
  [ShipmentPhase.PREPARATION]: 'Préparation',
  [ShipmentPhase.ORDER]: 'Commande',
  [ShipmentPhase.DPD_COLLECTION]: 'Collecte DPD',
  [ShipmentPhase.COLLECTED_EUROPE]: 'Collecté Europe',
  [ShipmentPhase.WAREHOUSE]: 'Entrepôt Befret',
  [ShipmentPhase.BEFRET_TRANSIT]: 'Transit Befret',
  [ShipmentPhase.DELIVERED]: 'Livré',
  [ShipmentPhase.HEAVY_PROCESSING]: 'Traitement lourd',
  [ShipmentPhase.HEAVY_COLLECTION]: 'Collecte lourde',
  [ShipmentPhase.HEAVY_DELIVERY]: 'Livraison lourde'
};

// Couleurs pour les phases
const getPhaseColor = (phase: ShipmentPhase): string => {
  switch (phase) {
    case ShipmentPhase.WAREHOUSE:
      return 'bg-green-100 text-green-800';
    case ShipmentPhase.DPD_COLLECTION:
    case ShipmentPhase.COLLECTED_EUROPE:
      return 'bg-blue-100 text-blue-800';
    case ShipmentPhase.BEFRET_TRANSIT:
      return 'bg-purple-100 text-purple-800';
    case ShipmentPhase.DELIVERED:
      return 'bg-emerald-100 text-emerald-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function RecentReceptions() {
  const [receptions, setReceptions] = useState<UnifiedShipment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReceptions = async () => {
    try {
      setLoading(true);

      // Récupérer les réceptions récentes depuis Firestore
      const recentShipments = await ShipmentService.getShipmentsForReception(10);
      console.log(`📦 [RecentReceptions] Loaded ${recentShipments.length} recent shipments`);

      setReceptions(recentShipments);
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
            {receptions.map((shipment) => (
              <div key={shipment.id} className="flex items-start space-x-3 group">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 text-green-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-gray-900 font-mono">
                        {shipment.trackingNumber}
                      </p>
                      {(shipment as any).standardData?.dpdTrackingNumber && (
                        <p className="text-xs text-gray-500 font-mono">
                          DPD: {(shipment as any).standardData.dpdTrackingNumber}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <Badge className={getPhaseColor(shipment.currentPhase)}>
                        {phaseLabels[shipment.currentPhase]}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {typeof shipment.status === 'string' ? shipment.status : (shipment.status as any)?.label || (shipment.status as any)?.current || 'N/A'}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mt-1">
                    <p><span className="font-medium">De:</span> {shipment.customerInfo.sender.name}</p>
                    <p><span className="font-medium">Vers:</span> {shipment.customerInfo.receiver.name}</p>
                  </div>

                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>
                      {shipment.customerInfo.receiver.address.city} • {shipment.parcelInfo.weight} kg • {shipment.pricing.total.toFixed(2)}€
                    </span>
                    {shipment.befretIntegration?.warehouseArrival && (
                      <span>{formatTimestamp(shipment.befretIntegration.warehouseArrival.toISOString())}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">
                      Type: {shipment.type} • {shipment.category}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2"
                      asChild
                    >
                      <Link href={`/logistic/colis/detail?id=${shipment.id}`}>
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
