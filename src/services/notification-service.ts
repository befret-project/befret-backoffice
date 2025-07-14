/**
 * 📬 SERVICE DE NOTIFICATIONS DIRECT
 * 
 * Service pour envoyer des notifications via SendGrid et Twilio
 * Utilise les mêmes configurations que befret_new mais via les propres Firebase Functions
 */

import { Parcel } from '@/types/parcel';

interface NotificationConfig {
  sendgridApiKey: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  templates: {
    receiptNotification: string;
    weighingConfirmation: string;
    supplementRequired: string;
    refundAvailable: string;
    overweightNotification: string;
  };
}

interface WeighingData {
  actualWeight: number;
  declaredWeight: number;
  weighingPhotos: string[];
  weighingStatus: 'ok' | 'discrepancy' | 'supplement_required' | 'refund_available';
}

export class NotificationService {
  private static config: NotificationConfig = {
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    templates: {
      receiptNotification: process.env.TEMPLATE_RECEIPT_NOTIFICATION || 'd-4e5b37170b714d20b33f717c099521ff',
      weighingConfirmation: process.env.TEMPLATE_WEIGHING_CONFIRMATION || 'd-4e5b37170b714d20b33f717c099521ff',
      supplementRequired: process.env.TEMPLATE_SUPPLEMENT_REQUIRED || 'd-056cd451f9364440af7b18fa93befd68',
      refundAvailable: process.env.TEMPLATE_REFUND_AVAILABLE || 'd-4e5b37170b714d20b33f717c099521ff',
      overweightNotification: process.env.TEMPLATE_OVERWEIGHT_NOTIFICATION || 'd-056cd451f9364440af7b18fa93befd68'
    }
  };

  /**
   * Envoyer notification de réception standard
   */
  static async sendReceiptNotification(parcel: Parcel): Promise<boolean> {
    try {
      console.log(`📱 [NotificationService] Sending receipt notification for ${parcel.trackingID}`);
      
      // Appeler notre propre Firebase Function (à créer)
      const functionUrl = `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/sendReceiptNotification`;
      
      const receiverInfo = await this.getReceiverInfo(parcel);
      
      if (!receiverInfo.phone) {
        console.warn(`⚠️ [NotificationService] No phone number found for parcel ${parcel.trackingID}`);
        return false;
      }
      
      const payload = {
        parcelID: parcel.id,
        phoneNumber: receiverInfo.phone!,
        trackingCode: parcel.trackingID || 'NO_TRACKING',
        pType: parcel.type,
        sender: parcel.sender_name,
        receiver: parcel.receiver_name,
        city: receiverInfo.city || 'kinshasa',
        cost: parcel.cost || 0,
        weight: parcel.totalWeight || 0,
        pickupMethod: parcel.pickupMethod,
        templateId: this.config.templates.receiptNotification
      };
      
      console.log(`📤 [NotificationService] Payload:`, payload);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ [NotificationService] Receipt notification sent:`, result);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`❌ [NotificationService] Failed to send receipt notification:`, {
          status: response.status,
          error: errorText
        });
        return false;
      }
      
    } catch (error) {
      console.error('❌ [NotificationService] Error sending receipt notification:', error);
      return false;
    }
  }

  /**
   * Envoyer notification de pesée avec template adapté
   */
  static async sendWeighingNotification(
    parcel: Parcel,
    weighingData: WeighingData
  ): Promise<boolean> {
    try {
      console.log(`⚖️ [NotificationService] Sending weighing notification for ${parcel.trackingID}`);
      console.log(`📊 [NotificationService] Weighing data:`, weighingData);
      
      const functionUrl = `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/sendWeighingNotification`;
      
      const receiverInfo = await this.getReceiverInfo(parcel);
      
      if (!receiverInfo.phone) {
        console.warn(`⚠️ [NotificationService] No phone number found for parcel ${parcel.trackingID}`);
        return false;
      }

      // Sélectionner le template en fonction du statut de pesée
      let templateId = this.config.templates.weighingConfirmation;
      switch (weighingData.weighingStatus) {
        case 'supplement_required':
          templateId = this.config.templates.supplementRequired;
          break;
        case 'refund_available':
          templateId = this.config.templates.refundAvailable;
          break;
        case 'discrepancy':
          templateId = this.config.templates.overweightNotification;
          break;
        default:
          templateId = this.config.templates.weighingConfirmation;
      }
      
      const payload = {
        parcelID: parcel.id,
        phoneNumber: receiverInfo.phone!,
        trackingCode: parcel.trackingID || 'NO_TRACKING',
        pType: parcel.type,
        sender: parcel.sender_name,
        receiver: parcel.receiver_name,
        city: receiverInfo.city || 'kinshasa',
        cost: parcel.cost || 0,
        weight: parcel.totalWeight || 0,
        pickupMethod: parcel.pickupMethod,
        
        // Données de pesée
        actualWeight: weighingData.actualWeight,
        declaredWeight: weighingData.declaredWeight,
        weighingPhotos: weighingData.weighingPhotos,
        weighingStatus: weighingData.weighingStatus,
        templateId: templateId
      };
      
      console.log(`📤 [NotificationService] Weighing payload:`, payload);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ [NotificationService] Weighing notification sent:`, result);
        console.log(`📧 [NotificationService] Template used: ${templateId}`);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`❌ [NotificationService] Failed to send weighing notification:`, {
          status: response.status,
          error: errorText
        });
        return false;
      }
      
    } catch (error) {
      console.error('❌ [NotificationService] Error sending weighing notification:', error);
      return false;
    }
  }

  /**
   * Envoyer notification de surpoids
   */
  static async sendOverWeightNotification(
    parcel: Parcel,
    overWeight: number,
    overCost: number
  ): Promise<boolean> {
    try {
      console.log(`⚖️ [NotificationService] Sending overweight notification for ${parcel.trackingID}`);
      
      const functionUrl = `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/sendOverWeightNotification`;
      
      const receiverInfo = await this.getReceiverInfo(parcel);
      
      if (!receiverInfo.phone) {
        console.warn(`⚠️ [NotificationService] No phone number found for parcel ${parcel.trackingID}`);
        return false;
      }
      
      const payload = {
        overWeight,
        phoneNumber: receiverInfo.phone!,
        trackingCode: parcel.trackingID || 'NO_TRACKING',
        pType: parcel.type,
        parcelID: parcel.id,
        overCost,
        sender: parcel.sender_name,
        templateId: this.config.templates.overweightNotification
      };
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ [NotificationService] Overweight notification sent:`, result);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`❌ [NotificationService] Failed to send overweight notification:`, {
          status: response.status,
          error: errorText
        });
        return false;
      }
      
    } catch (error) {
      console.error('❌ [NotificationService] Error sending overweight notification:', error);
      return false;
    }
  }

  /**
   * Récupérer informations destinataire
   */
  private static async getReceiverInfo(parcel: Parcel): Promise<{phone?: string, city?: string}> {
    try {
      // Essayer d'abord les données de base
      if (parcel.receiver_phone) {
        return {
          phone: parcel.receiver_phone,
          city: parcel.city
        };
      }
      
      console.warn(`⚠️ [NotificationService] No receiver info found for parcel ${parcel.trackingID}`);
      return {};
      
    } catch (error) {
      console.error('❌ [NotificationService] Error getting receiver info:', error);
      return {};
    }
  }

  /**
   * Récupérer configuration des templates
   */
  static getTemplateConfig() {
    return this.config.templates;
  }

  /**
   * Valider la configuration
   */
  static validateConfig(): boolean {
    const required = [
      'sendgridApiKey',
      'twilioAccountSid', 
      'twilioAuthToken',
      'twilioPhoneNumber'
    ];
    
    for (const key of required) {
      if (!this.config[key as keyof Omit<NotificationConfig, 'templates'>]) {
        console.error(`❌ [NotificationService] Missing configuration: ${key}`);
        return false;
      }
    }
    
    console.log(`✅ [NotificationService] Configuration validated`);
    return true;
  }
}

export default NotificationService;