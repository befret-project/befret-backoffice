import { QRCodeData } from '@/utils/qr-code';

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5001/befret-development/us-central1/api' 
  : 'https://api-rcai6nfrla-uc.a.run.app/api';

export interface QRValidationResult {
  valid: boolean;
  parcel?: any;
  error?: string;
  success: boolean;
}

export interface QRGenerationResult {
  success: boolean;
  message?: string;
  results?: Array<{
    parcelId: string;
    trackingID: string;
    qrCode: string;
    qrCodeImage: string;
    success: boolean;
  }>;
  error?: string;
}

export interface ArrivalScanData {
  operator: string;
  location: string;
  scannerId?: string;
  photo?: string;
}

export interface ArrivalScanResult {
  success: boolean;
  message?: string;
  scanData?: any;
  error?: string;
}

export class QRCodeService {
  /**
   * Générer des codes QR pour des colis spécifiques
   */
  static async generateQRCodes(parcelIds: string[]): Promise<QRGenerationResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/logistic/qr-codes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parcelIds }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error generating QR codes:', error);
      return {
        success: false,
        error: 'Erreur lors de la génération des codes QR'
      };
    }
  }

  /**
   * Générer des codes QR pour tous les colis sans QR code
   */
  static async generateAllQRCodes(): Promise<QRGenerationResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/logistic/qr-codes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ generateAll: true }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error generating all QR codes:', error);
      return {
        success: false,
        error: 'Erreur lors de la génération des codes QR'
      };
    }
  }

  /**
   * Valider un code QR scanné
   */
  static async validateQRCode(qrCode: string): Promise<QRValidationResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/logistic/qr-codes/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCode }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error validating QR code:', error);
      return {
        valid: false,
        success: false,
        error: 'Erreur lors de la validation du code QR'
      };
    }
  }

  /**
   * Enregistrer un scan d'arrivée
   */
  static async recordArrivalScan(
    parcelId: string, 
    scanData: ArrivalScanData
  ): Promise<ArrivalScanResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/logistic/parcels/${parcelId}/arrival-scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scanData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error recording arrival scan:', error);
      return {
        success: false,
        error: 'Erreur lors de l\'enregistrement du scan d\'arrivée'
      };
    }
  }

  /**
   * Décoder un code QR localement (sans appel API)
   */
  static decodeQRCode(qrCode: string): QRCodeData | null {
    try {
      if (!qrCode.startsWith('BEFRET:')) {
        return null;
      }

      const jsonPart = qrCode.substring(7); // Remove 'BEFRET:' prefix
      const data = JSON.parse(jsonPart) as QRCodeData;

      // Validation des données
      if (!data.trackingID || !data.parcelId || !data.timestamp) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error decoding QR code:', error);
      return null;
    }
  }

  /**
   * Extraire le tracking ID depuis un code QR
   */
  static extractTrackingID(qrCode: string): string | null {
    const decoded = this.decodeQRCode(qrCode);
    return decoded?.trackingID || null;
  }

  /**
   * Extraire l'ID du colis depuis un code QR
   */
  static extractParcelId(qrCode: string): string | null {
    const decoded = this.decodeQRCode(qrCode);
    return decoded?.parcelId || null;
  }

  /**
   * Vérifier si un code QR est valide (format local)
   */
  static isValidQRFormat(qrCode: string): boolean {
    return this.decodeQRCode(qrCode) !== null;
  }
}