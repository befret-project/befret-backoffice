'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Camera, Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { storage } from '@/lib/firebase-config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface PhotoUploadProps {
  /**
   * Chemin dans Firebase Storage (ex: 'parcels/BF-123/weighing')
   */
  storagePath: string;

  /**
   * Callback when upload completes successfully
   */
  onUploadComplete: (url: string) => void;

  /**
   * Callback for upload errors
   */
  onError?: (error: Error) => void;

  /**
   * Text label for the upload button
   */
  label?: string;

  /**
   * Whether to add watermark with timestamp and location
   */
  addWatermark?: boolean;

  /**
   * Maximum file size in MB
   */
  maxSizeMB?: number;

  /**
   * Image quality for compression (0-1)
   */
  compressionQuality?: number;

  /**
   * Required for button display
   */
  required?: boolean;

  /**
   * Accept file types
   */
  accept?: string;

  /**
   * Variant styling
   */
  variant?: 'default' | 'outline' | 'secondary';
}

interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  url?: string;
  previewUrl?: string;
}

export function PhotoUpload({
  storagePath,
  onUploadComplete,
  onError,
  label = 'Prendre une photo',
  addWatermark = true,
  maxSizeMB = 5,
  compressionQuality = 0.8,
  required = false,
  accept = 'image/*',
  variant = 'default'
}: PhotoUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Add watermark to image with timestamp and GPS coordinates
   */
  const addWatermarkToImage = async (imageFile: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Prepare watermark text
        const now = new Date();
        const timestamp = now.toLocaleString('fr-BE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        // Get GPS coordinates if available
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const gpsText = `GPS: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
              drawWatermark(ctx, canvas, timestamp, gpsText);
              canvas.toBlob(
                (blob) => {
                  if (blob) resolve(blob);
                  else reject(new Error('Failed to create blob'));
                },
                'image/jpeg',
                compressionQuality
              );
            },
            () => {
              // GPS not available, just add timestamp
              drawWatermark(ctx, canvas, timestamp);
              canvas.toBlob(
                (blob) => {
                  if (blob) resolve(blob);
                  else reject(new Error('Failed to create blob'));
                },
                'image/jpeg',
                compressionQuality
              );
            }
          );
        } else {
          drawWatermark(ctx, canvas, timestamp);
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to create blob'));
            },
            'image/jpeg',
            compressionQuality
          );
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(imageFile);
    });
  };

  /**
   * Draw watermark on canvas
   */
  const drawWatermark = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    timestamp: string,
    gpsText?: string
  ) => {
    const fontSize = Math.max(16, canvas.width / 50);
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.lineWidth = 3;

    const padding = fontSize;
    const lineHeight = fontSize * 1.3;

    // Draw timestamp
    ctx.strokeText(timestamp, padding, canvas.height - padding - (gpsText ? lineHeight : 0));
    ctx.fillText(timestamp, padding, canvas.height - padding - (gpsText ? lineHeight : 0));

    // Draw GPS if available
    if (gpsText) {
      ctx.strokeText(gpsText, padding, canvas.height - padding);
      ctx.fillText(gpsText, padding, canvas.height - padding);
    }

    // Add "BeFret" logo text
    ctx.font = `bold ${fontSize * 1.5}px Arial`;
    ctx.fillStyle = 'rgba(34, 197, 94, 0.8)'; // Green color
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    const logoText = 'BeFret Logistics';
    const logoX = canvas.width - ctx.measureText(logoText).width - padding;
    ctx.strokeText(logoText, logoX, canvas.height - padding);
    ctx.fillText(logoText, logoX, canvas.height - padding);
  };

  /**
   * Compress image file
   */
  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        let { width, height } = img;

        // Resize if image is too large (max 1920px)
        const maxDimension = 1920;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to compress image'));
          },
          'image/jpeg',
          compressionQuality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = URL.createObjectURL(file);
    });
  };

  /**
   * Handle file selection and upload
   */
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const error = new Error('Le fichier doit être une image');
      setUploadState({ status: 'error', progress: 0, error: error.message });
      onError?.(error);
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      const error = new Error(`L'image ne doit pas dépasser ${maxSizeMB}MB`);
      setUploadState({ status: 'error', progress: 0, error: error.message });
      onError?.(error);
      return;
    }

    try {
      setUploadState({ status: 'uploading', progress: 0 });

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setUploadState((prev) => ({ ...prev, previewUrl }));

      // Process image (compress + watermark)
      let processedBlob: Blob;

      if (addWatermark) {
        processedBlob = await addWatermarkToImage(file);
      } else {
        processedBlob = await compressImage(file);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const fullPath = `${storagePath}/${filename}`;

      // Upload to Firebase Storage
      const storageRef = ref(storage, fullPath);
      const uploadTask = uploadBytesResumable(storageRef, processedBlob, {
        contentType: 'image/jpeg',
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          compressed: 'true',
          watermarked: addWatermark ? 'true' : 'false'
        }
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadState((prev) => ({ ...prev, progress }));
        },
        (error) => {
          console.error('Upload error:', error);
          setUploadState({
            status: 'error',
            progress: 0,
            error: error.message
          });
          onError?.(error);
        },
        async () => {
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadState({
            status: 'success',
            progress: 100,
            url: downloadURL,
            previewUrl
          });
          onUploadComplete(downloadURL);
        }
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      console.error('Processing error:', err);
      setUploadState({
        status: 'error',
        progress: 0,
        error: err.message
      });
      onError?.(err);
    }
  };

  /**
   * Reset upload state
   */
  const handleReset = () => {
    setUploadState({ status: 'idle', progress: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Trigger file input click
   */
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        capture="environment" // Use rear camera on mobile
      />

      {/* Upload Button */}
      {uploadState.status === 'idle' && (
        <Button
          type="button"
          variant={variant}
          onClick={handleButtonClick}
          className="w-full"
        >
          <Camera className="h-5 w-5 mr-2" />
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Button>
      )}

      {/* Uploading State */}
      {uploadState.status === 'uploading' && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <span className="text-sm font-medium text-blue-900">
                  Téléchargement en cours...
                </span>
              </div>
              <span className="text-sm font-medium text-blue-700">
                {uploadState.progress.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
            {uploadState.previewUrl && (
              <img
                src={uploadState.previewUrl}
                alt="Preview"
                className="w-full h-40 object-cover rounded-lg"
              />
            )}
          </div>
        </Card>
      )}

      {/* Success State */}
      {uploadState.status === 'success' && uploadState.previewUrl && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  Photo téléchargée avec succès
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <img
              src={uploadState.previewUrl}
              alt="Uploaded"
              className="w-full h-40 object-cover rounded-lg"
            />
          </div>
        </Card>
      )}

      {/* Error State */}
      {uploadState.status === 'error' && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">
                    Erreur lors du téléchargement
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    {uploadState.error}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleButtonClick}
              className="w-full"
            >
              Réessayer
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
