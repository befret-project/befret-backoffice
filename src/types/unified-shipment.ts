/**
 * Unified Shipment Models (Backend)
 * =================================
 * 
 * Backend models for unified shipment system in Firebase Functions
 * Adapted from frontend models for server-side usage
 * 
 * @version 1.0.0
 * @author BeFret Development Team
 */

// Core Enums
export enum ShipmentCategory {
  STANDARD = 'standard',  // 0-30kg
  HEAVY = 'heavy'         // >30kg
}

export enum ShipmentType {
  STANDARD_HOME = 'standard_home',
  STANDARD_SHOP = 'standard_shop',
  HEAVY_CUSTOM = 'heavy_custom'
}

export enum BusinessModel {
  IMMEDIATE_PAYMENT = 'immediate_payment',
  DEFERRED_PAYMENT = 'deferred_payment'
}

export enum TransportProvider {
  DPD = 'dpd',
  BEFRET = 'befret'
}

/**
 * PHASES LOGISTIQUES UNIFIÉES
 * Enum officiel utilisé dans toute l'application (backend + frontend)
 *
 * PHASES ACTUELLEMENT EN DB (Novembre 2025):
 * - PREPARATION: Écrit par webhook Stripe après paiement
 * - ORDER: Écrit par order-summary (flow alternatif)
 * - DPD_COLLECTION: Collecte Europe par DPD
 * - COLLECTED_EUROPE: Transit EU vers Belgique (timeline-sync)
 * - WAREHOUSE: Arrivé entrepôt Befret
 * - BEFRET_TRANSIT: Transit Befret vers Congo
 * - DELIVERED: Livré final
 *
 * PHASES HEAVY PARCEL:
 * - HEAVY_PROCESSING: Analyse demande + devis
 * - HEAVY_COLLECTION: Collecte spécialisée
 * - HEAVY_DELIVERY: Livraison spécialisée
 */
export enum ShipmentPhase {
  // === PHASES STANDARD (ordre chronologique) ===
  PREPARATION = 'preparation',              // Paiement → DPD shipment créé
  ORDER = 'order',                          // Commande confirmée (alternatif)
  DPD_COLLECTION = 'dpd_collection',        // Collecte Europe par DPD
  COLLECTED_EUROPE = 'collected_europe',    // Transit EU → BE (DPD)
  WAREHOUSE = 'warehouse',                  // Entrepôt Befret Belgique
  BEFRET_TRANSIT = 'befret_transit',        // Transit BE → Congo
  DELIVERED = 'delivered',                  // Livré final

  // === PHASES HEAVY PARCEL ===
  HEAVY_PROCESSING = 'heavy_processing',    // Analyse + devis
  HEAVY_COLLECTION = 'heavy_collection',    // Collecte spécialisée
  HEAVY_DELIVERY = 'heavy_delivery'         // Livraison spécialisée
}

// ✅ CORRECTION CRITIQUE: Interfaces conformes à la structure Firestore RÉELLE
// Basé sur analyse JSON réel + webhook befret_new/functions/src/functions/stripe/webhook.ts

/**
 * Structure téléphone (utilisée dans customerInfo.sender/receiver)
 */
export interface PhoneInfo {
  number: string;
  prefix: string;
  country: string;
}

/**
 * Structure adresse (utilisée dans customerInfo.sender/receiver)
 */
export interface AddressInfo {
  street: string;
  city: string;
  zipCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Informations sender (dans wrapper customerInfo)
 */
export interface SenderInfo {
  name: string;
  email: string;
  phone: PhoneInfo;
  address: AddressInfo;
}

/**
 * Informations receiver (dans wrapper customerInfo)
 */
export interface ReceiverInfo {
  name: string;
  email?: string;
  phone: PhoneInfo;
  address: AddressInfo;
}

/**
 * Wrapper customerInfo (niveau racine du shipment)
 * ✅ CRITIQUE: Cette structure EST utilisée dans Firestore réel!
 */
export interface CustomerInfo {
  sender: SenderInfo;
  receiver: ReceiverInfo;
  preferences?: {
    language?: string;
  };
}

// ⚠️ DEPRECATED: Interfaces legacy (gardées pour compatibilité temporaire)
export interface Destination {
  city: string;
  address: string;
  receiverName: string;
  receiverPhone: string;
  phonePrefix: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Sender {
  userId: string;
  name: string;
  email: string;
  phone: string;
  phonePrefix: string;
}

export interface ServiceConfig {
  // ✅ CORRIGÉ: Séparer les concepts DPD Europe vs BeFret Congo
  dpdServiceType: 'home_pickup' | 'shop_pickup'; // DPD Europe collection
  befretDeliveryMethod?: 'home_delivery' | 'warehouse'; // BeFret Congo delivery
  
  // ⚠️ DÉPRÉCIÉ: Champ legacy ambigu (gardé pour compatibility)
  pickupMethod?: 'dpd_pickup' | 'home_pickup' | 'shop_pickup';
  selectedPickupPoint?: {
    id: string;
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    openingHours: any;
    services: string[];
  };
  collectionDate?: string; // YYYY-MM-DD format for home_pickup Collection Request
  fragile: boolean;
  emballage: boolean;
}

/**
 * ✅ CORRECTION: Pricing structure from real Firestore data
 * Fields based on actual JSON in befret_new webhook
 */
export interface Pricing {
  total: number;              // Prix total final
  basePrice: number;          // Prix de base
  currency: string;           // EUR, USD, etc.
  paymentMethod?: string;     // card, etc.
  taxes?: number;             // Taxes appliquées
  serviceFee?: number;        // Frais de service
  weightSurcharge?: number;   // Supplément poids

  // ⚠️ DEPRECATED: Legacy field for backward compatibility
  totalCost?: number;         // → Use 'total' instead
  calculatedAt?: Date;        // → Not in real Firestore data
  breakdown?: {               // → Old structure (may not exist)
    baseBefretPrice: number;
    fragileCost: number;
    emballageCost: number;
    homeDeliveryCost: number;
    totalSupplementsCost: number;
  };
}

/**
 * ✅ CORRECTION CRITIQUE: Status est un OBJET (pas un string!)
 * Structure confirmée par JSON réel
 */
export interface ShipmentStatus {
  current: string;
  phase: string;
  label: string;
  description: string;
  isTerminal: boolean;
  nextActions: string[];
  updatedAt: string;
}

export interface StatusHistoryEntry {
  status: string;
  timestamp: Date;
  source: string;
  details?: any;
}

/**
 * ✅ CORRECTION: parcelInfo wrapper (confirmé par JSON réel)
 */
export interface ParcelInfo {
  weight: number;
  deliveryMethod?: string;
  description?: string;
  contentType?: string;  // Type de contenu (Paquet, Documents, etc.)
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  options?: {
    fragileHandling: boolean;
    reinforcedPackaging: boolean;
    saturdayDelivery: boolean;
    requiresSignature: boolean;
  };
}

/**
 * ✅ CORRECTION: Timestamps séparés (structure réelle Firestore)
 * Note: Firestore peut retourner strings ISO ("2025-11-01T20:28:21.093Z")
 * OU objets {seconds, nanoseconds}
 */
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface Timestamps {
  createdAt: Date | string;  // Usually ISO string
  updatedAt?: Date | string | FirestoreTimestamp;  // Can be Firestore timestamp object
  paidAt?: Date | string;
  lastDPDSync?: FirestoreTimestamp;  // Usually Firestore timestamp object
}

export interface ShipmentMetadata {
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  source: string;
  version: string;
  stripeSessionId?: string;
  whatsappInfo?: {
    senderWhatsApp: boolean;
    receiverWhatsApp: boolean;
    senderPhone: string;
    receiverPhone: string;
    senderCountry: string;
    receiverCountry: string;
  };
}

// Heavy Parcel Specific
export interface HeavyData {
  handling: {
    option: 'custom_shipping' | 'split_shipment';
    originalWeight: number;
    customShipping?: {
      dimensions: {
        length: number;
        width: number;
        height: number;
      };
      description: string;
      specialRequirements: string[];
    };
    splitShipment?: {
      packageCount: number;
      packages: Array<{
        weight: number;
        description: string;
        trackingNumber: string;
      }>;
    };
    timestamp: string;
  };
  originalWeight: number;
}

/**
 * ✅ CORRECTION: CollectionScheduled structure from real Firestore
 * Used for home_pickup service type
 */
export interface CollectionScheduled {
  scheduledDate: string;  // YYYY-MM-DD format
  timeWindow: string;     // e.g., "08:00-18:00"
  status: 'scheduled' | 'collected' | 'failed' | 'cancelled';
  address: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  instructions?: string;
  collectionRequestId?: string;
}

/**
 * ✅ CORRECTION: StandardData structure from real Firestore
 * Based on production JSON data
 */
export interface PickupPoint {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  openingHours: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  services: string[];
}

export interface DPDStatus {
  current: string;
  location: string;
  lastUpdate: string;
  eventDescription: string;
}

export interface StandardData {
  // DPD Integration
  dpdTrackingNumber: string;
  dpdShipmentId: string;
  dpdStatus?: DPDStatus;

  // Service Configuration
  serviceType: 'shop_pickup' | 'home_pickup';
  befretDeliveryMethod: 'warehouse' | 'home_delivery';

  // Pickup Point (for shop_pickup)
  pickupPoint?: PickupPoint;

  // Collection (for home_pickup)
  collectionRequestId?: string;
  collectionScheduled?: CollectionScheduled;

  // Labels & Tracking
  labelUrl: string;
  labelPdf?: string;  // Base64 PDF data
  trackingUrl: string;
  befretTrackingNumber: string;

  // Pricing (nested in standardData!)
  pricing: Pricing;

  // Payment
  stripeSessionId: string;
  paymentIntentId: string;

  // ⚠️ DEPRECATED: Legacy fields
  dpdServiceType?: string;  // → Use 'serviceType' instead
  estimatedDelivery?: Date;
}

/**
 * ✅ CORRECTION: WebhookStatus structure from real Firestore
 * Tracks webhook processing status and stages
 */
export interface WebhookStatus {
  overall: 'success' | 'partial' | 'failed' | 'retrying' | 'pending';
  actionRequired: boolean;
  contactSupport: boolean;
  createdAt: string;
  lastUpdated: string;
  userMessage?: {
    fr?: string;
    en?: string;
    nl?: string;
  };
  stages: {
    payment?: {
      status: string;
      paymentStatus?: string;
      timestamp: string;
      amount?: number;
      currency?: string;
      paymentIntentId?: string;
    };
    dpd?: {
      status: string;
      timestamp: string;
      dpdShipmentId?: string;
      dpdTrackingNumber?: string;
      serviceType?: string;
    };
    label?: {
      status: string;
      timestamp: string;
      storageMethod?: string;
      labelPdf?: string;
    };
    notifications?: {
      email?: {
        status: string;
        sentAt?: string;
      };
      sms?: {
        status: string;
        error?: {
          message: string;
          code: number;
        };
      };
    };
  };
}

/**
 * ✅ CORRECTION: PaymentFlow structure from real Firestore
 */
export interface PaymentFlow {
  architecture: 'unified_v2' | string;
  stripeSessionId: string;
  paymentIntentId: string;
  paymentStatus: 'paid' | 'pending' | 'failed';
  paymentAmount: number;
  paymentCurrency: string;
  paymentDate: {
    seconds: number;
    nanoseconds: number;
  };
  webhookProcessed: boolean;
}

/**
 * ✅ CORRECTION: UserLocation structure from real Firestore
 */
export interface UserLocation {
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  source: 'IP' | 'GPS' | string;
  confidence: number;
  timestamp: any;
}

/**
 * ✅ CORRECTION: PhaseTimeline structure from real Firestore
 */
export interface PhaseTimelineEntry {
  phase: string;
  label: string;
  description: string;
  completed: boolean;
  completedAt?: string;
}

export interface PhaseTimeline {
  current: string;
  progress: number;
  timeline: PhaseTimelineEntry[];
}

// ✅ CORRECTION MAJEURE: Interface UnifiedShipment conforme à Firestore RÉEL
/**
 * Main Unified Shipment Interface
 * Structure basée sur analyse JSON réel + webhook befret_new
 * Dernière mise à jour: Novembre 2025
 */
export interface UnifiedShipment {
  id: string;
  trackingNumber: string;
  category: ShipmentCategory;
  type: ShipmentType;
  businessModel: BusinessModel;
  transportProvider: TransportProvider;
  currentPhase: ShipmentPhase;
  userId?: string; // ID utilisateur Firebase Auth

  // ✅ CRITIQUE: customerInfo wrapper (structure RÉELLE Firestore!)
  customerInfo: CustomerInfo;

  // ✅ CRITIQUE: parcelInfo wrapper (structure RÉELLE Firestore!)
  parcelInfo: ParcelInfo;

  // Autres configurations
  serviceConfig: ServiceConfig;
  pricing: Pricing;

  // Category-specific data (Strategy Pattern)
  heavyData?: HeavyData;
  standardData?: StandardData;

  // ✅ CRITIQUE: status est un OBJET (pas string!)
  status: ShipmentStatus;
  statusHistory?: StatusHistoryEntry[];

  // ✅ CORRECTION: timestamps séparés
  timestamps: Timestamps;

  // Metadata
  metadata?: ShipmentMetadata;

  // DPD Integration
  dpdIntegration?: {
    shipmentId?: string;
    trackingNumber?: string;
    labelUrl?: string;
    status?: string;
    createdAt?: Date;
  };

  // BeFret Integration
  befretIntegration?: {
    trackingNumber?: string;
    labelUrl?: string;
    status?: string;
    warehouseArrival?: Date;
    estimatedDelivery?: Date;
  };

  // ✅ CORRECTION: Additional fields from real Firestore
  webhookStatus?: WebhookStatus;
  paymentFlow?: PaymentFlow;
  userLocation?: UserLocation;
  phase?: PhaseTimeline;  // Note: Différent de 'currentPhase' (ShipmentPhase enum)

  // ⚠️ DEPRECATED: Champs legacy (gardés pour compatibilité temporaire)
  weight?: number; // → Utiliser parcelInfo.weight
  destination?: Destination; // → Utiliser customerInfo.receiver
  sender?: Sender; // → Utiliser customerInfo.sender
}

// Utility Types
export type ShipmentCreationInput = Omit<UnifiedShipment, 'id' | 'trackingNumber' | 'metadata' | 'statusHistory'>;

export interface ShipmentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ShipmentSearchCriteria {
  trackingNumber?: string;
  userId?: string;
  category?: ShipmentCategory;
  status?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface ShipmentQueryResult {
  shipments: UnifiedShipment[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}