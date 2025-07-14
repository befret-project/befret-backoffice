'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Package, 
  CreditCard, 
  Camera, 
  Upload, 
  X,
  CheckCircle,
  RefreshCw,
  Send
} from 'lucide-react';
import { Parcel, SpecialCaseTypeEnum, LogisticsStatusEnum } from '@/types/parcel';
import ParcelService from '@/services/firebase';
import { useAuth } from '@/hooks/useAuth';

interface SpecialCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcel: Parcel;
  onSpecialCaseCreated?: (updatedParcel: Parcel) => void;
}

interface SpecialCaseType {
  id: SpecialCaseTypeEnum;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  requiresPhotos: boolean;
}

const SPECIAL_CASE_TYPES: SpecialCaseType[] = [
  {
    id: 'dangerous',
    label: 'Colis dangereux/suspect',
    description: 'Marchandise potentiellement dangereuse ou suspecte',
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'bg-red-100 text-red-800 border-red-200',
    requiresPhotos: true
  },
  {
    id: 'payment_pending',
    label: 'En attente paiement supplément',
    description: 'Supplément de poids ou frais supplémentaires requis',
    icon: <CreditCard className="h-5 w-5" />,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    requiresPhotos: false
  },
  {
    id: 'fragile',
    label: 'Nécessite emballage spécial',
    description: 'Objet fragile nécessitant un conditionnement particulier',
    icon: <Package className="h-5 w-5" />,
    color: 'bg-green-100 text-green-800 border-green-200',
    requiresPhotos: true
  },
  {
    id: 'damaged',
    label: 'Colis endommagé',
    description: 'Dégâts constatés sur le colis ou son contenu',
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    requiresPhotos: true
  }
];

export function SpecialCaseModal({ isOpen, onClose, parcel, onSpecialCaseCreated }: SpecialCaseModalProps) {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<SpecialCaseTypeEnum | null>(null);
  const [reason, setReason] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const selectedTypeInfo = selectedType ? SPECIAL_CASE_TYPES.find(t => t.id === selectedType) : null;

  const handleClose = () => {
    if (loading) return;
    
    setSelectedType(null);
    setReason('');
    setPhotos([]);
    setError(null);
    setSuccess(null);
    setPreviewImage(null);
    stopCamera();
    onClose();
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
          setPhotos(prev => [...prev, reader.result as string]);
          setSuccess('Photo capturée avec succès');
          stopCamera();
          setTimeout(() => setSuccess(null), 3000);
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
      setPhotos(prev => [...prev, reader.result as string]);
      setSuccess('Photo ajoutée avec succès');
      setTimeout(() => setSuccess(null), 3000);
    };
    reader.readAsDataURL(file);
    
    event.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedType) {
      setError('Veuillez sélectionner un type de cas spécial');
      return;
    }

    if (!reason.trim() || reason.trim().length < 10) {
      setError('Veuillez saisir un motif d\'au moins 10 caractères');
      return;
    }

    const typeInfo = SPECIAL_CASE_TYPES.find(t => t.id === selectedType);
    if (typeInfo?.requiresPhotos && photos.length === 0) {
      setError('Ce type de cas spécial nécessite au moins une photo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Mettre à jour le colis avec le cas spécial
      const updateData = {
        specialCaseType: selectedType,
        specialCaseReason: reason.trim(),
        specialCasePhotos: photos,
        logisticsStatus: 'special_case' as LogisticsStatusEnum,
        specialCaseCreatedAt: new Date().toISOString(),
        specialCaseCreatedBy: user?.email || 'Agent inconnu',
        lastUpdated: new Date().toISOString()
      };

      const success = await ParcelService.updateLogisticFields(
        parcel.id!,
        updateData,
        user?.email
      );

      if (success) {
        const updatedParcel = { ...parcel, ...updateData };
        
        // Envoyer notification automatique au client
        try {
          console.log('📧 Sending special case notification...');
          // Ici vous pourriez appeler une fonction de notification spécifique
          // await ParcelService.sendSpecialCaseNotification(updatedParcel, selectedType, reason.trim());
        } catch (notificationError) {
          console.error('Error sending special case notification:', notificationError);
        }

        setSuccess(`Cas spécial "${typeInfo?.label}" créé avec succès`);
        
        if (onSpecialCaseCreated) {
          onSpecialCaseCreated(updatedParcel);
        }

        // Fermer la modal après 2 secondes
        setTimeout(() => {
          handleClose();
        }, 2000);

      } else {
        setError('Erreur lors de la création du cas spécial');
      }

    } catch (err) {
      console.error('Error creating special case:', err);
      setError('Erreur lors de la création du cas spécial');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span>Marquer comme cas spécial</span>
          </DialogTitle>
          <DialogDescription>
            Colis {parcel.trackingID} - {parcel.receiver_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sélection du type de cas spécial */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Type de cas spécial</Label>
            <div className="grid grid-cols-1 gap-3">
              {SPECIAL_CASE_TYPES.map((type) => (
                <div
                  key={type.id}
                  className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                    selectedType === type.id
                      ? type.color + ' border-current'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedType(type.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                      {type.requiresPhotos && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          Photos requises
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Motif détaillé */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motif détaillé *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Décrivez précisément le problème constaté..."
              rows={4}
              className="resize-none"
              disabled={loading}
            />
            <div className="text-xs text-gray-500">
              {reason.length}/500 caractères (minimum 10)
            </div>
          </div>

          {/* Photos (si nécessaires) */}
          {selectedTypeInfo?.requiresPhotos && (
            <div className="space-y-4">
              <Label>Photos du problème *</Label>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={cameraActive ? stopCamera : startCamera}
                  disabled={loading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {cameraActive ? 'Arrêter caméra' : 'Prendre photo'}
                </Button>
                
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
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
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg cursor-pointer"
                        onClick={() => setPreviewImage(photo)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white hover:bg-red-600"
                        disabled={loading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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

          {/* Aperçu de la notification */}
          {selectedType && reason.length >= 10 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">
                Aperçu de la notification client
              </h4>
              <div className="text-sm text-green-800">
                <p>
                  <strong>Cher {parcel.receiver_name},</strong>
                </p>
                <p className="mt-2">
                  Votre colis {parcel.trackingID} nécessite une attention particulière : {selectedTypeInfo?.label.toLowerCase()}.
                </p>
                <p className="mt-2">
                  Motif : {reason}
                </p>
                <p className="mt-2">
                  Notre équipe vous contactera prochainement pour vous informer des prochaines étapes.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedType || reason.length < 10}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Créer cas spécial
          </Button>
        </DialogFooter>

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
      </DialogContent>
    </Dialog>
  );
}