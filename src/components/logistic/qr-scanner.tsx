'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CameraOff, CheckCircle, AlertTriangle, QrCode } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';

interface QRScannerProps {
  onScan: (result: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function QRScanner({ onScan, onError, disabled = false }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [supportedDevices, setSupportedDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  
  useEffect(() => {
    // Initialize the code reader
    codeReader.current = new BrowserMultiFormatReader();
    
    // Check camera permissions on mount
    checkCameraPermission();
    
    // Get available cameras
    getVideoDevices();
    
    return () => {
      stopScanning();
    };
  }, []);

  const checkCameraPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setCameraPermission(result.state);
      
      result.onchange = () => {
        setCameraPermission(result.state);
      };
    } catch (err) {
      console.warn('Could not check camera permissions');
    }
  };

  const getVideoDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setSupportedDevices(videoDevices);
      
      // Select back camera by default (usually contains 'back' or 'rear')
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      );
      
      if (backCamera) {
        setSelectedDevice(backCamera.deviceId);
      } else if (videoDevices.length > 0) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Could not get video devices', err);
      setError('Impossible d\'accéder aux caméras');
    }
  };

  const startScanning = async () => {
    if (!codeReader.current || !videoRef.current) return;
    
    setIsScanning(true);
    setError('');
    setSuccess('');
    
    try {
      const deviceId = selectedDevice || null;
      
      // Start decoding from video device
      await codeReader.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const scannedText = result.getText();
            setSuccess(`QR Code scanné: ${scannedText.substring(0, 50)}...`);
            onScan(scannedText);
            stopScanning();
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

  if (cameraPermission === 'denied') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CameraOff className="h-5 w-5" />
            <span>Caméra non disponible</span>
          </CardTitle>
          <CardDescription>
            L'accès à la caméra est nécessaire pour scanner les codes QR
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
          <QrCode className="h-5 w-5" />
          <span>Scanner QR Code</span>
        </CardTitle>
        <CardDescription>
          Pointez la caméra vers le code QR du colis
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

        {/* Camera selection */}
        {cameraPermission === 'granted' && supportedDevices.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Caméra:</label>
            <select 
              value={selectedDevice} 
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={isScanning}
            >
              {supportedDevices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Caméra ${device.deviceId.substring(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Video element */}
        {cameraPermission === 'granted' && (
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-64 bg-black rounded-lg object-cover"
              style={{ display: isScanning ? 'block' : 'none' }}
            />
            
            {!isScanning && (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Caméra arrêtée</p>
                </div>
              </div>
            )}
            
            {/* Scanning overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-red-500 w-48 h-48 rounded-lg opacity-50"></div>
              </div>
            )}
          </div>
        )}

        {/* Control buttons */}
        {cameraPermission === 'granted' && (
          <div className="flex space-x-2">
            {!isScanning ? (
              <Button 
                onClick={startScanning}
                disabled={disabled || !selectedDevice}
                className="flex-1"
              >
                <Camera className="mr-2 h-4 w-4" />
                Démarrer le scan
              </Button>
            ) : (
              <Button 
                onClick={stopScanning}
                variant="outline"
                className="flex-1"
              >
                <CameraOff className="mr-2 h-4 w-4" />
                Arrêter le scan
              </Button>
            )}
          </div>
        )}

        {/* Status messages */}
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
      </CardContent>
    </Card>
  );
}