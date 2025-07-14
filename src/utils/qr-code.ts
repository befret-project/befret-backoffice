import QRCode from 'qrcode';

export interface QRCodeData {
  trackingID: string;
  parcelId: string;
  timestamp: string;
  version: number;
}

export class QRCodeGenerator {
  private static readonly QR_VERSION = 1;
  private static readonly QR_PREFIX = 'BEFRET';

  /**
   * Générer un code QR pour un colis
   */
  static async generateQRCode(trackingID: string, parcelId: string): Promise<string> {
    const qrData: QRCodeData = {
      trackingID,
      parcelId,
      timestamp: new Date().toISOString(),
      version: this.QR_VERSION
    };

    const qrString = `${this.QR_PREFIX}:${JSON.stringify(qrData)}`;
    
    try {
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 200
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Erreur génération QR code:', error);
      throw new Error('Impossible de générer le code QR');
    }
  }

  /**
   * Générer un code QR simple (format texte)
   */
  static generateQRString(trackingID: string, parcelId: string): string {
    const qrData: QRCodeData = {
      trackingID,
      parcelId,
      timestamp: new Date().toISOString(),
      version: this.QR_VERSION
    };

    return `${this.QR_PREFIX}:${JSON.stringify(qrData)}`;
  }

  /**
   * Décoder un code QR scanné
   */
  static decodeQRCode(qrString: string): QRCodeData | null {
    try {
      if (!qrString.startsWith(this.QR_PREFIX + ':')) {
        return null;
      }

      const jsonPart = qrString.substring(this.QR_PREFIX.length + 1);
      const data = JSON.parse(jsonPart) as QRCodeData;

      // Validation des données
      if (!data.trackingID || !data.parcelId || !data.timestamp) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur décodage QR code:', error);
      return null;
    }
  }

  /**
   * Valider un code QR
   */
  static validateQRCode(qrString: string): boolean {
    const decoded = this.decodeQRCode(qrString);
    return decoded !== null;
  }

  /**
   * Extraire le tracking ID depuis un code QR
   */
  static extractTrackingID(qrString: string): string | null {
    const decoded = this.decodeQRCode(qrString);
    return decoded?.trackingID || null;
  }

  /**
   * Extraire l'ID du colis depuis un code QR
   */
  static extractParcelId(qrString: string): string | null {
    const decoded = this.decodeQRCode(qrString);
    return decoded?.parcelId || null;
  }
}