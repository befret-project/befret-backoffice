/**
 * UNIFIED SHIPMENT TYPES - Architecture unified_v2
 *
 * Ce fichier définit la structure complète des expéditions BeFret
 * selon l'architecture unifiée utilisée par befret_new
 *
 * @version 2.0
 * @author BeFret Development Team
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type ShipmentType =
  | 'standard_shop_pickup'    // Colis standard avec point relais DPD
  | 'standard_home_pickup'    // Colis standard avec collecte à domicile DPD
  | 'heavy_custom';           // Colis lourd (>30kg) avec traitement sur mesure

export type ServiceType =
  | 'shop_pickup'             // Dépôt en point relais DPD
  | 'home_pickup';            // Collecte à domicile par DPD

export type DeliveryMethod =
  | 'befret_pickup_point'     // Point relais BeFret au Congo
  | 'home_delivery';          // Livraison à domicile au Congo

export type ShipmentStatus =
  // Phase Order
  | 'created'
  | 'payment_pending'
  | 'payment_completed'
  | 'payment_failed'
  | 'payment_disputed'

  // Phase DPD Collection (Europe)
  | 'ready_for_deposit'         // Prêt pour dépôt en point relais
  | 'collection_scheduled'      // Collecte à domicile programmée
  | 'collected_by_dpd'          // Collecté par DPD
  | 'deposited_at_pickup'       // Déposé en point relais
  | 'dpd_transit_eu'            // En transit DPD Europe
  | 'received_at_warehouse'     // Arrivé entrepôt BeFret Tubize

  // Phase BeFret Distribution (Congo)
  | 'befret_transit'            // En transit vers Congo
  | 'arrived_in_congo'          // Arrivé au Congo
  | 'ready_for_pickup'          // Prêt pour retrait
  | 'out_for_delivery'          // En cours de livraison
  | 'delivery_attempted'        // Tentative de livraison échouée
  | 'delivered'                 // Livré

  // Status problèmes
  | 'returned_to_sender'
  | 'lost'
  | 'damaged';

export type ShipmentPhase =
  | 'order'                     // Commande et paiement
  | 'dpd_collection'            // Collecte DPD Europe
  | 'befret_distribution'       // Distribution BeFret Congo
  | 'delivered';                // Livré

export type WebhookOverallStatus =
  | 'pending'                   // En attente de traitement
  | 'processing'                // En cours de traitement
  | 'success'                   // Tout s'est bien passé
  | 'partial'                   // Succès partiel (action requise)
  | 'failed';                   // Échec

// ============================================================================
// LOGISTIC TYPES
// ============================================================================

export type LogisticStage =
  | 'reception_depart'          // Réception Europe
  | 'preparation'               // Préparation Europe
  | 'expedition'                // Expédition Europe → Congo
  | 'reception_arrivee'         // Réception Congo
  | 'degroupage'                // Dégroupage Congo
  | 'delivery_sorting'          // Tri livraison
  | 'delivery';                 // Livraison finale

export type ParcelVerificationStatus =
  | 'ok'                        // Tout va bien
  | 'empty'                     // Colis vide
  | 'dangerous'                 // Colis dangereux/suspect
  | 'awaiting_payment';         // En attente paiement

export type ParcelClassification =
  | 'ready'                     // Prêt pour expédition
  | 'empty'                     // Vide
  | 'dangerous'                 // Dangereux
  | 'awaiting_payment'          // Attente paiement
  | 'blocked';                  // Bloqué

export type GroupageType =
  | '23kg'                      // Groupage standard 23kg
  | '32kg'                      // Groupage standard 32kg
  | 'hors_norme';               // Groupage hors norme

export type GroupageStatus =
  | 'creating'                  // En création
  | 'ready'                     // Prêt pour expédition
  | 'dispatched'                // Expédié
  | 'in_transit'                // En transit
  | 'arrived'                   // Arrivé destination
  | 'degrouped';                // Dégroupé

export type ShippingModeType =
  | 'aerien'                    // Aérien
  | 'maritime';                 // Maritime

export type CarrierType =
  | 'Cargo-LTA'                 // Cargo LTA
  | 'MCO'                       // MCO (SN Brussels, Ethiopian, etc.)
  | 'Tag';                      // Tag (Schipol Airport)

export type TeamMemberRole =
  | 'responsable_groupage'      // Responsable groupage
  | 'contact_expedition'        // Contact expédition (voyageur, agent)
  | 'contact_reception';        // Contact réception

export type DeliveryStatus =
  | 'pending'                   // En attente
  | 'out_for_delivery'          // En cours livraison
  | 'attempted'                 // Tentative échouée
  | 'delivered'                 // Livré
  | 'failed';                   // Échec définitif

// ============================================================================
// MAIN INTERFACES
// ============================================================================

export interface UnifiedShipment {
  // === IDENTIFIANTS ===
  unifiedShipmentId: string;
  trackingNumber: string;
  befretTrackingNumber: string;
  dpdTrackingNumber?: string;
  dpdShipmentId?: string;

  // === ARCHITECTURE ===
  architecture: 'unified_v2';

  // === STRIPE ===
  stripeSessionId?: string;
  paymentIntentId?: string;

  // === TYPE & SERVICE ===
  type: ShipmentType;
  serviceType?: ServiceType;

  // === DESTINATION ===
  destinationInfo: DestinationInfo;

  // === COLIS ===
  parcelInfo: ParcelInfo;

  // === OPTIONS ===
  options: ShipmentOptions;

  // === CLIENT ===
  customerInfo: CustomerInfo;

  // === DPD SERVICE ===
  dpdServiceInfo?: DPDServiceInfo;

  // === PRICING ===
  pricing: PricingInfo;

  // === LABELS ===
  labels: LabelsInfo;

  // === WEBHOOK STATUS ===
  webhookStatus: WebhookProcessingStatus;

  // === STATUS TRACKING ===
  status: StatusTracking;

  // === LOGISTIC DATA (NOUVEAU) ===
  logisticData?: LogisticData;

  // === TIMESTAMPS ===
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface DestinationInfo {
  country: string;
  city: 'Kinshasa' | 'Lubumbashi';
  deliveryMethod: DeliveryMethod;
}

export interface ParcelInfo {
  weight: number;
  type: 'parcel' | 'mail';
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  declaredValue: number;
  items: ParcelItem[];
}

export interface ParcelItem {
  description: string;
  value: number;
  quantity: number;
}

export interface ShipmentOptions {
  fragile: boolean;
  befretPackaging: boolean;
}

export interface CustomerInfo {
  userId?: string;
  sender: ContactPerson;
  receiver: ContactPerson;
}

export interface ContactPerson {
  name: string;
  email?: string;
  phone: PhoneInfo;
  address?: AddressInfo;
}

export interface PhoneInfo {
  full: string;
  prefix: string;
  number: string;
  whatsapp: boolean;
}

export interface AddressInfo {
  street?: string;
  city: string;
  postalCode?: string;
  country: string;
}

export interface DPDServiceInfo {
  serviceType: ServiceType;
  pickupPoint?: PickupPoint;
  collectionDate?: string;
  collectionTimeWindow?: {
    from: string;
    to: string;
  };
}

export interface PickupPoint {
  id: string;
  name: string;
  address: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  openingHours?: string;
}

export interface PricingInfo {
  baseBefretPrice: number;
  originCountry: string;
  homeDeliveryCost: number;
  emballageCost: number;
  fragileCost: number;
  totalSupplements: number;
  totalPrice: number;
  currency: string;
  appliedPromoCode?: string;
}

export interface LabelsInfo {
  dpdLabelUrl?: string;
  dpdLabelPdf?: string;
  befretLabelUrl?: string;
}

export interface WebhookProcessingStatus {
  overall: WebhookOverallStatus;
  processedAt?: string;
  actionRequired: boolean;
  contactSupport: boolean;
  userMessage?: {
    fr: string;
    en: string;
    nl: string;
  };
  stages: {
    payment: StageStatus;
    dpd: StageStatus;
    collection?: CollectionStageStatus;
    label: StageStatus;
    notifications: NotificationStages;
  };
  timeline: TimelineEvent[];
}

export interface StageStatus {
  status: 'pending' | 'processing' | 'success' | 'failed';
  timestamp?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface CollectionStageStatus extends StageStatus {
  collectionDate?: string;
  confirmedDate?: string;
  rejectedDates?: string[];
  needsRebooking?: boolean;
}

export interface NotificationStages {
  email: StageStatus;
  sms?: StageStatus;
  whatsapp?: StageStatus;
  push?: StageStatus;
}

export interface TimelineEvent {
  stage: string;
  status: string;
  timestamp: string;
  message: string;
}

export interface StatusTracking {
  current: ShipmentStatus;
  phase: ShipmentPhase;
  lastUpdated: string;
  history: StatusHistoryEntry[];
}

export interface StatusHistoryEntry {
  status: ShipmentStatus;
  timestamp: string;
  location?: string;
  scannedBy?: string;
  notes?: string;
}

// ============================================================================
// LOGISTIC DATA - EXTENSION POUR LE BACKOFFICE
// ============================================================================

export interface LogisticData {
  // === RÉCEPTION DÉPART (Europe - Tubize) ===
  receptionDepart: ReceptionDepartData;

  // === PRÉPARATION (Europe - Tubize) ===
  preparation: PreparationData;

  // === EXPÉDITION (Europe → Congo) ===
  expedition: ExpeditionData;

  // === RÉCEPTION ARRIVÉE (Congo) ===
  receptionArrivee: ReceptionArriveeData;

  // === LIVRAISON (Congo) ===
  delivery: DeliveryData;

  // === HISTORIQUE PHOTOS ===
  photoHistory: PhotoHistoryEntry[];

  // === HISTORIQUE SCANS ===
  scanHistory: ScanHistoryEntry[];
}

export interface ReceptionDepartData {
  status: 'pending' | 'received' | 'weighed' | 'completed';
  receivedAt?: string;
  receivedBy?: string;
  scannedAt?: string;
  location: string;

  weighing: {
    declaredWeight: number;
    actualWeight?: number;
    weightDifference?: number;
    financialImpact?: number;
    weighedAt?: string;
    weighedBy?: string;
    needsClientContact: boolean;
  };

  photos: {
    receptionPhoto?: string;
    weighingPhoto?: string;
  };
}

export interface PreparationData {
  status: 'pending' | 'verified' | 'labeled' | 'sorted' | 'completed';

  verification: {
    status: ParcelVerificationStatus;
    verifiedAt?: string;
    verifiedBy?: string;
    notes?: string;
  };

  labeling: {
    befretLabelGenerated: boolean;
    befretLabelUrl?: string;
    printedAt?: string;
    printedBy?: string;
    extraPackaging: boolean;
    extraPackagingConfirmed: boolean;
    packagedPhoto?: string;
  };

  sorting: {
    destination: 'Kinshasa' | 'Lubumbashi';
    warehouseLocation?: string;
    sortedAt?: string;
    sortedBy?: string;
  };

  classification: {
    category: ParcelClassification;
    classifiedAt?: string;
  };
}

export interface ExpeditionData {
  status: 'pending' | 'grouped' | 'labeled' | 'dispatched' | 'in_transit' | 'arrived';

  groupage?: {
    groupageId: string;
    groupageType: GroupageType;
    groupageWeight: number;
    parcelCount: number;
    createdAt: string;
    createdBy: string;
    groupageLabelUrl?: string;
    groupageWrapped: boolean;
    groupagePhoto?: string;
  };

  shippingMode?: {
    type: ShippingModeType;
    carrier?: CarrierType;
    carrierDetails?: {
      carrierId: string;
      name: string;
      flightNumber?: string;
      airport?: string;
    };
  };

  contacts?: {
    responsableGroupageA?: ResponsableContact;
    contactExpedition?: ExpeditionContact;
    contactReception?: ReceptionContact;
    responsableGroupageB?: ResponsableContact;
  };

  dispatchedAt?: string;
  dispatchedBy?: string;
}

export interface ResponsableContact {
  uid: string;
  name: string;
  handedOverAt?: string;
}

export interface ExpeditionContact {
  teamMemberId: string;
  name: string;
  type: 'voyageur' | 'agent_aeroport';
  receivedAt?: string;
}

export interface ReceptionContact {
  teamMemberId: string;
  name: string;
  receivedAt?: string;
}

export interface ReceptionArriveeData {
  status: 'pending' | 'arrived' | 'weighed' | 'degrouped' | 'sorted' | 'ready';
  arrivedAt?: string;
  arrivedBy?: string;
  location: 'Kinshasa' | 'Lubumbashi';

  groupageWeighing?: {
    expectedWeight: number;
    actualWeight?: number;
    weightDifference?: number;
    alertThreshold: number;
    hasAlert: boolean;
    weighedAt?: string;
    weighedBy?: string;
    groupagePhoto?: string;
  };

  degroupage?: {
    degroupedAt?: string;
    degroupedBy?: string;
    status: 'validated' | 'blocked' | 'awaiting';
    parcelWeight?: {
      expectedWeight: number;
      actualWeight: number;
      weightDifference: number;
    };
    validatedAt?: string;
    parcelPhoto?: string;
  };

  deliverySorting?: {
    deliveryMethod: DeliveryMethod;
    warehouseLocation?: string;
    sortedAt?: string;
    sortedBy?: string;
  };
}

export interface DeliveryData {
  status: DeliveryStatus;
  deliveredAt?: string;
  deliveredBy?: string;

  proof?: {
    parcelPhoto?: string;
    idCardPhoto?: string;
    signature?: string;
    signedBy?: string;
  };

  attemptedDeliveries?: AttemptedDelivery[];
}

export interface AttemptedDelivery {
  attemptedAt: string;
  attemptedBy: string;
  reason: string;
  notes?: string;
}

export interface PhotoHistoryEntry {
  photoId: string;
  stage: LogisticStage;
  photoUrl: string;
  takenAt: string;
  takenBy: string;
  location?: GeoLocation;
  description?: string;
}

export interface ScanHistoryEntry {
  scanId: string;
  scannedAt: string;
  scannedBy: string;
  stage: LogisticStage;
  location?: GeoLocation;
  device?: string;
}

export interface GeoLocation {
  lat: number;
  lon: number;
  accuracy?: number;
}

// ============================================================================
// GROUPAGE
// ============================================================================

export interface Groupage {
  groupageId: string;
  type: GroupageType;
  status: GroupageStatus;

  parcels: GroupageParcel[];
  totalWeight: number;
  parcelCount: number;

  shippingMode: {
    type: ShippingModeType;
    carrier?: CarrierType;
    carrierDetails?: {
      carrierId: string;
      name: string;
      flightNumber?: string;
      airport?: string;
    };
  };

  contacts: {
    responsableGroupageA?: ResponsableContact;
    contactExpedition?: ExpeditionContact;
    contactReception?: ReceptionContact;
    responsableGroupageB?: ResponsableContact;
  };

  createdAt: string;
  createdBy: string;
  dispatchedAt?: string;
  arrivedAt?: string;

  labelUrl?: string;

  photos: {
    wrapped?: string;
    arrival?: string;
  };
}

export interface GroupageParcel {
  trackingNumber: string;
  weight: number;
  addedAt: string;
}

// ============================================================================
// TEAM MEMBERS
// ============================================================================

export interface TeamMember {
  teamMemberId: string;
  type: 'employee' | 'voyageur' | 'agent_aeroport' | 'contact_externe';

  firstName: string;
  lastName: string;
  pseudonym?: string;
  photo?: string;

  phone: {
    operator: string;
    whatsapp: string;
  };
  email?: string;

  role: TeamMemberRole;
  location: 'Tubize' | 'Kinshasa' | 'Lubumbashi' | 'Brussels_Airport' | string;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CARRIERS (PARTENAIRES)
// ============================================================================

export interface Carrier {
  carrierId: string;
  type: CarrierType;
  name: string;
  fullName: string;

  contactPerson?: string;
  phone?: string;
  email?: string;

  airports?: string[];
  destinations?: string[];

  isActive: boolean;

  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface SearchParcelRequest {
  dpdTrackingNumber?: string;
  befretTrackingNumber?: string;
}

export interface SearchParcelResponse {
  success: boolean;
  shipment?: UnifiedShipment;
  error?: string;
}

export interface ConfirmReceptionRequest {
  trackingNumber: string;
  employeeUid: string;
  location?: GeoLocation;
}

export interface ConfirmReceptionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface WeighParcelRequest {
  trackingNumber: string;
  actualWeight: number;
  employeeUid: string;
  photoUrl?: string;
}

export interface WeighParcelResponse {
  success: boolean;
  weightDifference: number;
  financialImpact: number;
  needsClientContact: boolean;
  message?: string;
  error?: string;
}
