'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Scan, 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  MapPin, 
  Clock, 
  Euro, 
  Camera, 
  Trash2, 
  QrCode,
  Scale,
  User,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { UnifiedShipment, ShipmentPhase } from '@/types/unified-shipment';
import { Parcel, SpecialCaseTypeEnum } from '@/types/parcel'; // Keep temporarily for ParcelActions compatibility
import ShipmentService from '@/services/shipment.service';
import ParcelService from '@/services/firebase'; // Keep temporarily for backward compatibility
import { QRCodeService } from '@/services/qr-code';
import { QRScanner } from './qr-scanner';
import { WeighingForm } from './weighing-form';
import { WeighingStation } from './weighing-station';
import { ParcelActions } from './parcel-actions';
import { useAuth } from '@/hooks/useAuth';

type ReceptionStep = 'search' | 'found' | 'weighing' | 'actions' | 'completed';

interface EnhancedParcelReceptionProps {
  initialTrackingID?: string;
}

export function EnhancedParcelReception({ initialTrackingID }: EnhancedParcelReceptionProps = {}) {
  // États principaux - MIGRÉ vers UnifiedShipment
  const [trackingID, setTrackingID] = useState(initialTrackingID || '');
  const [shipmentInfo, setShipmentInfo] = useState<UnifiedShipment | null>(null);
  const [parcelInfo, setParcelInfo] = useState<Parcel | null>(null); // Keep temporarily for legacy components
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scanMode, setScanMode] = useState(false);
  const [qrScanMode, setQrScanMode] = useState(false);

  // Nouveaux états pour les fonctionnalités
  const [currentStep, setCurrentStep] = useState<ReceptionStep>('search');
  const [actualWeight, setActualWeight] = useState<number | undefined>();
  const [weightPhotos, setWeightPhotos] = useState<string[]>([]);
  const [weightNotes, setWeightNotes] = useState<string>('');

  const { user } = useAuth();

  // Auto-recherche si trackingID initial fourni
  useEffect(() => {
    if (initialTrackingID && initialTrackingID.trim()) {
      searchParcel();
    }
  }, [initialTrackingID]);

  // Recherche shipment - MIGRÉ vers ShipmentService
  const searchParcel = async () => {
    if (!trackingID.trim()) {
      setError('Veuillez saisir un numéro de suivi');
      return;
    }

    setLoading(true);
    setError('');
    setShipmentInfo(null);
    setParcelInfo(null);

    try {
      console.log('🔍 [Reception] Searching for shipment:', trackingID);

      // Utiliser le nouveau service UnifiedShipment
      const result = await ShipmentService.searchByTrackingNumber(trackingID);

      if (result.found && result.shipment) {
        setShipmentInfo(result.shipment);
        setCurrentStep('found');
        console.log('✅ [Reception] Shipment found:', result.shipment);
      } else {
        setError(result.error || 'Expédition non trouvée');
      }
    } catch (searchError) {
      console.error('❌ [Reception] Search error:', searchError);
      setError('Erreur lors de la recherche de l\'expédition');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (qrCode: string) => {
    setQrScanMode(false);
    setLoading(true);
    setError('');

    try {
      const validationResult = await QRCodeService.validateQRCode(qrCode);
      
      if (validationResult.valid && validationResult.parcel) {
        setParcelInfo(validationResult.parcel);
        setTrackingID(validationResult.parcel.trackingID);
        setCurrentStep('found');
        
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
    setError(`Erreur de scan: ${error}`);
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

  const simulateScan = () => {
    const testTrackingIDs = [
      'BF-2024-001247',
      'BF-2024-001248', 
      'BF-2024-001249',
      'BF-2024-001250'
    ];
    
    const randomID = testTrackingIDs[Math.floor(Math.random() * testTrackingIDs.length)];
    setTrackingID(randomID);
    setScanMode(false);
    
    setTimeout(() => {
      searchParcel();
    }, 100);
  };

  // Nouvelles fonctions pour les fonctionnalités
  const handleWeightRecorded = (weightData: {
    actualWeight: number;
    photos: string[];
    notes?: string;
  }) => {
    setActualWeight(weightData.actualWeight);
    setWeightPhotos(weightData.photos);
    setWeightNotes(weightData.notes || '');
    setCurrentStep('actions');
    setSuccess('Pesée enregistrée avec succès');
  };

  const handleValidate = async () => {
    if (!shipmentInfo || !actualWeight) return;

    setLoading(true);
    setError('');

    try {
      // Marquer comme reçu à l'entrepôt - MIGRÉ vers ShipmentService
      const success = await ShipmentService.markAsReceivedAtWarehouse(
        shipmentInfo.id,
        user?.email || 'Agent inconnu',
        actualWeight,
        weightNotes || 'Colis reçu et pesé à l\'entrepôt Befret'
      );

      if (success) {
        console.log('✅ [Reception] Shipment marked as received at warehouse');
        setSuccess(`Expédition ${shipmentInfo.trackingNumber} validée et marquée comme reçue à l'entrepôt`);
        setCurrentStep('completed');
        window.dispatchEvent(new CustomEvent('receptionUpdated'));
      } else {
        setError('Erreur lors de la validation');
      }
    } catch (error) {
      console.error('❌ [Reception] Validation error:', error);
      setError('Erreur lors de la validation de l\'expédition');
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialCase = async (caseType: SpecialCaseTypeEnum, reason: string) => {
    if (!parcelInfo) return;
    
    setLoading(true);
    setError('');

    try {
      const success = await ParcelService.updateLogisticFields(
        parcelInfo.id!,
        {
          specialCaseType: caseType,
          specialCaseReason: reason,
          logisticsStatus: 'special_case',
          weightReal: actualWeight,
          receptionTimestamp: new Date().toISOString()
        },
        user?.email || 'unknown'
      );

      if (success) {
        setSuccess(`Cas spécial "${caseType}" déclaré pour le colis ${parcelInfo.trackingID}`);
        setCurrentStep('completed');
        window.dispatchEvent(new CustomEvent('receptionUpdated'));
      } else {
        setError('Erreur lors de la déclaration du cas spécial');
      }
    } catch (error) {
      console.error('Special case error:', error);
      setError('Erreur lors de la déclaration du cas spécial');
    } finally {
      setLoading(false);
    }
  };

  const handleWeightDifference = async () => {
    if (!parcelInfo || !actualWeight) return;
    
    setLoading(true);
    setError('');

    try {
      const declared = parcelInfo.weightDeclared || parcelInfo.weight || parcelInfo.totalWeight || 0;
      const difference = Math.abs(actualWeight - declared);
      
      const success = await ParcelService.updateLogisticFields(
        parcelInfo.id!,
        {
          weightReal: actualWeight,
          logisticsStatus: 'weight_issue',
          specialCaseType: 'oversized',
          specialCaseReason: `Écart de poids important: ${difference.toFixed(1)}kg (${((difference/declared)*100).toFixed(1)}%)`,
          receptionTimestamp: new Date().toISOString()
        },
        user?.email || 'unknown'
      );

      if (success) {
        setSuccess(`Différence de poids signalée pour le colis ${parcelInfo.trackingID}`);
        setCurrentStep('completed');
        window.dispatchEvent(new CustomEvent('receptionUpdated'));
      } else {
        setError('Erreur lors du signalement');
      }
    } catch (error) {
      console.error('Weight difference error:', error);
      setError('Erreur lors du signalement de la différence de poids');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTrackingID('');
    setParcelInfo(null);
    setError('');
    setSuccess('');
    setScanMode(false);
    setQrScanMode(false);
    setCurrentStep('search');
    setActualWeight(undefined);
    setWeightPhotos([]);
    setWeightNotes('');
  };

  // Nouvelles fonctions pour la station de pesée
  const handleWeightUpdated = (updatedParcel: Parcel) => {
    console.log('🔄 [DEBUG] [EnhancedParcelReception] handleWeightUpdated called');
    console.log('📦 [DEBUG] [EnhancedParcelReception] Updated parcel:', updatedParcel);
    console.log('📦 [DEBUG] [EnhancedParcelReception] Previous parcel:', parcelInfo);
    
    setParcelInfo(updatedParcel);
    setCurrentStep('actions');
    setSuccess('Pesée enregistrée avec succès');
    
    console.log('✅ [DEBUG] [EnhancedParcelReception] State updated, new step: actions');
  };

  const handlePaymentLinkGenerated = (paymentLink: string) => {
    setSuccess(`Lien de paiement généré: ${paymentLink}`);
    // Ici vous pourriez copier le lien dans le presse-papier
    navigator.clipboard?.writeText(paymentLink);
  };

  const proceedToWeighing = () => {
    if (parcelInfo) {
      setCurrentStep('weighing');
      setError('');
      setSuccess('');
    }
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

  const getStepIndicator = (step: ReceptionStep) => {
    const steps = [
      { key: 'search', label: 'Recherche', icon: Search },
      { key: 'found', label: 'Trouvé', icon: Package },
      { key: 'weighing', label: 'Pesée', icon: Scale },
      { key: 'actions', label: 'Actions', icon: CheckCircle },
      { key: 'completed', label: 'Terminé', icon: CheckCircle }
    ];
    
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    
    return (
      <div className="flex items-center justify-between mb-6 bg-gray-50 p-4 rounded-lg">
        {steps.map((stepItem, index) => {
          const Icon = stepItem.icon;
          const isActive = stepItem.key === currentStep;
          const isCompleted = index < currentIndex;
          const isNext = index === currentIndex + 1;
          
          return (
            <div key={stepItem.key} className="flex items-center">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                isActive ? 'bg-green-600 text-white' :
                isCompleted ? 'bg-green-600 text-white' :
                isNext ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-200 text-gray-500'
              }`}>
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{stepItem.label}</span>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Indicateur d'étapes */}
      {getStepIndicator(currentStep)}

      {/* Recherche et scan */}
      {currentStep === 'search' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Scan className="h-5 w-5" />
              <span>Scanner un Colis</span>
            </CardTitle>
            <CardDescription>
              Recherchez un colis par son numéro de suivi ou scannez son code QR
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Saisie Manuelle</TabsTrigger>
                <TabsTrigger value="scan">Scanner QR</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tracking">Numéro de suivi</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="tracking"
                      value={trackingID}
                      onChange={(e) => setTrackingID(e.target.value)}
                      placeholder="BF-2024-XXXXXX"
                      className="font-mono text-lg"
                      disabled={loading}
                      onKeyPress={(e) => e.key === 'Enter' && searchParcel()}
                    />
                    <Button onClick={searchParcel} disabled={loading} size="lg">
                      {loading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={simulateScan} 
                  disabled={loading}
                  className="w-full bg-orange-50 border-orange-200 hover:bg-orange-100"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Test avec colis aléatoire
                </Button>
              </TabsContent>
              
              <TabsContent value="scan" className="space-y-4">
                <QRScanner 
                  onScan={handleQRScan}
                  onError={handleQRScanError}
                  disabled={loading}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Shipment trouvé - MIGRÉ */}
      {currentStep === 'found' && shipmentInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-green-600" />
                <span>Expédition Trouvée</span>
              </div>
              <div className="flex space-x-2">
                <Badge variant={shipmentInfo.currentPhase === ShipmentPhase.WAREHOUSE ? 'default' : 'secondary'}>
                  {shipmentInfo.currentPhase}
                </Badge>
                <Badge variant="outline">
                  {typeof shipmentInfo.status === 'string' ? shipmentInfo.status : (shipmentInfo.status as any)?.label || (shipmentInfo.status as any)?.current || 'N/A'}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Tracking Number:</span>
                <p className="font-mono font-bold">{shipmentInfo.trackingNumber}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Expéditeur:</span>
                <p className="font-semibold">{shipmentInfo.customerInfo.sender.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Destinataire:</span>
                <p className="font-semibold">{shipmentInfo.customerInfo.receiver.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Poids déclaré:</span>
                <p className="font-semibold">{shipmentInfo.parcelInfo.weight} kg</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Destination:</span>
                <p className="font-semibold">{shipmentInfo.customerInfo.receiver.address.city}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Catégorie:</span>
                <p className="font-semibold capitalize">{shipmentInfo.category}</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => setCurrentStep('weighing')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Scale className="mr-2 h-4 w-4" />
                Procéder à la Pesée
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
              >
                Nouvelle Recherche
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug: État du colis */}
      {parcelInfo && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-blue-800 text-sm">DEBUG - État du Colis</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                if (parcelInfo.trackingID) {
                  console.log('🔄 [DEBUG] Refreshing parcel data from database...');
                  const result = await ParcelService.searchByTrackingId(parcelInfo.trackingID);
                  if (result.found && result.parcel) {
                    console.log('✅ [DEBUG] Refreshed parcel data:', result.parcel);
                    setParcelInfo(result.parcel);
                    setSuccess('Données rafraîchies depuis la base de données');
                  } else {
                    setError('Erreur lors du rafraîchissement');
                  }
                }
              }}
              disabled={loading}
              className="h-6 px-2 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Rafraîchir
            </Button>
          </CardHeader>
          <CardContent className="text-xs">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div>
                <span className="font-medium">ID:</span>
                <span className="ml-1 font-mono">{parcelInfo.id}</span>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <span className="ml-1 font-mono">{parcelInfo.status}</span>
              </div>
              <div>
                <span className="font-medium">LogisticStatus:</span>
                <span className="ml-1 font-mono">{parcelInfo.logisticStatus || 'undefined'}</span>
              </div>
              <div>
                <span className="font-medium">LogisticsStatus:</span>
                <span className="ml-1 font-mono">{parcelInfo.logisticsStatus || 'undefined'}</span>
              </div>
              <div>
                <span className="font-medium">WeightReal:</span>
                <span className="ml-1 font-mono">{parcelInfo.weightReal || 'undefined'}</span>
              </div>
              <div>
                <span className="font-medium">WeighedAt:</span>
                <span className="ml-1 font-mono">{parcelInfo.weighedAt || 'undefined'}</span>
              </div>
              <div>
                <span className="font-medium">LastUpdated:</span>
                <span className="ml-1 font-mono">{parcelInfo.lastUpdated || 'undefined'}</span>
              </div>
              <div>
                <span className="font-medium">LastUpdatedBy:</span>
                <span className="ml-1 font-mono">{parcelInfo.lastUpdatedBy || 'undefined'}</span>
              </div>
              <div>
                <span className="font-medium">ProcessingHistory:</span>
                <span className="ml-1 font-mono">{parcelInfo.processingHistory?.length || 0} entries</span>
              </div>
              <div className="col-span-full">
                <span className="font-medium">WeightVerification:</span>
                <span className="ml-1 font-mono">
                  {parcelInfo.weightVerification ? 
                    `${parcelInfo.weightVerification.status} (${parcelInfo.weightVerification.autoApproved ? 'Auto' : 'Manual'})` : 
                    'undefined'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Station de Pesée */}
      {currentStep === 'weighing' && parcelInfo && (
        <WeighingStation
          parcel={parcelInfo}
          onWeightUpdated={handleWeightUpdated}
          onPaymentLinkGenerated={handlePaymentLinkGenerated}
          disabled={loading}
        />
      )}

      {/* Actions */}
      {currentStep === 'actions' && parcelInfo && (
        <ParcelActions
          parcel={parcelInfo}
          actualWeight={actualWeight}
          weightPhotos={weightPhotos}
          onValidate={handleValidate}
          onSpecialCase={handleSpecialCase}
          onWeightDifference={handleWeightDifference}
          loading={loading}
        />
      )}

      {/* Terminé */}
      {currentStep === 'completed' && (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <h3 className="text-xl font-bold text-green-800">Colis Traité avec Succès!</h3>
            <p className="text-gray-600">
              Le colis {parcelInfo?.trackingID} a été traité et enregistré dans le système.
            </p>
            <Button 
              onClick={resetForm}
              className="bg-green-600 hover:bg-green-700"
            >
              Traiter un Nouveau Colis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Messages d'erreur et succès */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}