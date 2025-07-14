// Service Firebase pour interagir avec l'infrastructure befret_new existante

import { collection, doc, getDoc, updateDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { db } from '@/lib/firebase-config';
import { getMainStatusFromLogistics, receptionVisibleStatuses, isStatusTransitionAllowed } from '@/utils/status-mappings';
import { 
  Parcel, 
  ParcelSearchResult, 
  LogisticStep, 
  LogisticsStatusEnum, 
  DestinationEnum, 
  SpecialCaseTypeEnum 
} from '@/types/parcel';

// Use Firebase instances from the main config to avoid duplicate initialization
const storage = getStorage();

export { db, storage };

// Type guard pour vérifier les valeurs Firebase valides
export const isValidFirestoreValue = (value: any): boolean => {
  return value !== undefined && value !== null;
};

// Helper pour nettoyer un objet des valeurs undefined/null
export const cleanFirestoreData = (data: Record<string, any>): Record<string, any> => {
  const cleaned: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (isValidFirestoreValue(value)) {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

// Service pour les colis
export class ParcelService {
  
  /**
   * Rechercher un colis par trackingID dans la collection existante 'parcel'
   */
  static async searchByTrackingId(trackingId: string): Promise<ParcelSearchResult> {
    try {
      console.log('Searching for parcel with trackingID:', trackingId);
      
      // Recherche dans la collection 'parcel' de befret_new
      const parcelsRef = collection(db, 'parcel');
      const q = query(
        parcelsRef, 
        where('trackingID', '==', trackingId.toUpperCase())
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('No parcel found with trackingID:', trackingId);
        return { found: false, error: 'Colis non trouvé' };
      }
      
      const parcelDoc = querySnapshot.docs[0];
      const parcelData = parcelDoc.data();
      
      // Convertir les données Firestore vers notre interface Parcel
      const parcel: Parcel = {
        id: parcelDoc.id,
        trackingID: parcelData.trackingID,
        sender_name: parcelData.sender_name || 'Expéditeur inconnu',
        sender_phone: parcelData.sender_phone || '',
        receiver_name: parcelData.receiver_name || 'Destinataire inconnu',
        receiver_phone: parcelData.receiver_phone || '',
        phonePrefix1: parcelData.phonePrefix1 || '',
        phonePrefix2: parcelData.phonePrefix2 || '',
        uid: parcelData.uid,
        mail2User: parcelData.mail2User,
        city: parcelData.city || '',
        address: parcelData.address || '',
        type: parcelData.type || 'paquet',
        description: parcelData.description || '',
        weight: parcelData.weight || 0,
        totalWeight: parcelData.totalWeight || 0,
        items: parcelData.items || [],
        fragile: parcelData.fragile || false,
        emballage: parcelData.emballage || false,
        condition: parcelData.condition || false,
        cost: parcelData.cost || 0,
        status: parcelData.status,
        pickupMethod: parcelData.pickupMethod || 'warehouse',
        create_date: parcelData.create_date,
        payment_date: parcelData.payment_date,
        notified: parcelData.notified || false,
        
        // Nouveaux champs logistiques requis
        uniqueCode: parcelData.uniqueCode,
        weightDeclared: parcelData.weightDeclared || parcelData.weight || parcelData.totalWeight,
        weightReal: parcelData.weightReal,
        actualWeight: parcelData.actualWeight || parcelData.weightReal,
        weightPhotos: parcelData.weightPhotos || [],
        receptionTimestamp: parcelData.receptionTimestamp,
        agentId: parcelData.agentId,
        specialCaseType: parcelData.specialCaseType || '',
        specialCaseReason: parcelData.specialCaseReason,
        destination: parcelData.destination,
        logisticsStatus: parcelData.logisticsStatus,
        
        // Champs étendus logistique (compatibilité)
        logisticStatus: parcelData.logisticStatus || parcelData.logisticsStatus || 'pending_reception',
        
        // Timestamps
        receivedAt: parcelData.receivedAt,
        weighedAt: parcelData.weighedAt,
        
        // Location (GeoPoint to object)
        location: parcelData.location ? {
          _latitude: parcelData.location.latitude,
          _longitude: parcelData.location.longitude
        } : undefined
      };
      
      console.log('Parcel found:', parcel);
      return { found: true, parcel };
      
    } catch (error) {
      console.error('Error searching parcel:', error);
      return { found: false, error: 'Erreur lors de la recherche' };
    }
  }
  
  /**
   * Marquer un colis comme reçu à l'entrepôt
   * Flow : pending_reception -> received
   */
  static async markAsReceived(parcelId: string, agent: string): Promise<boolean> {
    try {
      console.log(`🔄 [ParcelService] Marking parcel ${parcelId} as received by ${agent}`);
      
      const parcelRef = doc(db, 'parcel', parcelId);
      const timestamp = new Date().toISOString();
      
      // D'abord récupérer le document existant pour préserver l'historique
      const parcelDoc = await getDoc(parcelRef);
      if (!parcelDoc.exists()) {
        console.error('❌ [ParcelService] Parcel not found:', parcelId);
        return false;
      }
      
      const currentData = parcelDoc.data();
      const currentLogisticStatus = currentData.logisticStatus || 'pending_reception';
      const existingHistory = currentData.logisticHistory || [];
      
      // Vérifier que la transition est autorisée
      if (!isStatusTransitionAllowed(currentLogisticStatus, 'received')) {
        console.error(`❌ [ParcelService] Invalid transition from ${currentLogisticStatus} to received`);
        return false;
      }
      
      console.log(`🔄 [ParcelService] Transitioning from ${currentLogisticStatus} to received`);
      
      // Créer l'étape logistique
      const logisticStep: LogisticStep = {
        step: 'received',
        timestamp,
        agent,
        notes: 'Colis reçu à l\'entrepôt Tubize et scanné dans le backoffice'
      };
      
      // Mettre à jour le document avec l'historique préservé
      const updates = {
        logisticStatus: 'received',
        receivedAt: timestamp,
        logisticHistory: [...existingHistory, logisticStep],
        // Mettre à jour le statut principal basé sur le mapping unifié
        status: getMainStatusFromLogistics('received')
      };
      
      await updateDoc(parcelRef, updates);
      
      console.log(`✅ [ParcelService] Parcel ${parcelId} successfully marked as received`);
      console.log(`📝 [ParcelService] Logistic history now has ${existingHistory.length + 1} entries`);
      console.log(`📊 [ParcelService] Main status updated to: ${updates.status}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ [ParcelService] Error marking parcel as received:', error);
      return false;
    }
  }
  
  /**
   * Rechercher les colis récemment reçus
   */
  static async getRecentReceptions(limitCount: number = 10): Promise<Parcel[]> {
    try {
      console.log(`📦 [ParcelService] Fetching ${limitCount} recent receptions...`);
      console.log(`📦 [ParcelService] Filtering by reception status only...`);
      
      const parcelsRef = collection(db, 'parcel');
      
      // Récupérer seulement les colis en attente de réception ou récemment reçus
      const q = query(
        parcelsRef,
        where('logisticStatus', 'in', receptionVisibleStatuses),
        orderBy('create_date', 'desc'),
        limit(limitCount * 2) // Augmenter la limite car on filtre
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`📦 [ParcelService] Found ${querySnapshot.size} recent parcels`);
      
      if (querySnapshot.empty) {
        console.log('⚠️ [ParcelService] No parcels found in collection');
        return [];
      }
      
      const parcels: Parcel[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        parcels.push({
          id: doc.id,
          trackingID: data.trackingID || 'NO_TRACKING_ID',
          sender_name: data.sender_name || 'Unknown sender',
          sender_phone: data.sender_phone || '',
          receiver_name: data.receiver_name || 'Unknown receiver',
          receiver_phone: data.receiver_phone || '',
          phonePrefix1: data.phonePrefix1 || '',
          phonePrefix2: data.phonePrefix2 || '',
          uid: data.uid || '',
          mail2User: data.mail2User || '',
          city: data.city || '',
          address: data.address || '',
          type: data.type || 'paquet',
          description: data.description || '',
          weight: data.weight || 0,
          totalWeight: data.totalWeight || 0,
          items: data.items || [],
          fragile: data.fragile || false,
          emballage: data.emballage || false,
          condition: data.condition || false,
          cost: data.cost || 0,
          status: data.status || 'pending',
          pickupMethod: data.pickupMethod || 'warehouse',
          create_date: data.create_date || '',
          payment_date: data.payment_date,
          notified: data.notified || false,
          logisticStatus: data.logisticStatus || 'pending_reception',
          receivedAt: data.receivedAt,
          weighedAt: data.weighedAt
        });
      });
      
      console.log(`✅ [ParcelService] Returning ${parcels.length} processed parcels`);
      return parcels;
      
    } catch (error) {
      console.error('❌ [ParcelService] Error getting recent receptions:', error);
      return [];
    }
  }
  
  /**
   * Récupérer tous les colis pour la gestion des QR codes
   */
  static async getAllParcels(): Promise<Parcel[]> {
    try {
      console.log('📦 [ParcelService] Fetching all parcels for QR management...');
      
      const parcelsRef = collection(db, 'parcel');
      const q = query(parcelsRef, orderBy('create_date', 'desc'));
      
      const querySnapshot = await getDocs(q);
      console.log(`📦 [ParcelService] Found ${querySnapshot.size} total parcels`);
      
      if (querySnapshot.empty) {
        console.log('⚠️ [ParcelService] No parcels found in collection');
        return [];
      }
      
      const parcels: Parcel[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        parcels.push({
          id: doc.id,
          trackingID: data.trackingID || 'NO_TRACKING_ID',
          sender_name: data.sender_name || 'Unknown sender',
          sender_phone: data.sender_phone || '',
          receiver_name: data.receiver_name || 'Unknown receiver',
          receiver_phone: data.receiver_phone || '',
          phonePrefix1: data.phonePrefix1 || '',
          phonePrefix2: data.phonePrefix2 || '',
          uid: data.uid || '',
          mail2User: data.mail2User || '',
          city: data.city || '',
          address: data.address || '',
          type: data.type || 'paquet',
          description: data.description || '',
          totalWeight: data.totalWeight || data.weight || 0,
          weight: data.weight || data.totalWeight || 0,
          fragile: data.fragile || false,
          emballage: data.emballage || false,
          cost: data.cost || 0,
          status: data.status || 'pending',
          create_date: data.create_date || '',
          payment_date: data.payment_date,
          notified: data.notified || false,
          pickupMethod: data.pickupMethod || 'warehouse',
          logisticStatus: data.logisticStatus || 'pending_reception',
          receivedAt: data.receivedAt,
          weighedAt: data.weighedAt,
          
          // QR Code fields
          qrCode: data.qrCode,
          qrCodeImage: data.qrCodeImage,
          qrGenerated: data.qrGenerated,
          arrivalScan: data.arrivalScan,
          
          // Processing history
          processingHistory: data.processingHistory || [],
          
          // Condition required for interface
          condition: data.condition || true,
          
          // Items array
          items: data.items || []
        });
      });
      
      console.log(`✅ [ParcelService] Returning ${parcels.length} processed parcels`);
      return parcels;
      
    } catch (error) {
      console.error('❌ [ParcelService] Error getting all parcels:', error);
      return [];
    }
  }

  /**
   * Récupérer un colis par son ID
   */
  static async getParcelById(parcelId: string): Promise<Parcel | null> {
    try {
      console.log(`🔍 [DEBUG] [ParcelService] Getting parcel by ID: ${parcelId}`);
      
      const parcelRef = doc(db, 'parcel', parcelId);
      const parcelDoc = await getDoc(parcelRef);
      
      if (!parcelDoc.exists()) {
        console.log(`❌ [DEBUG] [ParcelService] Parcel ${parcelId} not found`);
        return null;
      }
      
      const data = parcelDoc.data();
      console.log(`✅ [DEBUG] [ParcelService] Parcel ${parcelId} found:`, data);
      
      // Convertir vers notre interface Parcel
      const parcel: Parcel = {
        id: parcelDoc.id,
        trackingID: data.trackingID || '',
        uid: data.uid || '',
        status: data.status || 'pending',
        weight: data.weight || 0,
        weightDeclared: data.weightDeclared || data.weight || 0,
        weightReal: data.weightReal,
        weightPhotos: data.weightPhotos || [],
        weightVerification: data.weightVerification,
        logisticsStatus: data.logisticsStatus || data.logisticStatus,
        logisticStatus: data.logisticStatus || data.logisticsStatus, // Compatibility
        destination: data.destination || data.city,
        city: data.city || '',
        address: data.address || '',
        type: data.type || 'Paquet',
        description: data.description || '',
        cost: data.cost || 0,
        sender_name: data.sender_name || '',
        sender_phone: data.sender_phone || '',
        receiver_name: data.receiver_name || '',
        receiver_phone: data.receiver_phone || '',
        phonePrefix1: data.phonePrefix1 || '',
        phonePrefix2: data.phonePrefix2 || '',
        mail2User: data.mail2User || '',
        pickupMethod: data.pickupMethod || 'warehouse',
        create_date: data.create_date || '',
        notified: data.notified || false,
        lastUpdated: data.lastUpdated || '',
        lastUpdatedBy: data.lastUpdatedBy || '',
        weighedAt: data.weighedAt,
        receivedAt: data.receivedAt,
        receptionTimestamp: data.receptionTimestamp,
        agentId: data.agentId || '',
        specialCaseType: data.specialCaseType,
        specialCaseReason: data.specialCaseReason,
        sortingZone: data.sortingZone,
        sortedAt: data.sortedAt,
        qrCode: data.qrCode,
        qrCodeImage: data.qrCodeImage,
        qrGenerated: data.qrGenerated,
        arrivalScan: data.arrivalScan,
        processingHistory: data.processingHistory || [],
        condition: data.condition || true,
        items: data.items || []
      };
      
      return parcel;
      
    } catch (error) {
      console.error(`❌ [DEBUG] [ParcelService] Error getting parcel ${parcelId}:`, error);
      return null;
    }
  }

  /**
   * Mettre à jour les champs logistiques d'un colis
   */
  static async updateLogisticFields(
    parcelId: string,
    updates: {
      uniqueCode?: string;
      weightReal?: number;
      weightDeclared?: number;
      weightPhotos?: any[];
      weightVerification?: any;
      agentId?: string;
      specialCaseType?: SpecialCaseTypeEnum;
      specialCaseReason?: string;
      destination?: DestinationEnum;
      logisticsStatus?: LogisticsStatusEnum;
      receptionTimestamp?: string;
      weighedAt?: string;
      lastUpdatedBy?: string;
    },
    operatorId?: string
  ): Promise<boolean> {
    try {
      console.log(`🔄 [DEBUG] [ParcelService] updateLogisticFields called for parcel ${parcelId}`);
      console.log('📋 [DEBUG] [ParcelService] Updates to apply:', JSON.stringify(updates, null, 2));
      console.log('👤 [DEBUG] [ParcelService] Operator ID:', operatorId);
      
      const parcelRef = doc(db, 'parcel', parcelId);
      const timestamp = new Date().toISOString();
      
      // Vérifier d'abord si le document existe
      console.log('🔍 [DEBUG] [ParcelService] Checking if parcel exists...');
      const currentDoc = await getDoc(parcelRef);
      if (!currentDoc.exists()) {
        console.error(`❌ [DEBUG] [ParcelService] Parcel ${parcelId} not found in database`);
        return false;
      }
      
      console.log('✅ [DEBUG] [ParcelService] Parcel exists, current data:', currentDoc.data());
      
      // Préparer les mises à jour en filtrant les valeurs undefined et null
      const updateData: Record<string, any> = {
        lastUpdated: timestamp
      };
      
      // Ajouter operatorId si fourni
      if (operatorId) {
        updateData.lastUpdatedBy = operatorId;
      }
      
      // Ajouter seulement les champs définis et valides
      Object.entries(updates).forEach(([key, value]) => {
        console.log(`🔍 [DEBUG] [ParcelService] Processing field ${key}:`, value);
        
        if (value !== undefined && value !== null) {
          // Validation spéciale pour les champs numériques
          if (key === 'weightReal' || key === 'weightDeclared') {
            const numValue = typeof value === 'string' ? parseFloat(value) : value;
            if (!isNaN(numValue) && numValue > 0) {
              updateData[key] = numValue;
              console.log(`✅ [DEBUG] [ParcelService] Added numeric field ${key}:`, numValue);
            } else {
              console.warn(`⚠️ [DEBUG] [ParcelService] Invalid numeric value for ${key}:`, value);
            }
          }
          // Validation spéciale pour les arrays
          else if (key === 'weightPhotos' && Array.isArray(value)) {
            updateData[key] = value;
            console.log(`✅ [DEBUG] [ParcelService] Added array field ${key}, length:`, value.length);
          }
          // Validation spéciale pour les objets
          else if (key === 'weightVerification' && typeof value === 'object') {
            updateData[key] = value;
            console.log(`✅ [DEBUG] [ParcelService] Added object field ${key}:`, value);
          }
          // Autres champs string/primitifs
          else if (typeof value === 'string' || typeof value === 'boolean') {
            updateData[key] = value;
            console.log(`✅ [DEBUG] [ParcelService] Added field ${key}:`, value);
          }
          else {
            console.warn(`⚠️ [DEBUG] [ParcelService] Skipping field ${key} with value:`, value);
          }
        } else {
          console.log(`⚠️ [DEBUG] [ParcelService] Skipping undefined/null field ${key}`);
        }
      });
      
      // Synchroniser le statut principal avec le statut logistique
      if (updates.logisticsStatus) {
        console.log('🔄 [DEBUG] [ParcelService] Synchronizing main status with logistics status');
        const mainStatus = getMainStatusFromLogistics(updates.logisticsStatus);
        updateData.status = mainStatus;
        console.log(`🔄 [DEBUG] [ParcelService] Setting main status to: ${mainStatus} (from logistics: ${updates.logisticsStatus})`);
      }
      
      // Ajouter une entrée dans l'historique de traitement
      if (updates.logisticsStatus) {
        console.log('📝 [DEBUG] [ParcelService] Adding processing history entry');
        const currentData = currentDoc.data();
        const existingHistory = currentData.processingHistory || [];
        
        const newStep = {
          step: updates.logisticsStatus,
          timestamp,
          operator: operatorId || 'unknown_operator',
          data: Object.fromEntries(
            Object.entries(updates).filter(([_, value]) => value !== undefined && value !== null)
          )
        };
        
        updateData.processingHistory = [...existingHistory, newStep];
        console.log('📝 [DEBUG] [ParcelService] New processing history:', updateData.processingHistory);
      }
      
      console.log('💾 [DEBUG] [ParcelService] Final update data:', JSON.stringify(updateData, null, 2));
      
      console.log('📤 [DEBUG] [ParcelService] Sending update to Firestore...');
      await updateDoc(parcelRef, updateData);
      
      console.log(`✅ [DEBUG] [ParcelService] Logistic fields updated successfully for ${parcelId}`);
      
      // Vérifier que la mise à jour a bien été appliquée
      console.log('🔍 [DEBUG] [ParcelService] Verifying update was applied...');
      const updatedDoc = await getDoc(parcelRef);
      if (updatedDoc.exists()) {
        const updatedData = updatedDoc.data();
        console.log('✅ [DEBUG] [ParcelService] Updated document data:', {
          logisticsStatus: updatedData.logisticsStatus,
          weightReal: updatedData.weightReal,
          weighedAt: updatedData.weighedAt,
          lastUpdated: updatedData.lastUpdated,
          lastUpdatedBy: updatedData.lastUpdatedBy
        });
      } else {
        console.error('❌ [DEBUG] [ParcelService] Document not found after update');
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ [DEBUG] [ParcelService] Error updating logistic fields:', error);
      console.error('❌ [DEBUG] [ParcelService] Error stack:', error instanceof Error ? error.stack : 'No stack available');
      return false;
    }
  }

  /**
   * Rechercher des colis par critères logistiques
   */
  static async searchParcelsByLogistics(filters: {
    logisticsStatus?: LogisticsStatusEnum;
    destination?: DestinationEnum;
    specialCaseType?: SpecialCaseTypeEnum;
    agentId?: string;
    hasWeightIssue?: boolean;
  }): Promise<Parcel[]> {
    try {
      console.log('🔍 [ParcelService] Searching parcels by logistics criteria:', filters);
      
      let parcelsQuery = collection(db, 'parcel');
      let constraints = [];
      
      // Ajouter les filtres
      if (filters.logisticsStatus) {
        constraints.push(where('logisticsStatus', '==', filters.logisticsStatus));
      }
      
      if (filters.destination) {
        constraints.push(where('destination', '==', filters.destination));
      }
      
      if (filters.specialCaseType) {
        constraints.push(where('specialCaseType', '==', filters.specialCaseType));
      }
      
      if (filters.agentId) {
        constraints.push(where('agentId', '==', filters.agentId));
      }
      
      // Construire la requête
      if (constraints.length > 0) {
        const q = query(
          parcelsQuery,
          ...constraints,
          orderBy('create_date', 'desc'),
          limit(50)
        );
        
        const querySnapshot = await getDocs(q);
        
        let parcels: Parcel[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          parcels.push(this.mapFirestoreToParcel(doc.id, data));
        });
        
        // Filtrer par problème de poids si demandé
        if (filters.hasWeightIssue) {
          parcels = parcels.filter(parcel => {
            if (!parcel.weightDeclared || !parcel.weightReal) return false;
            const difference = Math.abs(parcel.weightReal - parcel.weightDeclared);
            const percentage = (difference / parcel.weightDeclared) * 100;
            return percentage > 5; // Plus de 5% d'écart
          });
        }
        
        console.log(`✅ [ParcelService] Found ${parcels.length} parcels matching criteria`);
        return parcels;
        
      } else {
        // Si aucun filtre, retourner une liste vide
        return [];
      }
      
    } catch (error) {
      console.error('❌ [ParcelService] Error searching by logistics:', error);
      return [];
    }
  }

  /**
   * Mapper les données Firestore vers l'interface Parcel
   */
  private static mapFirestoreToParcel(docId: string, data: any): Parcel {
    return {
      id: docId,
      trackingID: data.trackingID || 'NO_TRACKING_ID',
      sender_name: data.sender_name || 'Unknown sender',
      sender_phone: data.sender_phone || '',
      receiver_name: data.receiver_name || 'Unknown receiver',
      receiver_phone: data.receiver_phone || '',
      phonePrefix1: data.phonePrefix1 || '',
      phonePrefix2: data.phonePrefix2 || '',
      uid: data.uid || '',
      mail2User: data.mail2User || '',
      city: data.city || '',
      address: data.address || '',
      type: data.type || 'paquet',
      description: data.description || '',
      totalWeight: data.totalWeight || data.weight || 0,
      weight: data.weight || data.totalWeight || 0,
      items: data.items || [],
      fragile: data.fragile || false,
      emballage: data.emballage || false,
      condition: data.condition || false,
      cost: data.cost || 0,
      status: data.status || 'pending',
      create_date: data.create_date || '',
      payment_date: data.payment_date,
      notified: data.notified || false,
      pickupMethod: data.pickupMethod || 'warehouse',
      
      // Nouveaux champs logistiques
      uniqueCode: data.uniqueCode,
      weightDeclared: data.weightDeclared || data.weight || data.totalWeight,
      weightReal: data.weightReal,
      actualWeight: data.actualWeight || data.weightReal,
      weightPhotos: data.weightPhotos || [],
      receptionTimestamp: data.receptionTimestamp,
      agentId: data.agentId,
      specialCaseType: data.specialCaseType || '',
      specialCaseReason: data.specialCaseReason,
      destination: data.destination,
      logisticsStatus: data.logisticsStatus,
      
      // Historiques
      processingHistory: data.processingHistory || [],
      notificationHistory: data.notificationHistory || [],
      
      // QR Code
      qrCode: data.qrCode,
      qrCodeImage: data.qrCodeImage,
      qrGenerated: data.qrGenerated,
      arrivalScan: data.arrivalScan,
      
      // Métadonnées
      lastUpdated: data.lastUpdated,
      lastUpdatedBy: data.lastUpdatedBy,
      
      // Timestamps
      receivedAt: data.receivedAt,
      weighedAt: data.weighedAt
    };
  }

  /**
   * Appeler la fonction Firebase pour envoyer la notification de réception
   */
  static async sendReceptionNotification(parcel: Parcel): Promise<boolean> {
    try {
      console.log(`📱 [ParcelService] Sending reception notification for ${parcel.trackingID}`);
      
      // Utilise la même URL que befret_new
      const functionUrl = 'https://us-central1-befret-development.cloudfunctions.net/sendReceiptNotification';
      
      // Récupérer les informations du destinataire depuis les données disponibles
      const receiverInfo = await this.getReceiverInfo(parcel);
      
      if (!receiverInfo.phone) {
        console.warn(`⚠️ [ParcelService] No phone number found for parcel ${parcel.trackingID}, skipping SMS notification`);
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
        // Ajout d'informations utiles pour la notification
        cost: parcel.cost || 0,
        weight: parcel.totalWeight || 0,
        pickupMethod: parcel.pickupMethod
      };
      
      console.log(`📤 [ParcelService] Sending notification payload:`, payload);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ [ParcelService] Reception notification sent successfully:`, result);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`❌ [ParcelService] Failed to send reception notification:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        return false;
      }
      
    } catch (error) {
      console.error('❌ [ParcelService] Error sending reception notification:', error);
      return false;
    }
  }

  /**
   * Appeler la fonction Firebase étendue pour envoyer la notification de réception avec données de pesée
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
      console.log(`⚖️ [ParcelService] Sending weighing notification for ${parcel.trackingID}`);
      console.log(`📊 [ParcelService] Weighing data:`, weighingData);
      
      const functionUrl = 'https://us-central1-befret-development.cloudfunctions.net/sendReceiptNotification';
      
      // Récupérer les informations du destinataire depuis les données disponibles
      const receiverInfo = await this.getReceiverInfo(parcel);
      
      if (!receiverInfo.phone) {
        console.warn(`⚠️ [ParcelService] No phone number found for parcel ${parcel.trackingID}, skipping SMS notification`);
        return false;
      }
      
      // PAYLOAD ÉTENDU avec paramètres de pesée
      const payload = {
        // Paramètres originaux (rétrocompatibilité)
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
        
        // NOUVEAUX PARAMÈTRES DE PESÉE
        actualWeight: weighingData.actualWeight,
        declaredWeight: weighingData.declaredWeight,
        weighingPhotos: weighingData.weighingPhotos,
        weighingStatus: weighingData.weighingStatus
      };
      
      console.log(`📤 [ParcelService] Sending weighing notification payload:`, payload);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ [ParcelService] Weighing notification sent successfully:`, result);
        console.log(`📊 [ParcelService] Used weighing template: ${result.hasWeighingData}`);
        console.log(`📧 [ParcelService] Template used: ${result.templateUsed}`);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`❌ [ParcelService] Failed to send weighing notification:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        return false;
      }
      
    } catch (error) {
      console.error('❌ [ParcelService] Error sending weighing notification:', error);
      return false;
    }
  }
  
  /**
   * Tri automatique d'un colis basé sur sa destination et son statut
   */
  static async autoSortParcel(parcelId: string, operatorId?: string): Promise<{ success: boolean; zone?: string; reason?: string; error?: string }> {
    try {
      console.log(`🤖 [AutoSort] Processing parcel ${parcelId}...`);
      
      const parcelRef = doc(db, 'parcel', parcelId);
      const parcelDoc = await getDoc(parcelRef);
      
      if (!parcelDoc.exists()) {
        return { success: false, error: 'Colis non trouvé' };
      }
      
      const parcelData = parcelDoc.data();
      const destination = parcelData.destination || parcelData.city?.toLowerCase();
      const specialCaseType = parcelData.specialCaseType || '';
      const logisticsStatus = parcelData.logisticsStatus || '';
      
      // Vérifier que le colis est prêt pour le tri
      if (logisticsStatus !== 'weighed' && logisticsStatus !== 'verified' && logisticsStatus !== 'weight_issue') {
        return { success: false, error: 'Colis non prêt pour le tri (doit être pesé d\'abord)' };
      }
      
      // Logique de tri
      let sortingZone = 'D'; // Zone par défaut (bloqué)
      let sortingReason = 'Destination inconnue';
      
      if (specialCaseType === 'payment_pending') {
        sortingZone = 'D';
        sortingReason = 'Paiement en attente';
      } else if (specialCaseType && specialCaseType !== '') {
        sortingZone = 'C';
        sortingReason = `Cas spécial: ${specialCaseType}`;
      } else if (destination === 'kinshasa') {
        sortingZone = 'A';
        sortingReason = 'Destination Kinshasa';
      } else if (destination === 'lubumbashi') {
        sortingZone = 'B';
        sortingReason = 'Destination Lubumbashi';
      }
      
      // Mise à jour du colis
      const updateData = {
        logisticsStatus: 'sorted',
        sortingZone: sortingZone,
        sortingReason: sortingReason,
        sortedAt: new Date().toISOString(),
        sortedBy: operatorId || 'auto-sort-system',
        lastUpdated: new Date().toISOString()
      };
      
      await updateDoc(parcelRef, updateData);
      
      console.log(`✅ [AutoSort] Parcel ${parcelData.trackingID} sorted to zone ${sortingZone}`);
      
      return {
        success: true,
        zone: sortingZone,
        reason: sortingReason
      };
      
    } catch (error) {
      console.error('❌ [AutoSort] Error auto-sorting parcel:', error);
      return { success: false, error: 'Erreur lors du tri automatique' };
    }
  }

  /**
   * Tri en lot de plusieurs colis
   */
  static async batchSortParcels(parcelIds: string[], operatorId?: string): Promise<{ success: boolean; results: any[]; error?: string }> {
    try {
      console.log(`📦 [BatchSort] Processing ${parcelIds.length} parcels...`);
      
      const results = [];
      
      for (const parcelId of parcelIds) {
        const sortResult = await this.autoSortParcel(parcelId, operatorId);
        results.push({
          parcelId,
          ...sortResult
        });
      }
      
      const successCount = results.filter(r => r.success).length;
      console.log(`✅ [BatchSort] Successfully sorted ${successCount}/${parcelIds.length} parcels`);
      
      return {
        success: true,
        results
      };
      
    } catch (error) {
      console.error('❌ [BatchSort] Error in batch sort:', error);
      return { success: false, results: [], error: 'Erreur lors du tri en lot' };
    }
  }

  /**
   * Déclencher le tri automatique après pesée
   */
  static async triggerAutoSortAfterWeighing(parcelId: string, operatorId?: string): Promise<boolean> {
    try {
      console.log(`⚖️ [TriggerAutoSort] Checking if parcel ${parcelId} can be auto-sorted after weighing...`);
      
      const parcelRef = doc(db, 'parcel', parcelId);
      const parcelDoc = await getDoc(parcelRef);
      
      if (!parcelDoc.exists()) {
        console.error('Parcel not found for auto-sort trigger');
        return false;
      }
      
      const parcelData = parcelDoc.data();
      const logisticsStatus = parcelData.logisticsStatus || '';
      const weightVerification = parcelData.weightVerification;
      
      // Vérifier que le colis est pesé et vérifié
      if (logisticsStatus === 'verified' || (logisticsStatus === 'weighed' && weightVerification?.autoApproved)) {
        console.log(`🚀 [TriggerAutoSort] Triggering auto-sort for verified parcel ${parcelData.trackingID}`);
        
        const sortResult = await this.autoSortParcel(parcelId, operatorId);
        
        if (sortResult.success) {
          console.log(`✅ [TriggerAutoSort] Auto-sort completed for ${parcelData.trackingID} → Zone ${sortResult.zone}`);
          return true;
        } else {
          console.warn(`⚠️ [TriggerAutoSort] Auto-sort failed for ${parcelData.trackingID}: ${sortResult.error}`);
          return false;
        }
      } else {
        console.log(`⏸️ [TriggerAutoSort] Parcel ${parcelData.trackingID} not ready for auto-sort (status: ${logisticsStatus})`);
        return false;
      }
      
    } catch (error) {
      console.error('❌ [TriggerAutoSort] Error triggering auto-sort:', error);
      return false;
    }
  }

  /**
   * Récupérer les informations du destinataire depuis différentes sources
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
      
      // Sinon, chercher dans les données du user via uid
      if (parcel.uid) {
        const userRef = doc(db, 'users', parcel.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          return {
            phone: userData.phone || userData.phoneNumber,
            city: userData.city || userData.defaultCity
          };
        }
      }
      
      console.warn(`⚠️ [ParcelService] No receiver info found for parcel ${parcel.trackingID}`);
      return {};
      
    } catch (error) {
      console.error('❌ [ParcelService] Error getting receiver info:', error);
      return {};
    }
  }
}

export default ParcelService;