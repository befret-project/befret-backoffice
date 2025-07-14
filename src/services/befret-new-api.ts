/**
 * 🔗 SERVICE API BEFRET_NEW
 * 
 * Service pour appeler exactement les mêmes APIs que befret_new
 * Utilise la configuration identique pour compatibility
 */

import { apiUrls, sendGridTemplates, appConfig } from '../../config/befret-new-config';
import { Parcel } from '@/types/parcel';

interface NotificationPayload {
  parcelID: string;
  phoneNumber: string;
  trackingCode: string;
  pType: string;
  sender: string;
  receiver?: string;
  city: string;
  cost?: number;
  weight?: number;
  pickupMethod?: string;
  
  // Nouveaux paramètres pour pesée
  actualWeight?: number;
  declaredWeight?: number;
  weighingPhotos?: string[];
  weighingStatus?: 'ok' | 'discrepancy' | 'supplement_required' | 'refund_available';
}

interface ApiResponse {
  success: boolean;
  hasWeighingData?: boolean;
  templateUsed?: string;
  weighingStatus?: string;
  error?: string;
}

export class BefretNewApiService {
  
  /**
   * Notification de réception standard (compatible befret_new)
   */
  static async sendReceiptNotification(parcel: Parcel): Promise<boolean> {
    try {
      console.log(`📱 [BefretNewApi] Sending receipt notification for ${parcel.trackingID}`);
      
      // Récupérer informations destinataire
      const receiverInfo = await this.getReceiverInfo(parcel);
      
      if (!receiverInfo.phone) {
        console.warn(`⚠️ [BefretNewApi] No phone number found for parcel ${parcel.trackingID}`);
        return false;
      }
      
      const payload: NotificationPayload = {
        parcelID: parcel.id!,
        phoneNumber: receiverInfo.phone!,
        trackingCode: parcel.trackingID || 'NO_TRACKING',
        pType: parcel.type,
        sender: parcel.sender_name,
        receiver: parcel.receiver_name,
        city: receiverInfo.city || 'kinshasa',
        cost: parcel.cost || 0,
        weight: parcel.totalWeight || parcel.weight,
        pickupMethod: parcel.pickupMethod
      };
      
      console.log(`📤 [BefretNewApi] Payload:`, payload);
      
      const response = await fetch(apiUrls.sendReceiptNotification, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result: ApiResponse = await response.json();
        console.log(`✅ [BefretNewApi] Receipt notification sent:`, result);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`❌ [BefretNewApi] Failed to send receipt notification:`, {
          status: response.status,
          error: errorText
        });
        return false;
      }
      
    } catch (error) {
      console.error('❌ [BefretNewApi] Error sending receipt notification:', error);
      return false;
    }
  }
  
  /**
   * Notification de pesée avec données étendues (nouvelle fonctionnalité)
   */
  static async sendWeighingNotification(
    parcel: Parcel,
    weighingData: {
      actualWeight: number;
      declaredWeight: number;
      weighingPhotos: string[];
      weighingStatus: 'ok' | 'discrepancy' | 'supplement_required' | 'refund_available';
    }
  ): Promise<boolean> {
    try {
      console.log(`⚖️ [BefretNewApi] Sending weighing notification for ${parcel.trackingID}`);
      console.log(`📊 [BefretNewApi] Weighing data:`, weighingData);
      
      // Récupérer informations destinataire
      const receiverInfo = await this.getReceiverInfo(parcel);
      
      if (!receiverInfo.phone) {
        console.warn(`⚠️ [BefretNewApi] No phone number found for parcel ${parcel.trackingID}`);
        return false;
      }
      
      // Payload étendu avec données de pesée
      const payload: NotificationPayload = {
        parcelID: parcel.id!,
        phoneNumber: receiverInfo.phone!,
        trackingCode: parcel.trackingID || 'NO_TRACKING',
        pType: parcel.type,
        sender: parcel.sender_name,
        receiver: parcel.receiver_name,
        city: receiverInfo.city || 'kinshasa',
        cost: parcel.cost || 0,
        weight: parcel.totalWeight || parcel.weight,
        pickupMethod: parcel.pickupMethod,
        
        // NOUVEAUX PARAMÈTRES DE PESÉE
        actualWeight: weighingData.actualWeight,
        declaredWeight: weighingData.declaredWeight,
        weighingPhotos: weighingData.weighingPhotos,
        weighingStatus: weighingData.weighingStatus
      };
      
      console.log(`📤 [BefretNewApi] Weighing payload:`, payload);
      
      const response = await fetch(apiUrls.sendReceiptNotification, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result: ApiResponse = await response.json();
        console.log(`✅ [BefretNewApi] Weighing notification sent:`, result);
        console.log(`📊 [BefretNewApi] Used weighing template: ${result.hasWeighingData}`);
        console.log(`📧 [BefretNewApi] Template used: ${result.templateUsed}`);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`❌ [BefretNewApi] Failed to send weighing notification:`, {
          status: response.status,
          error: errorText
        });
        return false;
      }
      
    } catch (error) {
      console.error('❌ [BefretNewApi] Error sending weighing notification:', error);
      return false;
    }
  }
  
  /**
   * Notification de surpoids (utilise API befret_new existante)
   */
  static async sendOverWeightNotification(
    parcel: Parcel,
    overWeight: number,
    overCost: number
  ): Promise<boolean> {
    try {
      console.log(`⚖️ [BefretNewApi] Sending overweight notification for ${parcel.trackingID}`);
      
      const receiverInfo = await this.getReceiverInfo(parcel);
      
      if (!receiverInfo.phone) {
        console.warn(`⚠️ [BefretNewApi] No phone number found for parcel ${parcel.trackingID}`);
        return false;
      }
      
      const payload = {
        overWeight,
        phoneNumber: receiverInfo.phone!,
        trackingCode: parcel.trackingID || 'NO_TRACKING',
        pType: parcel.type,
        parcelID: parcel.id!,
        overCost,
        sender: parcel.sender_name
      };
      
      const response = await fetch(apiUrls.sendOverWeightNotification, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ [BefretNewApi] Overweight notification sent:`, result);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`❌ [BefretNewApi] Failed to send overweight notification:`, {
          status: response.status,
          error: errorText
        });
        return false;
      }
      
    } catch (error) {
      console.error('❌ [BefretNewApi] Error sending overweight notification:', error);
      return false;
    }
  }
  
  /**
   * Création d'une facture Stripe (utilise API befret_new)
   */
  static async createInvoice(
    email: string,
    parcelId: string,
    amount: number,
    phoneNumber: string,
    sender: string,
    pType: string
  ): Promise<{ sessionId: string; trackingID: string } | null> {
    try {
      console.log(`💳 [BefretNewApi] Creating invoice for parcel ${parcelId}`);
      
      const payload = {
        email,
        parcel: parcelId,
        amount,
        phoneNumber,
        sender,
        pType
      };
      
      const response = await fetch(apiUrls.createInvoice, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ [BefretNewApi] Invoice created:`, result);
        return {
          sessionId: result.sessionId,
          trackingID: result.trackingID
        };
      } else {
        const errorText = await response.text();
        console.error(`❌ [BefretNewApi] Failed to create invoice:`, {
          status: response.status,
          error: errorText
        });
        return null;
      }
      
    } catch (error) {
      console.error('❌ [BefretNewApi] Error creating invoice:', error);
      return null;
    }
  }
  
  /**
   * Récupérer informations destinataire (helper privé)
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
      
      // TODO: Si nécessaire, chercher dans Firestore via UID
      // (même logique que dans befret_new)
      
      console.warn(`⚠️ [BefretNewApi] No receiver info found for parcel ${parcel.trackingID}`);
      return {};
      
    } catch (error) {
      console.error('❌ [BefretNewApi] Error getting receiver info:', error);
      return {};
    }
  }
  
  /**
   * Récupérer les templates SendGrid utilisés
   */
  static getTemplateIds() {
    return sendGridTemplates;
  }
  
  /**
   * Récupérer URLs des APIs
   */
  static getApiUrls() {
    return apiUrls;
  }
  
  /**
   * Récupérer configuration app
   */
  static getAppConfig() {
    return appConfig;
  }
}

export default BefretNewApiService;