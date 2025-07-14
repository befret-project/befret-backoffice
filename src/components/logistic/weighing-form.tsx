'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Scale, 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Trash2,
  Save
} from 'lucide-react';
import { Parcel } from '@/types/parcel';

interface WeighingFormProps {
  parcel: Parcel;
  onWeightRecorded: (weightData: {
    actualWeight: number;
    photos: string[];
    notes?: string;
  }) => void;
  disabled?: boolean;
}

export function WeighingForm({ parcel, onWeightRecorded, disabled = false }: WeighingFormProps) {
  const [actualWeight, setActualWeight] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculer l'écart de poids
  const calculateWeightVariance = () => {
    const declared = parcel.weightDeclared || parcel.weight || parcel.totalWeight || 0;
    const actual = parseFloat(actualWeight) || 0;
    
    if (declared === 0 || actual === 0) return null;
    
    const difference = Math.abs(actual - declared);
    const percentage = (difference / declared) * 100;
    
    return {
      declared,
      actual,
      difference,
      percentage,
      status: difference > 0.2 ? (difference > 0.5 ? 'ERROR' : 'WARNING') : 'OK'
    };
  };

  const variance = calculateWeightVariance();

  // Démarrer la capture photo
  const startCamera = async () => {
    setIsCapturing(true);
    setError('');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setError('Impossible d\'accéder à la caméra');
      setIsCapturing(false);
    }
  };

  // Prendre une photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Définir la taille du canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Dessiner l'image vidéo sur le canvas
    context.drawImage(video, 0, 0);
    
    // Convertir en base64
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    // Ajouter à la liste des photos
    setPhotos(prev => [...prev, photoDataUrl]);
    
    // Arrêter la caméra
    stopCamera();
    
    setSuccess('Photo capturée avec succès');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Arrêter la caméra
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  // Upload fichier photo
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPhotos(prev => [...prev, result]);
      setSuccess('Photo ajoutée avec succès');
      setTimeout(() => setSuccess(''), 3000);
    };
    reader.readAsDataURL(file);
  };

  // Supprimer une photo
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Enregistrer les données de pesée
  const handleSave = () => {
    const weight = parseFloat(actualWeight);
    
    if (!weight || weight <= 0) {
      setError('Veuillez saisir un poids valide');
      return;
    }
    
    if (photos.length === 0) {
      setError('Veuillez prendre au moins une photo de la pesée');
      return;
    }
    
    onWeightRecorded({
      actualWeight: weight,
      photos,
      notes: notes.trim() || undefined
    });
  };

  const getVarianceColor = (status: string) => {
    switch (status) {
      case 'OK': return 'text-green-600 bg-green-50 border-green-200';
      case 'WARNING': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'ERROR': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getVarianceIcon = (status: string) => {
    switch (status) {
      case 'OK': return <CheckCircle className="h-4 w-4" />;
      case 'WARNING': return <AlertTriangle className="h-4 w-4" />;
      case 'ERROR': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Scale className="h-5 w-5" />
          <span>Pesée du Colis</span>
        </CardTitle>
        <CardDescription>
          Pesez le colis et prenez des photos pour validation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informations du colis */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">
            📦 {parcel.trackingID} - {parcel.sender_name} → {parcel.receiver_name}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-green-700">Poids déclaré:</span>
              <p className="text-lg font-bold text-green-900">
                {parcel.weightDeclared || parcel.weight || parcel.totalWeight || 0} kg
              </p>
            </div>
            <div>
              <span className="font-medium text-green-700">Type:</span>
              <p className="capitalize">{parcel.type}</p>
            </div>
          </div>
        </div>

        {/* Saisie du poids réel */}
        <div className="space-y-2">
          <Label htmlFor="actualWeight" className="text-base font-semibold">
            Poids réel (kg) *
          </Label>
          <div className="flex space-x-2">
            <Input
              id="actualWeight"
              type="number"
              step="0.1"
              min="0"
              value={actualWeight}
              onChange={(e) => setActualWeight(e.target.value)}
              placeholder="Ex: 2.3"
              className="text-lg font-mono"
              disabled={disabled}
            />
            <div className="flex items-center text-gray-500">
              <Scale className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Comparaison des poids */}
        {variance && (
          <Alert className={`border-2 ${getVarianceColor(variance.status)}`}>
            <div className="flex items-center space-x-2">
              {getVarianceIcon(variance.status)}
              <AlertDescription className="flex-1">
                <div className="font-semibold mb-2">Comparaison des poids</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Déclaré:</span> {variance.declared} kg
                  </div>
                  <div>
                    <span className="font-medium">Réel:</span> {variance.actual} kg
                  </div>
                  <div>
                    <span className="font-medium">Écart:</span> {variance.difference.toFixed(1)} kg
                  </div>
                  <div>
                    <span className="font-medium">Pourcentage:</span> {variance.percentage.toFixed(1)}%
                  </div>
                </div>
                {variance.status === 'WARNING' && (
                  <p className="mt-2 text-orange-700 font-medium">
                    ⚠️ Écart supérieur à 200g - Vérification recommandée
                  </p>
                )}
                {variance.status === 'ERROR' && (
                  <p className="mt-2 text-red-700 font-medium">
                    🚨 Écart important - Cas spécial requis
                  </p>
                )}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Section photo */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Photos de pesée *</Label>
          
          {/* Boutons de capture */}
          <div className="flex space-x-2">
            {!isCapturing && (
              <>
                <Button
                  onClick={startCamera}
                  disabled={disabled}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Prendre Photo
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  disabled={disabled}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Charger Photo
                </Button>
              </>
            )}
            
            {isCapturing && (
              <div className="flex space-x-2">
                <Button
                  onClick={capturePhoto}
                  className="bg-green-600 hover:bg-green-700"
                >
                  📸 Capturer
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="outline"
                >
                  Annuler
                </Button>
              </div>
            )}
          </div>

          {/* Caméra en direct */}
          {isCapturing && (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full max-w-md h-64 bg-black rounded-lg object-cover"
                autoPlay
                playsInline
              />
              <div className="absolute inset-0 border-2 border-dashed border-white opacity-50 rounded-lg pointer-events-none"></div>
            </div>
          )}

          {/* Canvas caché pour capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Input fichier caché */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Galerie des photos */}
          {photos.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Photos capturées ({photos.length})</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Photo pesée ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <Button
                      onClick={() => removePhoto(index)}
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={disabled}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <Badge className="absolute bottom-1 left-1 text-xs">
                      Photo {index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-base font-semibold">
            Notes (optionnel)
          </Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observations sur la pesée, l'état du colis, etc."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20"
            disabled={disabled}
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

        {/* Bouton de sauvegarde */}
        <Button
          onClick={handleSave}
          disabled={disabled || !actualWeight || photos.length === 0}
          className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
        >
          <Save className="mr-2 h-5 w-5" />
          Enregistrer la Pesée
        </Button>
      </CardContent>
    </Card>
  );
}