'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Parcel } from '@/types/parcel';
import { RefreshCw, Bug, Eye } from 'lucide-react';
import ParcelService from '@/services/firebase';
import { getLogisticsStatusLabel, getLogisticsStatusColor } from '@/utils/status-mappings';

interface ParcelDebugPanelProps {
  parcel: Parcel;
  onParcelRefresh?: (refreshedParcel: Parcel) => void;
}

export function ParcelDebugPanel({ parcel, onParcelRefresh }: ParcelDebugPanelProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>('');

  const refreshParcelFromDB = async () => {
    if (!parcel.id) return;
    
    setRefreshing(true);
    try {
      console.log('🔄 [DEBUG PANEL] Refreshing parcel from database...');
      
      // Récupérer le colis directement depuis Firestore
      const refreshedParcel = await ParcelService.getParcelById(parcel.id);
      
      if (refreshedParcel) {
        console.log('✅ [DEBUG PANEL] Parcel refreshed:', refreshedParcel);
        setLastRefresh(new Date().toLocaleTimeString());
        
        if (onParcelRefresh) {
          onParcelRefresh(refreshedParcel);
        }
      } else {
        console.error('❌ [DEBUG PANEL] Failed to refresh parcel');
      }
    } catch (error) {
      console.error('❌ [DEBUG PANEL] Error refreshing parcel:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Non défini';
    try {
      return new Date(timestamp).toLocaleString('fr-FR');
    } catch {
      return timestamp;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'received': return 'bg-blue-100 text-blue-800';
      case 'weighed': return 'bg-purple-100 text-purple-800';
      case 'verified': return 'bg-green-100 text-green-800';
      case 'weight_issue': return 'bg-red-100 text-red-800';
      case 'sorted': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bug className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm text-blue-800">DEBUG - État du Colis</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-blue-600 border-blue-300"
            >
              <Eye className="h-3 w-3 mr-1" />
              {expanded ? 'Réduire' : 'Détails'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshParcelFromDB}
              disabled={refreshing}
              className="text-blue-600 border-blue-300"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Rafraîchir
            </Button>
          </div>
        </div>
        <CardDescription className="text-blue-600">
          TrackingID: {parcel.trackingID} | ID: {parcel.id}
          {lastRefresh && <span className="ml-2">• Dernière maj: {lastRefresh}</span>}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Statuts principaux */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-blue-700">Status Principal</label>
            <Badge className={getStatusColor(parcel.status)}>
              {parcel.status || 'non défini'}
            </Badge>
          </div>
          <div>
            <label className="text-xs font-medium text-blue-700">Statut Logistique</label>
            <Badge className={getLogisticsStatusColor(parcel.logisticsStatus || parcel.logisticStatus || 'pending_reception')}>
              {getLogisticsStatusLabel(parcel.logisticsStatus || parcel.logisticStatus || 'pending_reception')}
            </Badge>
          </div>
        </div>

        {/* Poids */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-blue-700">Poids Déclaré</label>
            <div className="text-sm font-mono">
              {parcel.weightDeclared || parcel.weight || 'N/A'} kg
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-blue-700">Poids Réel</label>
            <div className="text-sm font-mono">
              {parcel.weightReal || 'N/A'} kg
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-blue-700">Pesé le</label>
            <div className="text-xs text-gray-600">
              {formatTimestamp(parcel.weighedAt)}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-blue-700">Dernière modification</label>
            <div className="text-xs text-gray-600">
              {formatTimestamp(parcel.lastUpdated)} 
              {parcel.lastUpdatedBy && <span className="ml-1">par {parcel.lastUpdatedBy}</span>}
            </div>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-blue-200 pt-3 space-y-2">
            <div>
              <label className="text-xs font-medium text-blue-700">Photos de pesée</label>
              <div className="text-xs text-gray-600">
                {parcel.weightPhotos?.length || 0} photo(s)
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-blue-700">Vérification de poids</label>
              <div className="text-xs text-gray-600">
                {parcel.weightVerification ? (
                  <div>
                    Status: {parcel.weightVerification.status}<br/>
                    Différence: {parcel.weightVerification.difference}kg<br/>
                    Auto-approuvé: {parcel.weightVerification.autoApproved ? 'Oui' : 'Non'}
                  </div>
                ) : 'Non défini'}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-blue-700">Zone de tri</label>
              <div className="text-xs text-gray-600">
                {parcel.sortingZone || 'Non assignée'}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-blue-700">Données brutes</label>
              <pre className="text-xs bg-white p-2 rounded border max-h-32 overflow-auto">
                {JSON.stringify({
                  id: parcel.id,
                  status: parcel.status,
                  logisticsStatus: parcel.logisticsStatus,
                  weightReal: parcel.weightReal,
                  weighedAt: parcel.weighedAt,
                  lastUpdated: parcel.lastUpdated,
                  lastUpdatedBy: parcel.lastUpdatedBy
                }, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}