'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Scan, Package, CheckCircle, AlertTriangle, Search, MapPin, Clock, Euro, Camera, Trash2, QrCode, Scale, ExternalLink } from 'lucide-react';
import { Parcel } from '@/types/parcel';
import ParcelService from '@/services/firebase';
import { QRCodeService } from '@/services/qr-code';
import { QRScanner } from './qr-scanner';
import { BarcodeScanner } from './barcode-scanner';
import { useAuth } from '@/hooks/useAuth';
import { getLogisticsStatusLabel, getLogisticsStatusColor, isStatusVisibleInInterface } from '@/utils/status-mappings';

export function ParcelReceptionForm() {
  const [trackingID, setTrackingID] = useState('');
  const [parcelInfo, setParcelInfo] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [barcodeScanMode, setBarcodeScanMode] = useState(false);
  const [qrScanMode, setQrScanMode] = useState(false);
  const { user } = useAuth();

  const searchParcel = async () => {
    if (!trackingID.trim()) {
      setError('Veuillez saisir un numéro de suivi');
      return;
    }

    setLoading(true);
    setError('');
    setParcelInfo(null);

    try {
      console.log('Searching for parcel:', trackingID);
      
      // Recherche dans Firestore via le service
      const result = await ParcelService.searchByTrackingId(trackingID);
      
      if (result.found && result.parcel) {
        setParcelInfo(result.parcel);
        console.log('Parcel found:', result.parcel);
      } else {
        setError(result.error || 'Colis non trouvé');
      }
    } catch (searchError) {
      console.error('Search error:', searchError);
      setError('Erreur lors de la recherche du colis');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (qrCode: string) => {
    setQrScanMode(false);
    setLoading(true);
    setError('');

    try {
      // Valider le QR code via l'API
      const validationResult = await QRCodeService.validateQRCode(qrCode);
      
      if (validationResult.valid && validationResult.parcel) {
        setParcelInfo(validationResult.parcel);
        setTrackingID(validationResult.parcel.trackingID);
        
        // Enregistrer automatiquement le scan d'arrivée
        if (user && validationResult.parcel.id) {
          await recordArrivalScan(validationResult.parcel.id);
        }
      } else {
        setError(validationResult.error || 'Code QR invalide');
      }
    } catch (scanError) {
      console.error('QR scan error:', scanError);
      setError('Erreur lors du scan du code QR');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScanError = (error: string) => {
    setError(`Erreur de scan QR: ${error}`);
  };

  const handleBarcodeScan = async (barcode: string) => {
    setBarcodeScanMode(false);
    setTrackingID(barcode);
    setError('');

    try {
      console.log('Barcode scanned:', barcode);
      
      // Auto-search après le scan
      setLoading(true);
      const result = await ParcelService.searchByTrackingId(barcode);
      
      if (result.found && result.parcel) {
        setParcelInfo(result.parcel);
        console.log('Parcel found:', result.parcel);
      } else {
        setError(result.error || 'Colis non trouvé');
      }
      
    } catch (scanError) {
      console.error('Barcode scan error:', scanError);
      setError('Erreur lors du traitement du code-barres');
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanError = (error: string) => {
    setError(`Erreur de scan code-barres: ${error}`);
  };

  const recordArrivalScan = async (parcelId: string) => {
    if (!user) return;

    try {
      const scanResult = await QRCodeService.recordArrivalScan(parcelId, {
        operator: user.email || 'Agent inconnu',
        location: 'Entrepôt principal',
        scannerId: 'web-scanner'
      });

      if (scanResult.success) {
        setSuccess('Scan d\'arrivée enregistré avec succès');
      }
    } catch (error) {
      console.warn('Failed to record arrival scan:', error);
    }
  };

  const confirmReception = async () => {
    if (!parcelInfo || !parcelInfo.id || !user) return;

    // Vérifier que le colis est dans l'état correct pour la réception
    if (parcelInfo.logisticStatus !== 'pending_reception') {
      setError(`Impossible de recevoir ce colis. État actuel : ${getLogisticsStatusLabel(parcelInfo.logisticStatus || 'pending_reception')}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔄 [Reception] Confirming reception for parcel:', parcelInfo.id);
      console.log('🔄 [Reception] Current logistic status:', parcelInfo.logisticStatus);
      
      // Marquer comme reçu dans Firestore (change le statut vers 'received')
      const success = await ParcelService.markAsReceived(
        parcelInfo.id, 
        user.email || 'Agent inconnu'
      );
      
      if (success) {
        console.log('✅ [Reception] Parcel successfully marked as received');
        
        // Envoyer la notification de réception
        try {
          const notificationSent = await ParcelService.sendReceptionNotification(parcelInfo);
          if (notificationSent) {
            setSuccess(`📦 Colis ${parcelInfo.trackingID} reçu et client notifié par SMS`);
          } else {
            setSuccess(`📦 Colis ${parcelInfo.trackingID} reçu (notification SMS non envoyée)`);
          }
        } catch (notifError) {
          console.warn('⚠️ [Reception] Failed to send notification:', notifError);
          setSuccess(`📦 Colis ${parcelInfo.trackingID} reçu (erreur notification SMS)`);
        }
        
        // Nettoyer le formulaire
        setParcelInfo(null);
        setTrackingID('');
        
        // Déclencher un rafraîchissement de la liste des réceptions récentes
        window.dispatchEvent(new CustomEvent('receptionUpdated'));
        
        // Suggérer la prochaine étape
        setTimeout(() => {
          setSuccess(prev => prev + ' • Prochaine étape : Station de Pesée');
        }, 2000);
      } else {
        setError('❌ Erreur lors de la mise à jour du statut');
      }
      
    } catch (receptionError) {
      console.error('❌ [Reception] Reception error:', receptionError);
      setError('Erreur lors de la confirmation de réception');
    } finally {
      setLoading(false);
    }
  };

  const activateBarcodeScanner = () => {
    setBarcodeScanMode(!barcodeScanMode);
    setQrScanMode(false); // Fermer le QR scanner s'il est ouvert
    setError('');
    setSuccess('');
  };

  const clearForm = () => {
    setTrackingID('');
    setParcelInfo(null);
    setError('');
    setSuccess('');
    setBarcodeScanMode(false);
    setQrScanMode(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Brouillon</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Payé - En attente</Badge>;
      case 'to_warehouse':
        return <Badge className="bg-orange-100 text-orange-800">Vers entrepôt</Badge>;
      case 'from_warehouse_to_congo':
        return <Badge className="bg-green-100 text-green-800">Vers RDC</Badge>;
      case 'arrived_in_congo':
        return <Badge className="bg-purple-100 text-purple-800">Arrivé RDC</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Livré</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getLogisticStatusBadge = (logisticStatus?: string) => {
    if (!logisticStatus) return null;
    
    // Utiliser les utilitaires unifiés pour les statuts logistiques
    const label = getLogisticsStatusLabel(logisticStatus);
    const colorClasses = getLogisticsStatusColor(logisticStatus);
    
    return <Badge className={colorClasses}>{label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Scan className="h-5 w-5" />
          <span>Scanner un Colis</span>
        </CardTitle>
        <CardDescription>
          Recherchez un colis par son numéro de suivi pour l&apos;enregistrer en réception
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tracking">Numéro de suivi</Label>
            <div className="flex space-x-2">
              <Input
                id="tracking"
                value={trackingID}
                onChange={(e) => setTrackingID(e.target.value)}
                placeholder="BF-2024-XXXXXX"
                className="font-mono"
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && searchParcel()}
              />
              <Button onClick={searchParcel} disabled={loading}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={activateBarcodeScanner} 
                disabled={loading}
                className="bg-orange-50 border-orange-200 hover:bg-orange-100"
              >
                <Camera className="h-4 w-4 mr-1" />
                Scanner
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setQrScanMode(!qrScanMode)} 
                disabled={loading}
                className="bg-green-50 border-green-200 hover:bg-green-100"
              >
                <QrCode className="h-4 w-4 mr-1" />
                QR Code
              </Button>
              {(trackingID || parcelInfo || error || success) && (
                <Button 
                  variant="ghost" 
                  onClick={clearForm} 
                  disabled={loading}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Barcode Scanner */}
          {barcodeScanMode && (
            <div className="mt-4">
              <BarcodeScanner 
                onScan={handleBarcodeScan}
                onError={handleBarcodeScanError}
                disabled={loading}
              />
            </div>
          )}

          {/* QR Scanner */}
          {qrScanMode && (
            <div className="mt-4">
              <QRScanner 
                onScan={handleQRScan}
                onError={handleQRScanError}
                disabled={loading}
              />
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success message */}
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Parcel information */}
        {parcelInfo && (
          <div className="space-y-6 p-6 bg-gradient-to-r from-green-50 to-indigo-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center space-x-2 text-lg">
                <Package className="h-5 w-5 text-green-600" />
                <span>Informations du Colis</span>
              </h3>
              <div className="flex space-x-2">
                {getStatusBadge(parcelInfo.status)}
                {getLogisticStatusBadge(parcelInfo.logisticStatus)}
              </div>
            </div>

            {/* Informations principales */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="font-medium text-gray-600 flex items-center">
                  <Package className="h-3 w-3 mr-1" />
                  Expéditeur:
                </span>
                <p className="font-semibold">{parcelInfo.sender_name}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-gray-600 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  Destinataire:
                </span>
                <p className="font-semibold">{parcelInfo.receiver_name}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-gray-600">Type:</span>
                <p className="capitalize">{parcelInfo.type}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-gray-600">Poids déclaré:</span>
                <p className="font-semibold">{parcelInfo.totalWeight} kg</p>
              </div>
            </div>

            {/* Informations additionnelles */}
            <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-green-200">
              <div className="space-y-1">
                <span className="font-medium text-gray-600 flex items-center">
                  <Euro className="h-3 w-3 mr-1" />
                  Coût:
                </span>
                <p className="font-semibold">{parcelInfo.cost.toFixed(2)} €</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-gray-600 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Date création:
                </span>
                <p>{parcelInfo.create_date}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-gray-600">Nb d'articles:</span>
                <p>{parcelInfo.items?.length || 1}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-gray-600">Livraison:</span>
                <p className="capitalize">{parcelInfo.pickupMethod === 'warehouse' ? 'Point relais' : 'Domicile'}</p>
              </div>
            </div>

            {/* Description */}
            {parcelInfo.description && (
              <div className="pt-4 border-t border-green-200">
                <span className="font-medium text-gray-600">Description:</span>
                <p className="text-sm mt-1 italic">{parcelInfo.description}</p>
              </div>
            )}

            {/* Statuts logistique */}
            {parcelInfo.receivedAt && (
              <div className="pt-4 border-t border-green-200">
                <span className="font-medium text-gray-600 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                  Reçu le:
                </span>
                <p className="text-sm">{new Date(parcelInfo.receivedAt).toLocaleString('fr-FR')}</p>
              </div>
            )}

            {/* Actions basées sur le statut logistique unifié */}
            {parcelInfo.logisticStatus === 'pending_reception' && (
              <div className="mt-6 space-y-3">
                {/* Bouton Station de Pesée (recommandé) */}
                <a 
                  href={`/logistic/colis/weighing-station?tracking=${parcelInfo.trackingID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={loading}
                  >
                    <Scale className="mr-2 h-4 w-4" />
                    🎯 Ouvrir Station de Pesée (Recommandé)
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                
                {/* Bouton Réception Simple (alternative) */}
                <Button 
                  onClick={confirmReception} 
                  disabled={loading}
                  variant="outline"
                  className="w-full border-green-200 text-green-700 hover:bg-green-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2" />
                      Confirmation en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      📦 Réception Simple (sans pesée)
                    </>
                  )}
                </Button>
                
                {/* Note explicative */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="text-blue-600 font-medium">💡 Procédure recommandée :</div>
                  </div>
                  <ol className="mt-1 text-blue-700 list-decimal list-inside space-y-1">
                    <li>Utiliser la Station de Pesée pour un traitement complet</li>
                    <li>Peser le colis et détecter automatiquement les écarts</li>
                    <li>Générer les paiements supplémentaires si nécessaire</li>
                    <li>Notifier automatiquement le client</li>
                  </ol>
                </div>
              </div>
            )}

            {parcelInfo.logisticStatus === 'received' && (
              <div className="bg-green-100 border border-green-300 rounded-lg p-4 mt-4">
                <div className="flex items-center text-green-800">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="font-medium">✅ Colis déjà reçu à l'entrepôt</span>
                </div>
                <div className="mt-2 text-sm text-green-700">
                  <p>Prochaine étape : Pesée et vérification → 
                    <a 
                      href={`/logistic/colis/weighing-station?tracking=${parcelInfo.trackingID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 underline hover:text-green-900"
                    >
                      Ouvrir Station de Pesée
                    </a>
                  </p>
                </div>
              </div>
            )}

            {/* Message pour les autres statuts */}
            {parcelInfo.logisticStatus && 
             !isStatusVisibleInInterface(parcelInfo.logisticStatus as any, 'reception') && (
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mt-4">
                <div className="flex items-center text-gray-800">
                  <Package className="h-4 w-4 mr-2" />
                  <span className="font-medium">
                    Colis en cours de traitement : {getLogisticsStatusLabel(parcelInfo.logisticStatus || 'pending_reception')}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Ce colis n'est pas dans l'état requis pour la réception.
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}