/**
 * Shipment Service - Unified Shipment Management
 * ================================================
 *
 * Service pour gérer les expéditions avec la structure UnifiedShipment
 * Collection Firestore: 'shipments'
 * Source of truth: befret_new/functions/src/models/unified-shipment-backend.models.ts
 *
 * @version 2.0.0
 * @date 14 Novembre 2025
 */

import {
  collection,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase-config';
import {
  UnifiedShipment,
  ShipmentPhase,
  ShipmentCategory,
  StatusHistoryEntry
} from '@/types/unified-shipment';

/**
 * Interface pour les résultats de recherche
 */
export interface ShipmentSearchResult {
  found: boolean;
  shipment?: UnifiedShipment;
  error?: string;
}

/**
 * Helper pour vérifier les valeurs Firestore valides
 */
export const isValidFirestoreValue = (value: any): boolean => {
  return value !== undefined && value !== null;
};

/**
 * Helper pour nettoyer un objet des valeurs undefined/null
 */
export const cleanFirestoreData = (data: Record<string, any>): Record<string, any> => {
  const cleaned: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (isValidFirestoreValue(value)) {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

/**
 * Helper pour convertir Timestamp Firestore en Date
 */
/**
 * ✅ CORRECTION: Convertir timestamp Firestore (plusieurs formats possibles)
 * - Firestore Timestamp object (avec .toDate())
 * - Objet {seconds, nanoseconds}
 * - String ISO ("2025-11-01T20:28:21.093Z")
 * - Date object
 */
const convertTimestamp = (timestamp: any): Date => {
  // Format Firestore Timestamp avec méthode toDate()
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  // Format {seconds, nanoseconds}
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date(timestamp.seconds * 1000);
  }

  // Déjà un objet Date
  if (timestamp instanceof Date) {
    return timestamp;
  }

  // String ISO
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }

  // Fallback
  return new Date();
};

/**
 * Service pour gérer les expéditions unifiées (UnifiedShipment)
 */
export class ShipmentService {

  /**
   * Rechercher un shipment par trackingNumber dans la collection 'shipments'
   */
  static async searchByTrackingNumber(trackingNumber: string): Promise<ShipmentSearchResult> {
    try {
      console.log('🔍 [ShipmentService] Searching for shipment with trackingNumber:', trackingNumber);

      const shipmentsRef = collection(db, 'shipments');
      const q = query(
        shipmentsRef,
        where('trackingNumber', '==', trackingNumber.toUpperCase())
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('❌ [ShipmentService] No shipment found with trackingNumber:', trackingNumber);
        return { found: false, error: 'Expédition non trouvée' };
      }

      const shipmentDoc = querySnapshot.docs[0];
      const shipmentData = this.convertFirestoreToShipment(shipmentDoc.id, shipmentDoc.data());

      console.log('✅ [ShipmentService] Shipment found:', shipmentData.trackingNumber);
      return { found: true, shipment: shipmentData };

    } catch (error) {
      console.error('❌ [ShipmentService] Error searching shipment:', error);
      return { found: false, error: 'Erreur lors de la recherche' };
    }
  }

  /**
   * Récupérer un shipment par ID
   */
  static async getShipmentById(shipmentId: string): Promise<UnifiedShipment | null> {
    try {
      console.log('🔍 [ShipmentService] Fetching shipment by ID:', shipmentId);

      const shipmentRef = doc(db, 'shipments', shipmentId);
      const shipmentDoc = await getDoc(shipmentRef);

      if (!shipmentDoc.exists()) {
        console.log('❌ [ShipmentService] Shipment not found:', shipmentId);
        return null;
      }

      return this.convertFirestoreToShipment(shipmentDoc.id, shipmentDoc.data());

    } catch (error) {
      console.error('❌ [ShipmentService] Error fetching shipment:', error);
      return null;
    }
  }

  /**
   * Récupérer les shipments réceptionnés à l'entrepôt Befret
   * Affiche les colis avec statut 'received_at_warehouse'
   */
  static async getShipmentsForReception(limitCount: number = 20): Promise<UnifiedShipment[]> {
    try {
      console.log('📦 [ShipmentService] Fetching shipments received at warehouse...');

      const shipmentsRef = collection(db, 'shipments');

      // Récupérer les shipments avec statut 'received_at_warehouse'
      const q = query(
        shipmentsRef,
        where('status.current', '==', 'received_at_warehouse'),
        orderBy('timestamps.updatedAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      console.log(`📦 [ShipmentService] Found ${querySnapshot.size} shipments received at warehouse`);

      if (querySnapshot.empty) {
        console.log('⚠️ [ShipmentService] No shipments with status received_at_warehouse');
        return [];
      }

      const shipments: UnifiedShipment[] = [];

      querySnapshot.forEach((doc) => {
        const shipment = this.convertFirestoreToShipment(doc.id, doc.data());
        console.log(`  - ${shipment.trackingNumber} (status: ${typeof shipment.status === 'string' ? shipment.status : (shipment.status as any)?.current})`);
        shipments.push(shipment);
      });

      console.log(`✅ [ShipmentService] Returning ${shipments.length} received shipments`);
      return shipments;

    } catch (error) {
      console.error('❌ [ShipmentService] Error fetching received shipments:', error);
      return [];
    }
  }

  /**
   * Récupérer les shipments récemment reçus à l'entrepôt (phase WAREHOUSE)
   */
  static async getRecentReceivedShipments(limitCount: number = 20): Promise<UnifiedShipment[]> {
    try {
      console.log('📦 [ShipmentService] Fetching recent received shipments...');

      const shipmentsRef = collection(db, 'shipments');

      const q = query(
        shipmentsRef,
        where('currentPhase', '==', ShipmentPhase.WAREHOUSE),
        orderBy('metadata.updatedAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      console.log(`📦 [ShipmentService] Found ${querySnapshot.size} received shipments`);

      const shipments: UnifiedShipment[] = [];

      querySnapshot.forEach((doc) => {
        const shipment = this.convertFirestoreToShipment(doc.id, doc.data());
        shipments.push(shipment);
      });

      return shipments;

    } catch (error) {
      console.error('❌ [ShipmentService] Error fetching received shipments:', error);
      return [];
    }
  }

  /**
   * Marquer un shipment comme reçu à l'entrepôt
   * Transition: DPD_COLLECTION/COLLECTED_EUROPE → WAREHOUSE
   */
  static async markAsReceivedAtWarehouse(
    shipmentId: string,
    agentId: string,
    actualWeight?: number,
    notes?: string
  ): Promise<boolean> {
    try {
      console.log(`🔄 [ShipmentService] Marking shipment ${shipmentId} as received at warehouse by agent ${agentId}`);

      const shipmentRef = doc(db, 'shipments', shipmentId);
      const shipmentDoc = await getDoc(shipmentRef);

      if (!shipmentDoc.exists()) {
        console.error('❌ [ShipmentService] Shipment not found:', shipmentId);
        return false;
      }

      const currentData = shipmentDoc.data();
      const currentPhase = currentData.currentPhase;

      // Vérifier que la transition est valide
      const validTransitionPhases = [
        ShipmentPhase.DPD_COLLECTION,
        ShipmentPhase.COLLECTED_EUROPE
      ];

      if (!validTransitionPhases.includes(currentPhase)) {
        console.error(`❌ [ShipmentService] Invalid transition from ${currentPhase} to WAREHOUSE`);
        return false;
      }

      console.log(`🔄 [ShipmentService] Transitioning from ${currentPhase} to WAREHOUSE`);

      // Créer l'entrée d'historique
      const historyEntry: StatusHistoryEntry = {
        status: ShipmentPhase.WAREHOUSE,
        timestamp: new Date(),
        source: 'backoffice-reception',
        details: {
          agentId,
          previousPhase: currentPhase,
          notes: notes || 'Colis reçu et scanné à l\'entrepôt Befret',
          actualWeight
        }
      };

      // Préparer les mises à jour
      const updates: any = {
        currentPhase: ShipmentPhase.WAREHOUSE,
        status: 'warehouse_received',
        'metadata.updatedAt': serverTimestamp(),
        statusHistory: [...(currentData.statusHistory || []), historyEntry]
      };

      // Ajouter befretIntegration si nécessaire
      if (!currentData.befretIntegration) {
        updates['befretIntegration'] = {
          warehouseArrival: new Date(),
          status: 'received'
        };
      } else {
        updates['befretIntegration.warehouseArrival'] = new Date();
        updates['befretIntegration.status'] = 'received';
      }

      // Mettre à jour le poids réel si fourni
      if (actualWeight && actualWeight > 0) {
        updates['actualWeight'] = actualWeight;
      }

      await updateDoc(shipmentRef, updates);

      console.log(`✅ [ShipmentService] Shipment ${shipmentId} successfully marked as received at warehouse`);
      console.log(`📊 [ShipmentService] Phase updated to: WAREHOUSE`);

      return true;

    } catch (error) {
      console.error('❌ [ShipmentService] Error marking shipment as received:', error);
      return false;
    }
  }

  /**
   * Mettre à jour le poids d'un shipment
   */
  static async updateShipmentWeight(
    shipmentId: string,
    actualWeight: number,
    agentId: string,
    notes?: string
  ): Promise<boolean> {
    try {
      console.log(`⚖️ [ShipmentService] Updating weight for shipment ${shipmentId}: ${actualWeight}kg`);

      const shipmentRef = doc(db, 'shipments', shipmentId);

      const historyEntry: StatusHistoryEntry = {
        status: 'weight_updated',
        timestamp: new Date(),
        source: 'backoffice-weighing',
        details: {
          agentId,
          actualWeight,
          notes: notes || 'Poids vérifié à l\'entrepôt'
        }
      };

      const updates: any = {
        weight: actualWeight,
        'metadata.updatedAt': serverTimestamp(),
        statusHistory: [...(await this.getStatusHistory(shipmentId)), historyEntry]
      };

      await updateDoc(shipmentRef, updates);

      console.log(`✅ [ShipmentService] Weight updated successfully`);
      return true;

    } catch (error) {
      console.error('❌ [ShipmentService] Error updating weight:', error);
      return false;
    }
  }

  /**
   * Rechercher shipments par filtres
   */
  static async searchShipments(filters: {
    phase?: ShipmentPhase;
    category?: ShipmentCategory;
    destination?: string;
    trackingNumber?: string;
    senderEmail?: string;
  }): Promise<UnifiedShipment[]> {
    try {
      console.log('🔍 [ShipmentService] Searching shipments with filters:', filters);

      let shipmentsQuery = collection(db, 'shipments');
      const constraints: any[] = [];

      if (filters.phase) {
        constraints.push(where('currentPhase', '==', filters.phase));
      }

      if (filters.category) {
        constraints.push(where('category', '==', filters.category));
      }

      if (filters.destination) {
        constraints.push(where('destination.city', '==', filters.destination));
      }

      if (filters.trackingNumber) {
        constraints.push(where('trackingNumber', '==', filters.trackingNumber.toUpperCase()));
      }

      if (filters.senderEmail) {
        constraints.push(where('sender.email', '==', filters.senderEmail));
      }

      constraints.push(orderBy('metadata.createdAt', 'desc'));
      constraints.push(limit(50));

      const q = query(shipmentsQuery, ...constraints);
      const querySnapshot = await getDocs(q);

      console.log(`🔍 [ShipmentService] Found ${querySnapshot.size} shipments`);

      const shipments: UnifiedShipment[] = [];
      querySnapshot.forEach((doc) => {
        shipments.push(this.convertFirestoreToShipment(doc.id, doc.data()));
      });

      return shipments;

    } catch (error) {
      console.error('❌ [ShipmentService] Error searching shipments:', error);
      return [];
    }
  }

  /**
   * ✅ CORRECTION MAJEURE: Convertir les données Firestore RÉELLES en UnifiedShipment
   * Structure basée sur analyse JSON réel + webhook befret_new
   */
  private static convertFirestoreToShipment(id: string, data: any): UnifiedShipment {
    return {
      id,
      trackingNumber: data.trackingNumber || '',
      category: data.category || 'standard',
      type: data.type || 'standard_home',
      businessModel: data.businessModel || 'immediate_payment',
      transportProvider: data.transportProvider || 'dpd',
      currentPhase: data.currentPhase || ShipmentPhase.PREPARATION,
      userId: data.userId,

      // ✅ CRITIQUE: customerInfo wrapper (structure RÉELLE Firestore!)
      customerInfo: data.customerInfo || {
        sender: {
          name: '',
          email: '',
          phone: { number: '', prefix: '', country: '' },
          address: { street: '', city: '', zipCode: '', country: '' }
        },
        receiver: {
          name: '',
          phone: { number: '', prefix: '', country: '' },
          address: { street: '', city: '', zipCode: '', country: '' }
        }
      },

      // ✅ CRITIQUE: parcelInfo wrapper (structure RÉELLE Firestore!)
      parcelInfo: data.parcelInfo || {
        weight: 0,
        deliveryMethod: 'warehouse',
        description: ''
      },

      serviceConfig: data.serviceConfig || {
        dpdServiceType: 'home_pickup',
        fragile: false,
        emballage: false
      },
      // ✅ CORRECTION: pricing structure from real Firestore
      pricing: data.pricing || {
        total: 0,
        basePrice: 0,
        currency: 'EUR',
        taxes: 0,
        serviceFee: 0,
        weightSurcharge: 0
      },

      standardData: data.standardData,
      heavyData: data.heavyData,

      // ✅ CRITIQUE: status est un OBJET (pas string!)
      status: data.status || {
        current: 'pending',
        phase: 'preparation',
        label: 'En attente',
        description: '',
        isTerminal: false,
        nextActions: [],
        updatedAt: new Date().toISOString()
      },
      statusHistory: (data.statusHistory || []).map((entry: any) => ({
        ...entry,
        timestamp: convertTimestamp(entry.timestamp)
      })),

      // ✅ CORRECTION: timestamps séparés (structure RÉELLE)
      timestamps: {
        createdAt: convertTimestamp(data.timestamps?.createdAt || data.metadata?.createdAt),
        updatedAt: convertTimestamp(data.timestamps?.updatedAt || data.metadata?.updatedAt),
        paidAt: convertTimestamp(data.timestamps?.paidAt),
        lastDPDSync: data.timestamps?.lastDPDSync  // Garder format natif {seconds, nanoseconds}
      },

      metadata: data.metadata ? {
        createdAt: convertTimestamp(data.metadata.createdAt),
        updatedAt: convertTimestamp(data.metadata.updatedAt),
        createdBy: data.metadata.createdBy || '',
        source: data.metadata.source || 'unknown',
        version: data.metadata.version || '1.0.0',
        stripeSessionId: data.metadata.stripeSessionId,
        whatsappInfo: data.metadata.whatsappInfo
      } : undefined,

      dpdIntegration: data.dpdIntegration,
      befretIntegration: data.befretIntegration,

      // ✅ CORRECTION: Additional fields from real Firestore
      webhookStatus: data.webhookStatus,
      paymentFlow: data.paymentFlow,
      userLocation: data.userLocation,
      phase: data.phase,

      // ⚠️ DEPRECATED: Rétrocompatibilité (sera supprimé plus tard)
      weight: data.parcelInfo?.weight || data.weight,
      destination: data.destination,
      sender: data.sender
    };
  }

  /**
   * Helper pour récupérer l'historique de statut
   */
  private static async getStatusHistory(shipmentId: string): Promise<StatusHistoryEntry[]> {
    try {
      const shipmentDoc = await getDoc(doc(db, 'shipments', shipmentId));
      if (shipmentDoc.exists()) {
        return shipmentDoc.data().statusHistory || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting status history:', error);
      return [];
    }
  }

  /**
   * Obtenir tous les shipments (avec pagination)
   */
  static async getAllShipments(limitCount: number = 50): Promise<UnifiedShipment[]> {
    try {
      console.log(`📦 [ShipmentService] Fetching all shipments (limit: ${limitCount})...`);

      const shipmentsRef = collection(db, 'shipments');
      const q = query(
        shipmentsRef,
        orderBy('metadata.createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      console.log(`📦 [ShipmentService] Found ${querySnapshot.size} shipments`);

      const shipments: UnifiedShipment[] = [];
      querySnapshot.forEach((doc) => {
        shipments.push(this.convertFirestoreToShipment(doc.id, doc.data()));
      });

      return shipments;

    } catch (error) {
      console.error('❌ [ShipmentService] Error fetching all shipments:', error);
      return [];
    }
  }
}

// Export du service par défaut
export default ShipmentService;
