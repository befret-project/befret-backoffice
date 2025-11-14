'use client';

import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function BarcodeScannerV2({ onScan, onClose, isOpen }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scannedCode, setScannedCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [camerasInfo, setCamerasInfo] = useState<string>('');
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Détection du type d'appareil
  useEffect(() => {
    const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(checkMobile);
    console.log('📱 Appareil détecté:', checkMobile ? 'Mobile/Tablette' : 'Desktop/Laptop');
  }, []);

  // Initialiser la caméra quand la modal s'ouvre
  useEffect(() => {
    if (isOpen && !scanning) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      console.log('📹 Démarrage de la caméra...');

      // Configuration adaptative selon l'appareil
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: isMobile
          ? {
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            }
          : {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
      };

      console.log('🎥 Contraintes:', constraints);

      // Obtenir le stream vidéo
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      console.log('✅ Stream obtenu!', stream);

      // Attacher au element vidéo
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log('▶️ Vidéo en lecture');

        // Initialiser le lecteur de codes-barres
        if (!readerRef.current) {
          readerRef.current = new BrowserMultiFormatReader();
        }

        setScanning(true);
        setError('');

        console.log('🔄 Lancement du scan continu...');

        // Attendre que la vidéo soit vraiment prête
        setTimeout(() => {
          scanContinuously();
        }, 500);
      }
    } catch (err) {
      console.error('❌ Erreur caméra:', err);
      handleCameraError(err);
    }
  };

  const scanContinuously = () => {
    if (!videoRef.current || !readerRef.current) {
      console.log('⚠️ Refs non disponibles pour scan');
      return;
    }

    const reader = readerRef.current;
    const video = videoRef.current;
    let scanActive = true;

    console.log('🔍 Début du scan loop');

    const scan = async () => {
      try {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          console.log('📸 Tentative de détection...');
          const result = await reader.decodeFromVideoElement(video);

          if (result) {
            const code = result.getText();
            console.log('✅ Code détecté:', code);
            scanActive = false;
            handleScanSuccess(code);
            return;
          }
        } else {
          console.log('⏳ Vidéo pas encore prête, readyState:', video.readyState);
        }
      } catch (err) {
        // NotFoundException est normal (pas de code détecté dans cette frame)
        if (!(err instanceof NotFoundException)) {
          console.error('❌ Erreur scan:', err);
        }
      }

      // Continuer le scan si toujours actif
      if (scanActive && isOpen) {
        setTimeout(() => requestAnimationFrame(scan), 100);
      }
    };

    // Démarrer le scan loop
    requestAnimationFrame(scan);
  };

  const handleScanSuccess = (code: string) => {
    setScannedCode(code);
    setScanning(false);
    stopCamera();

    // Vibration mobile
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(200);
    }

    // Auto-submit après 1 seconde
    setTimeout(() => {
      onScan(code);
      onClose();
    }, 1000);
  };

  const stopCamera = () => {
    console.log('⏹️ Arrêt de la caméra');

    setScanning(false);

    // Arrêter le stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Track arrêté:', track.label);
      });
      streamRef.current = null;
    }

    // Nettoyer la vidéo
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCameraError = (err: unknown) => {
    const error = err as DOMException;
    console.error('Détails erreur:', error.name, error.message);

    let errorMessage = 'Erreur d\'accès à la caméra.';

    if (error.name === 'NotAllowedError') {
      errorMessage = 'Permission refusée. Autorisez l\'accès à la caméra dans votre navigateur.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'Aucune caméra détectée. Vérifiez qu\'une caméra est connectée.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Caméra déjà utilisée par une autre application. Fermez les autres onglets/apps utilisant la caméra.';
    } else if (error.name === 'OverconstrainedError') {
      errorMessage = 'Configuration caméra non supportée. Essayez avec une autre caméra.';
    }

    setError(errorMessage);
  };

  const handleRetry = () => {
    setScannedCode('');
    setError('');
    setCamerasInfo('');
    startCamera();
  };

  const handleManualSubmit = () => {
    if (scannedCode) {
      onScan(scannedCode);
      onClose();
    }
  };

  const checkCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      if (videoDevices.length === 0) {
        setCamerasInfo('❌ Aucune caméra détectée sur cet appareil.');
      } else {
        const info = `✅ ${videoDevices.length} caméra(s) détectée(s):\n` +
          videoDevices.map((device, i) => `${i + 1}. ${device.label || 'Caméra sans nom'}`).join('\n');
        setCamerasInfo(info);
      }

      console.log('📷 Caméras disponibles:', videoDevices);
    } catch (err) {
      setCamerasInfo('❌ Impossible de lister les caméras. Erreur: ' + (err as Error).message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Camera className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold">
                Scanner Code-Barres / QR Code
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800 font-medium mb-1">
              📸 {isMobile ? 'Caméra arrière activée' : 'Webcam activée'}
            </p>
            <p className="text-xs text-blue-700">
              Positionnez le code-barres ou QR code DPD devant la caméra.
              {!isMobile && ' Assurez-vous que votre webcam fonctionne et que les permissions sont accordées.'}
            </p>
          </div>

          {/* Erreur d'accès caméra */}
          {error && (
            <>
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>

              {/* Bouton diagnostic caméras */}
              <div className="mb-4">
                <Button
                  onClick={checkCameras}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  🔍 Diagnostiquer les caméras disponibles
                </Button>

                {camerasInfo && (
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-sm whitespace-pre-line">
                    {camerasInfo}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Vidéo de scan */}
          {!scannedCode && !error && (
            <div className="relative bg-black rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                className="w-full h-[400px] object-cover"
                style={{ transform: 'scaleX(-1)' }}
                playsInline
                muted
              />

              {/* Overlay de visée */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-4 border-green-500 rounded-lg relative">
                  {/* Coins animés */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>

                  {/* Ligne de scan animée */}
                  <div className="absolute inset-x-0 h-1 bg-green-500 animate-pulse" style={{ top: '50%' }}></div>
                </div>
              </div>

              {/* Statut de scan */}
              {scanning && (
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <div className="inline-block bg-black/70 text-white px-4 py-2 rounded-full">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Scan en cours...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Résultat du scan */}
          {scannedCode && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 mb-2">
                    ✅ Code scanné avec succès !
                  </h4>
                  <div className="bg-white border border-green-300 rounded p-3 mb-3">
                    <p className="text-xs text-gray-600 mb-1">Code détecté:</p>
                    <p className="font-mono text-lg font-bold text-green-900 break-all">
                      {scannedCode}
                    </p>
                  </div>
                  <p className="text-sm text-green-700">
                    Recherche automatique dans 1 seconde...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            {scannedCode ? (
              <>
                <Button
                  onClick={handleManualSubmit}
                  className="flex-1"
                  size="lg"
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Rechercher maintenant
                </Button>
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="lg"
                >
                  Scanner à nouveau
                </Button>
              </>
            ) : error ? (
              <Button
                onClick={handleRetry}
                className="flex-1"
                size="lg"
              >
                Réessayer
              </Button>
            ) : (
              <Button
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Annuler
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
