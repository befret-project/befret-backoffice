'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  Scale, 
  Camera, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  CreditCard,
  RefreshCw,
  Save,
  Upload,
  X,
  AlertCircle
} from 'lucide-react';
import { Parcel, WeightPhoto, WeightVerification } from '@/types/parcel';
import ParcelService from '@/services/firebase';
import { useAuth } from '@/hooks/useAuth';
import { SpecialCaseModal } from '@/components/special-case/special-case-modal';
import StripePaymentService from '@/services/payment-stripe';
import { ParcelDebugPanel } from '@/components/debug/parcel-debug-panel';

interface WeighingStationProps {
  parcel: Parcel;
  onWeightUpdated: (updatedParcel: Parcel) => void;
  onPaymentLinkGenerated?: (paymentLink: string) => void;
  disabled?: boolean;
}

interface WeightCalculation {
  declaredWeight: number;
  actualWeight: number;
  difference: number;
  percentage: number;
  status: 'OK' | 'SUPPLEMENT' | 'REFUND';
  supplementAmount?: number;
  refundAmount?: number;
}

export function WeighingStation({ 
  parcel, 
  onWeightUpdated, 
  onPaymentLinkGenerated,
  disabled = false 
}: WeighingStationProps) {
  const { user } = useAuth();
  const [actualWeight, setActualWeight] = useState<string>(parcel.weightReal?.toString() || '');
  const [photos, setPhotos] = useState<WeightPhoto[]>(parcel.weightPhotos || []);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [calculation, setCalculation] = useState<WeightCalculation | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showSpecialCaseModal, setShowSpecialCaseModal] = useState(false);
  const [currentParcel, setCurrentParcel] = useState<Parcel>(parcel);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Configuration des tarifs
  const WEIGHT_TOLERANCE = 0.2; // 200g
  const SUPPLEMENT_RATE = 2.5; // €/kg supplémentaire
  const BASE_COST_PER_KG = parcel.cost / (parcel.weightDeclared || parcel.weight || 1);

  const calculateWeightDifference = (declared: number, actual: number): WeightCalculation => {
    // Validation des entrées
    if (!declared || declared <= 0 || !actual || actual <= 0) {
      return {
        declaredWeight: declared || 0,
        actualWeight: actual || 0,
        difference: 0,
        percentage: 0,
        status: 'OK'
      };
    }

    const difference = actual - declared;
    const percentage = (difference / declared) * 100;
    
    let status: WeightCalculation['status'] = 'OK';
    let supplementAmount: number | undefined;
    let refundAmount: number | undefined;

    if (Math.abs(difference) <= WEIGHT_TOLERANCE) {
      status = 'OK';
    } else if (difference > WEIGHT_TOLERANCE) {
      status = 'SUPPLEMENT';
      supplementAmount = difference * SUPPLEMENT_RATE;
    } else if (difference < -WEIGHT_TOLERANCE) {
      status = 'REFUND';
      refundAmount = Math.abs(difference) * BASE_COST_PER_KG;
    }

    return {
      declaredWeight: declared,
      actualWeight: actual,
      difference,
      percentage,
      status,
      supplementAmount,
      refundAmount
    };
  };

  const handleWeightChange = (value: string) => {
    setActualWeight(value);
    setError('');
    
    const weight = parseFloat(value);
    if (!isNaN(weight) && weight > 0) {
      const declaredWeight = parcel.weightDeclared || parcel.weight || 0;
      const calc = calculateWeightDifference(declaredWeight, weight);
      setCalculation(calc);
    } else {
      setCalculation(null);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Impossible d\'accéder à la caméra');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const reader = new FileReader();
        reader.onload = () => {
          const photoData: WeightPhoto = {
            url: reader.result as string,
            timestamp: new Date().toISOString(),
            type: 'balance',
            operator: user?.email || 'Agent inconnu',
            metadata: {
              cameraDevice: 'Web Camera',
              location: 'Station de pesée',
              lighting: 'Standard'
            }
          };
          
          setPhotos(prev => [...prev, photoData]);
          setSuccess('Photo capturée avec succès');
          stopCamera();
        };
        reader.readAsDataURL(blob);
      }
    }, 'image/jpeg', 0.8);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const photoData: WeightPhoto = {
        url: reader.result as string,
        timestamp: new Date().toISOString(),
        type: 'balance',
        operator: user?.email || 'Agent inconnu',
        metadata: {
          cameraDevice: 'Upload',
          location: 'Station de pesée',
          lighting: 'Upload'
        }
      };
      
      setPhotos(prev => [...prev, photoData]);
      setSuccess('Photo ajoutée avec succès');
    };
    reader.readAsDataURL(file);
    
    // Reset input
    event.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const saveWeightData = async () => {
    console.log('🔍 [DEBUG] Starting saveWeightData function');
    console.log('🔍 [DEBUG] Current parcel:', parcel);
    console.log('🔍 [DEBUG] User:', user);
    console.log('🔍 [DEBUG] ActualWeight:', actualWeight);
    console.log('🔍 [DEBUG] Calculation:', calculation);
    console.log('🔍 [DEBUG] Photos:', photos);
    
    // Validation des données
    const weight = parseFloat(actualWeight);
    if (!actualWeight || isNaN(weight) || weight <= 0) {
      console.error('❌ [DEBUG] Invalid weight:', actualWeight);
      setError('Veuillez saisir un poids valide supérieur à 0');
      return;
    }

    if (!calculation) {
      console.error('❌ [DEBUG] No calculation available');
      setError('Erreur de calcul. Veuillez vérifier le poids saisi');
      return;
    }

    if (photos.length === 0) {
      console.error('❌ [DEBUG] No photos provided');
      setError('Veuillez ajouter au moins une photo de la balance');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const weightVerification: WeightVerification = {
        difference: calculation.difference,
        percentage: calculation.percentage,
        status: calculation.status === 'OK' ? 'OK' : calculation.status === 'SUPPLEMENT' ? 'WARNING' : 'ERROR',
        tolerance: WEIGHT_TOLERANCE,
        autoApproved: calculation.status === 'OK',
        operator: user?.email || 'Agent inconnu',
        timestamp: new Date().toISOString()
      };

      // Ajouter les notes seulement si elles existent
      if (notes.trim()) {
        weightVerification.notes = notes.trim();
      }

      // Construire l'objet de mise à jour en filtrant strictement les undefined
      const updatedParcel: Record<string, any> = {
        weightReal: weight,
        weightPhotos: photos,
        weightVerification,
        logisticsStatus: calculation.status === 'OK' ? 'verified' : 'weight_issue',
        weighedAt: new Date().toISOString()
      };

      // Ajouter les champs optionnels seulement s'ils sont valides
      if (user?.email) {
        updatedParcel.agentId = user.email;
        updatedParcel.lastUpdatedBy = user.email;
      }

      // Assurer qu'il y a un poids déclaré pour le calcul
      if (!parcel.weightDeclared && parcel.weight) {
        updatedParcel.weightDeclared = parcel.weight;
      }

      console.log('📦 [DEBUG] Saving weight data:', updatedParcel);
      console.log('📦 [DEBUG] Parcel ID:', parcel.id);

      const success = await ParcelService.updateLogisticFields(
        parcel.id!, 
        updatedParcel,
        user?.email
      );

      console.log('📦 [DEBUG] UpdateLogisticFields result:', success);

      if (success) {
        console.log('✅ [DEBUG] Weight data saved successfully');
        
        const fullUpdatedParcel = { ...parcel, ...updatedParcel };
        console.log('📦 [DEBUG] Full updated parcel:', fullUpdatedParcel);
        
        // Mettre à jour l'état local
        console.log('🔄 [DEBUG] Updating currentParcel state');
        setCurrentParcel(fullUpdatedParcel);
        
        // Appel du callback pour mettre à jour l'UI
        console.log('🔄 [DEBUG] Calling onWeightUpdated callback');
        onWeightUpdated(fullUpdatedParcel);
        
        // Envoi de la notification de pesée avec les nouvelles données
        try {
          const weighingData = {
            actualWeight: weight,
            declaredWeight: parcel.weightDeclared || parcel.weight || 0,
            weighingPhotos: photos.map(photo => photo.url),
            weighingStatus: calculation.status === 'OK' ? 'ok' as const : 
                          calculation.status === 'SUPPLEMENT' ? 'supplement_required' as const : 
                          'refund_available' as const
          };

          console.log('📧 [DEBUG] Sending weighing notification with data:', weighingData);
          const notificationSent = await ParcelService.sendWeighingNotification(fullUpdatedParcel, weighingData);
          
          if (notificationSent) {
            console.log('✅ [DEBUG] Notification sent successfully');
            setSuccess(`Pesée enregistrée et notification envoyée - ${calculation.status === 'OK' ? 'Poids conforme' : 
              calculation.status === 'SUPPLEMENT' ? 'Supplément requis' : 'Remboursement dû'}`);
          } else {
            console.log('⚠️ [DEBUG] Notification not sent');
            setSuccess(`Pesée enregistrée - ${calculation.status === 'OK' ? 'Poids conforme' : 
              calculation.status === 'SUPPLEMENT' ? 'Supplément requis' : 'Remboursement dû'} (notification non envoyée)`);
          }
        } catch (notificationError) {
          console.error('❌ [DEBUG] Error sending weighing notification:', notificationError);
          setSuccess(`Pesée enregistrée - ${calculation.status === 'OK' ? 'Poids conforme' : 
            calculation.status === 'SUPPLEMENT' ? 'Supplément requis' : 'Remboursement dû'} (erreur notification)`);
        }

        // Déclencher le tri automatique si le poids est conforme
        try {
          if (calculation.status === 'OK' && weightVerification.autoApproved) {
            console.log('🚀 [DEBUG] Triggering auto-sort after successful weighing...');
            const autoSorted = await ParcelService.triggerAutoSortAfterWeighing(parcel.id!, user?.email);
            
            if (autoSorted) {
              console.log('✅ [DEBUG] Auto-sort completed successfully');
              setSuccess(prevSuccess => prevSuccess + ' → Tri automatique effectué');
            } else {
              console.log('⚠️ [DEBUG] Auto-sort failed or not triggered');
            }
          }
        } catch (autoSortError) {
          console.error('❌ [DEBUG] Error during auto-sort trigger:', autoSortError);
          // Ne pas faire échouer la pesée si le tri automatique échoue
        }
        
        // Clear form after successful save
        setTimeout(() => setSuccess(''), 5000);
      } else {
        console.error('❌ [DEBUG] Failed to save weight data');
        setError('Erreur lors de l\'enregistrement');
      }
    } catch (err) {
      console.error('❌ [DEBUG] Exception in saveWeightData:', err);
      setError('Erreur lors de l\'enregistrement des données');
    } finally {
      setLoading(false);
    }
  };

  const generatePaymentLink = async () => {
    if (!calculation?.supplementAmount) return;

    setLoading(true);
    try {
      console.log('💳 Generating Stripe payment link for weight supplement...');
      
      const declaredWeight = parcel.weightDeclared || parcel.weight || 0;
      const actualWeightValue = parseFloat(actualWeight);
      
      // Récupérer l'email du client si possible
      const customerEmail = parcel.mail2User || '';
      const customerPhone = parcel.receiver_phone || '';

      const result = await StripePaymentService.generateWeightSupplementPayment(
        parcel.trackingID || '',
        parcel.id || '',
        declaredWeight,
        actualWeightValue,
        customerEmail,
        customerPhone
      );

      if (result.success && result.paymentLink) {
        if (onPaymentLinkGenerated) {
          onPaymentLinkGenerated(result.paymentLink.url);
        }
        
        setSuccess(`Lien de paiement généré: ${StripePaymentService.formatAmount(result.supplementAmount || 0)}`);
        
        // Optionnel: ouvrir le lien dans un nouvel onglet
        // window.open(result.paymentLink.url, '_blank');
        
      } else {
        setError(result.error || 'Erreur lors de la génération du lien de paiement');
      }

    } catch (err) {
      console.error('Error generating payment link:', err);
      setError('Erreur lors de la génération du lien de paiement');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: WeightCalculation['status']) => {
    switch (status) {
      case 'OK':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'SUPPLEMENT':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'REFUND':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = (status: WeightCalculation['status']) => {
    switch (status) {
      case 'OK':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'SUPPLEMENT':
        return <TrendingUp className="h-5 w-5 text-red-600" />;
      case 'REFUND':
        return <TrendingDown className="h-5 w-5 text-green-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Scale className="h-5 w-5" />
          <span>Station de Pesée</span>
        </CardTitle>
        <CardDescription>
          Pesée et validation du colis {parcel.trackingID}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Debug Panel */}
        <ParcelDebugPanel 
          parcel={currentParcel} 
          onParcelRefresh={(refreshedParcel) => {
            console.log('🔄 [DEBUG] Parcel refreshed from debug panel:', refreshedParcel);
            setCurrentParcel(refreshedParcel);
            onWeightUpdated(refreshedParcel);
          }}
        />
        {/* Informations du colis */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Informations du colis</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Poids déclaré:</span>
              <span className="font-medium ml-2">{parcel.weightDeclared || parcel.weight || 0} kg</span>
            </div>
            <div>
              <span className="text-gray-600">Coût initial:</span>
              <span className="font-medium ml-2">{parcel.cost.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Saisie du poids */}
        <div className="space-y-2">
          <Label htmlFor="actualWeight">Poids réel (kg)</Label>
          <Input
            id="actualWeight"
            type="number"
            step="0.01"
            min="0"
            value={actualWeight}
            onChange={(e) => handleWeightChange(e.target.value)}
            placeholder="0.00"
            className="text-lg font-mono"
            disabled={disabled || loading}
          />
        </div>

        {/* Résultat du calcul */}
        {calculation && (
          <div className={`rounded-lg border-2 p-4 ${getStatusColor(calculation.status)}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon(calculation.status)}
                <span className="font-medium">
                  {calculation.status === 'OK' && 'Poids conforme'}
                  {calculation.status === 'SUPPLEMENT' && 'Supplément requis'}
                  {calculation.status === 'REFUND' && 'Remboursement dû'}
                </span>
              </div>
              <Badge variant="outline" className="font-mono">
                {calculation.difference > 0 ? '+' : ''}{calculation.difference.toFixed(2)} kg
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Écart:</span>
                <span className="font-medium ml-2">{calculation.percentage.toFixed(1)}%</span>
              </div>
              {calculation.supplementAmount && (
                <div>
                  <span className="text-gray-600">Supplément:</span>
                  <span className="font-medium ml-2 text-red-600">+{calculation.supplementAmount.toFixed(2)} €</span>
                </div>
              )}
              {calculation.refundAmount && (
                <div>
                  <span className="text-gray-600">Remboursement:</span>
                  <span className="font-medium ml-2 text-green-600">-{calculation.refundAmount.toFixed(2)} €</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Capture photo */}
        <div className="space-y-4">
          <Label>Photos de la balance</Label>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={cameraActive ? stopCamera : startCamera}
              disabled={disabled || loading}
            >
              <Camera className="h-4 w-4 mr-2" />
              {cameraActive ? 'Arrêter caméra' : 'Prendre photo'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || loading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Charger image
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Caméra */}
          {cameraActive && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 bg-black rounded-lg object-cover"
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <Button onClick={capturePhoto} className="bg-white text-black hover:bg-gray-100">
                  <Camera className="h-4 w-4 mr-2" />
                  Capturer
                </Button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Photos prises */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo.url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg cursor-pointer"
                    onClick={() => setPreviewImage(photo.url)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white hover:bg-red-600"
                    disabled={disabled || loading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optionnel)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observations sur la pesée..."
            rows={3}
            disabled={disabled || loading}
          />
        </div>

        {/* Messages */}
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

        {/* Actions */}
        <div className="flex flex-col space-y-3">
          <div className="flex space-x-2">
            <Button
              onClick={saveWeightData}
              disabled={disabled || loading || !actualWeight || photos.length === 0}
              className="flex-1"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer pesée
            </Button>

            {calculation?.status === 'SUPPLEMENT' && (
              <Button
                onClick={generatePaymentLink}
                disabled={disabled || loading}
                variant="outline"
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Générer lien paiement
              </Button>
            )}
          </div>

          {/* Bouton cas spécial */}
          <Button
            onClick={() => setShowSpecialCaseModal(true)}
            disabled={disabled || loading}
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Marquer cas spécial
          </Button>
        </div>

        {/* Preview modal */}
        {previewImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-lg p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewImage(null)}
                className="absolute top-2 right-2 z-10"
              >
                <X className="h-4 w-4" />
              </Button>
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        )}

        {/* Special Case Modal */}
        <SpecialCaseModal
          isOpen={showSpecialCaseModal}
          onClose={() => setShowSpecialCaseModal(false)}
          parcel={parcel}
          onSpecialCaseCreated={(updatedParcel) => {
            onWeightUpdated(updatedParcel);
            setShowSpecialCaseModal(false);
            setSuccess('Cas spécial créé avec succès');
          }}
        />
      </CardContent>
    </Card>
  );
}