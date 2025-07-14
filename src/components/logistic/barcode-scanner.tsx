'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CameraOff, AlertTriangle, CheckCircle, RotateCcw, Upload } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function BarcodeScanner({ onScan, onError, disabled = false }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    // Initialiser le lecteur de codes-barres
    codeReader.current = new BrowserMultiFormatReader();
    
    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
    };
  }, []);

  const getVideoDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      setVideoDevices(videoInputs);
      
      // Préférer la caméra arrière pour les tablettes/mobiles
      const backCamera = videoInputs.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('environment') ||
        device.label.toLowerCase().includes('rear')
      );
      
      if (backCamera) {
        setSelectedDevice(backCamera.deviceId);
      } else if (videoInputs.length > 0) {
        setSelectedDevice(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.error('Error getting video devices:', err);
      setError('Impossible de lister les caméras disponibles');
    }
  };

  const startScanning = async () => {
    if (!codeReader.current || !videoRef.current) return;
    
    setIsScanning(true);
    setError('');
    setSuccess('');
    
    try {
      const deviceId = selectedDevice || null;
      
      // Start decoding from video device - codes-barres uniquement
      await codeReader.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const scannedText = result.getText();
            
            // Valider que c'est un format de tracking ID valide
            if (isValidTrackingFormat(scannedText)) {
              setSuccess(`Code-barres scanné: ${scannedText}`);
              onScan(scannedText);
              stopScanning();
            } else {
              setError(`Format invalide: ${scannedText}. Attendu: BF-YYYY-XXXXXX`);
            }
          }
          
          if (error && error.name !== 'NotFoundException') {
            console.error('Scanning error:', error);
            setError(`Erreur de scan: ${error.message}`);
            onError(error.message);
          }
        }
      );
    } catch (err: any) {
      console.error('Failed to start scanning:', err);
      setError(`Impossible de démarrer le scan: ${err.message}`);
      onError(err.message);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset();
    }
    setIsScanning(false);
  };

  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission('granted');
      getVideoDevices();
    } catch (err) {
      setCameraPermission('denied');
      setError('Permission caméra refusée');
    }
  };

  const switchCamera = () => {
    if (videoDevices.length > 1) {
      const currentIndex = videoDevices.findIndex(device => device.deviceId === selectedDevice);
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      setSelectedDevice(videoDevices[nextIndex].deviceId);
      
      if (isScanning) {
        stopScanning();
        setTimeout(startScanning, 100);
      }
    }
  };

  const isValidTrackingFormat = (code: string): boolean => {
    // Valider le format BF-YYYY-XXXXXX ou autres formats acceptés
    const trackingPatterns = [
      /^BF-\d{4}-\d{6}$/,           // BF-2024-001234
      /^BGFXNG$/,                   // Format court existant
      /^[A-Z]{2,}-\d{4}-\d{3,6}$/  // Format général XX-YYYY-XXX
    ];
    
    return trackingPatterns.some(pattern => pattern.test(code));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !codeReader.current) return;

    try {
      const result = await codeReader.current.decodeFromImageUrl(URL.createObjectURL(file));
      const scannedText = result.getText();
      
      if (isValidTrackingFormat(scannedText)) {
        setSuccess(`Code-barres lu depuis l'image: ${scannedText}`);
        onScan(scannedText);
      } else {
        setError(`Format invalide dans l'image: ${scannedText}`);
      }
    } catch (err) {
      setError('Aucun code-barres détecté dans l\'image');
    }
    
    // Reset input
    event.target.value = '';
  };

  if (cameraPermission === 'denied') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CameraOff className="h-5 w-5" />
            <span>Caméra non disponible</span>
          </CardTitle>
          <CardDescription>
            L'accès à la caméra est nécessaire pour scanner les codes-barres
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Camera className="h-5 w-5" />
          <span>Scanner Code-barres</span>
        </CardTitle>
        <CardDescription>
          Scannez le code-barres du tracking ID (format: BF-YYYY-XXXXXX)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera permission request */}
        {cameraPermission === 'prompt' && (
          <Button 
            onClick={requestCameraPermission}
            className="w-full"
            disabled={disabled}
          >
            <Camera className="mr-2 h-4 w-4" />
            Autoriser l'accès à la caméra
          </Button>
        )}

        {/* Camera controls */}
        {cameraPermission === 'granted' && (
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button
                onClick={isScanning ? stopScanning : startScanning}
                disabled={disabled}
                className={isScanning ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
              >
                <Camera className="mr-2 h-4 w-4" />
                {isScanning ? 'Arrêter le scan' : 'Commencer le scan'}
              </Button>
              
              {videoDevices.length > 1 && (
                <Button
                  variant="outline"
                  onClick={switchCamera}
                  disabled={disabled}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Upload alternative */}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={disabled}
              />
              <Button variant="outline" className="w-full" disabled={disabled}>
                <Upload className="mr-2 h-4 w-4" />
                Ou choisir une image
              </Button>
            </div>
          </div>
        )}

        {/* Video preview */}
        {isScanning && (
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-64 bg-black rounded-lg object-cover"
              autoPlay
              muted
              playsInline
            />
            <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-lg pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-48 h-12 border-2 border-red-500 bg-red-500/20 rounded">
                  <div className="text-center text-white text-xs mt-2">
                    Placez le code-barres ici
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scanning status */}
        {isScanning && (
          <div className="text-center">
            <div className="animate-pulse text-green-600 font-medium">
              🔍 Recherche de codes-barres...
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Gardez le code-barres stable et bien éclairé
            </p>
          </div>
        )}

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

        {/* Instructions */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <h4 className="font-medium text-green-900 mb-2">Instructions :</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Tenez l'appareil stable</li>
            <li>• Assurez-vous que le code-barres est bien éclairé</li>
            <li>• Formats acceptés : BF-YYYY-XXXXXX, BGFXNG</li>
            <li>• Distance recommandée : 10-20 cm</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}