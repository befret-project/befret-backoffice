/**
 * LOGISTICS SYSTEM TYPES - Complete Architecture
 *
 * Types pour le système logistique complet Befret
 * Couvre tous les modules : Réception, Préparation, Expédition, Livraison
 *
 * @version 1.0
 * @author BeFret Backoffice Team
 */

import type {
  UnifiedShipment,
  ShipmentPhase
} from './unified-shipment';

// ============================================================================
// TYPES LOGISTIQUES (définis localement car pas dans UnifiedShipment backend)
// ============================================================================

export type LogisticStage = 'reception' | 'preparation' | 'expedition' | 'delivery';

export type ParcelVerificationStatus =
  | 'pending'
  | 'verified'
  | 'weight_discrepancy'
  | 'damage_detected'
  | 'requires_inspection';

export type ParcelClassification =
  | 'standard'
  | 'fragile'
  | 'heavy'
  | 'oversized'
  | 'special_handling';

export type GroupageType =
  | 'kinshasa'
  | 'lubumbashi'
  | 'mixed';

export type GroupageStatus =
  | 'open'
  | 'in_progress'
  | 'closed'
  | 'shipped'
  | 'delivered';

export type ShippingModeType =
  | 'air'
  | 'sea'
  | 'road';

export type CarrierType =
  | 'dpd'
  | 'befret'
  | 'partner';

export type DeliveryStatus =
  | 'pending'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// ============================================================================
// SEARCH & FILTERS
// ============================================================================

export interface ParcelSearchFilters {
  trackingNumber?: string;
  befretTrackingNumber?: string;
  dpdTrackingNumber?: string;
  stage?: LogisticStage;
  status?: string;
  destination?: 'Kinshasa' | 'Lubumbashi';
  dateFrom?: string;
  dateTo?: string;
  hasWeightIssue?: boolean;
  classification?: ParcelClassification;
  groupageId?: string;
  operatorId?: string;
}

export interface ParcelSearchResult {
  shipments: UnifiedShipment[];
  total: number;
  hasMore: boolean;
  filters: ParcelSearchFilters;
}

// ============================================================================
// RECEPTION & WEIGHING
// ============================================================================

export interface ReceptionFormData {
  trackingNumber: string;
  scannedAt: string;
  operatorId: string;
  operatorName: string;
  location: GeoLocation;
  photo?: string;
  notes?: string;
}

export interface WeighingFormData {
  trackingNumber: string;
  actualWeight: number;
  weighedAt: string;
  operatorId: string;
  operatorName: string;
  photos: WeighingPhoto[];
  location: GeoLocation;
  notes?: string;
}

export interface WeighingPhoto {
  url: string;
  type: 'balance' | 'parcel' | 'comparison' | 'angle_view';
  timestamp: string;
  description?: string;
}

export interface WeighingResult {
  success: boolean;
  weightDifference: number;
  percentageDifference: number;
  needsClientContact: boolean;
  financialImpact: number;
  autoApproved: boolean;
  status: 'OK' | 'WARNING' | 'ERROR';
}

// ============================================================================
// PREPARATION & VERIFICATION
// ============================================================================

export interface PreparationFormData {
  trackingNumber: string;
  verificationStatus: ParcelVerificationStatus;
  verifiedAt: string;
  operatorId: string;
  operatorName: string;
  extraPackaging: boolean;
  extraPackagingConfirmed: boolean;
  photos: PreparationPhoto[];
  notes?: string;
}

export interface PreparationPhoto {
  url: string;
  type: 'before_packaging' | 'during_packaging' | 'after_packaging' | 'label_attached';
  timestamp: string;
  description?: string;
}

export interface LabelGenerationRequest {
  trackingNumber: string;
  destination: 'Kinshasa' | 'Lubumbashi';
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  isFragile: boolean;
  requiresExtraPackaging: boolean;
}

export interface LabelGenerationResult {
  success: boolean;
  labelUrl?: string;
  qrCode?: string;
  barcode?: string;
  error?: string;
}

export interface ClassificationData {
  category: ParcelClassification;
  reason: string;
  classifiedAt: string;
  classifiedBy: string;
  requiresAction: boolean;
  actionType?: 'contact_client' | 'hold_shipment' | 'request_payment' | 'return_to_sender';
}

// ============================================================================
// GROUPAGE & EXPEDITION
// ============================================================================

export interface GroupageCreationRequest {
  type: GroupageType;
  destination: 'Kinshasa' | 'Lubumbashi';
  parcelTrackingNumbers: string[];
  shippingMode: ShippingModeType;
  carrierId?: string;
  createdBy: string;
}

export interface GroupageDetails {
  groupageId: string;
  type: GroupageType;
  status: GroupageStatus;
  destination: 'Kinshasa' | 'Lubumbashi';

  parcels: GroupageParcelDetails[];
  totalWeight: number;
  parcelCount: number;

  shippingMode: {
    type: ShippingModeType;
    carrier?: CarrierDetails;
  };

  contacts: GroupageContacts;

  labelUrl?: string;
  photos: GroupagePhoto[];

  createdAt: string;
  createdBy: string;
  dispatchedAt?: string;
  dispatchedBy?: string;
  arrivedAt?: string;

  timeline: GroupageTimelineEvent[];
}

export interface GroupageParcelDetails {
  trackingNumber: string;
  weight: number;
  destination: 'Kinshasa' | 'Lubumbashi';
  addedAt: string;
  addedBy: string;
  senderName: string;
  receiverName: string;
  receiverPhone: string;
}

export interface CarrierDetails {
  carrierId: string;
  type: CarrierType;
  name: string;
  contactPerson?: string;
  phone?: string;
  flightNumber?: string;
  airport?: string;
}

export interface GroupageContacts {
  responsableGroupageA?: ResponsableContact;
  contactExpedition?: ExpeditionContact;
  contactReception?: ReceptionContact;
  responsableGroupageB?: ResponsableContact;
}

export interface ResponsableContact {
  uid: string;
  name: string;
  role: 'responsable_groupage';
  location: 'Tubize' | 'Kinshasa' | 'Lubumbashi';
  handedOverAt?: string;
  handedOverLocation?: GeoLocation;
  signature?: string;
  photo?: string;
}

export interface ExpeditionContact {
  teamMemberId: string;
  name: string;
  type: 'voyageur' | 'agent_aeroport';
  phone: string;
  whatsapp: string;
  receivedAt?: string;
  receivedLocation?: GeoLocation;
  signature?: string;
  photo?: string;
}

export interface ReceptionContact {
  teamMemberId: string;
  name: string;
  role: 'contact_reception';
  location: 'Kinshasa' | 'Lubumbashi';
  phone: string;
  whatsapp: string;
  receivedAt?: string;
  receivedLocation?: GeoLocation;
  signature?: string;
  photo?: string;
}

export interface GroupagePhoto {
  url: string;
  type: 'before_wrapping' | 'during_wrapping' | 'after_wrapping' | 'at_handover' | 'at_reception';
  timestamp: string;
  takenBy: string;
  location?: GeoLocation;
  description?: string;
}

export interface GroupageTimelineEvent {
  stage: string;
  status: string;
  timestamp: string;
  operatorId: string;
  operatorName: string;
  location?: GeoLocation;
  notes?: string;
  photos?: string[];
}

export interface GroupageWrapRequest {
  groupageId: string;
  wrappedAt: string;
  wrappedBy: string;
  photos: string[];
  notes?: string;
}

export interface GroupageDispatchRequest {
  groupageId: string;
  dispatchedAt: string;
  dispatchedBy: string;
  handedToExpedition: ExpeditionContact;
  photos: string[];
  notes?: string;
}

// ============================================================================
// RECEPTION ARRIVÉE (CONGO)
// ============================================================================

export interface ArrivalReceptionRequest {
  groupageId: string;
  arrivedAt: string;
  receivedBy: string;
  location: 'Kinshasa' | 'Lubumbashi';
  receivedLocation: GeoLocation;
  photos: string[];
  notes?: string;
}

export interface GroupageWeighingRequest {
  groupageId: string;
  actualWeight: number;
  weighedAt: string;
  weighedBy: string;
  photos: string[];
  location: GeoLocation;
  notes?: string;
}

export interface GroupageWeighingResult {
  success: boolean;
  expectedWeight: number;
  actualWeight: number;
  weightDifference: number;
  percentageDifference: number;
  hasAlert: boolean;
  alertThreshold: number;
  requiresInvestigation: boolean;
}

export interface DegroupageRequest {
  groupageId: string;
  parcelTrackingNumber: string;
  extractedAt: string;
  extractedBy: string;
  parcelWeight: number;
  parcelPhoto: string;
  location: GeoLocation;
  notes?: string;
}

export interface DegroupageValidation {
  success: boolean;
  parcelFound: boolean;
  weightMatch: boolean;
  weightDifference?: number;
  status: 'validated' | 'blocked' | 'awaiting';
  reason?: string;
}

export interface DeliverySortingRequest {
  parcelTrackingNumber: string;
  deliveryMethod: 'befret_pickup_point' | 'home_delivery';
  warehouseLocation?: string;
  sortedAt: string;
  sortedBy: string;
  location: GeoLocation;
  notes?: string;
}

// ============================================================================
// DELIVERY (LIVRAISON FINALE)
// ============================================================================

export interface DeliveryAttemptRequest {
  parcelTrackingNumber: string;
  attemptedAt: string;
  attemptedBy: string;
  attemptLocation: GeoLocation;
  attemptResult: 'success' | 'failed';
  failureReason?: string;
  photos: DeliveryPhoto[];
  notes?: string;
}

export interface DeliverySuccessRequest {
  parcelTrackingNumber: string;
  deliveredAt: string;
  deliveredBy: string;
  deliveryLocation: GeoLocation;
  recipientName: string;
  recipientIdCardPhoto: string;
  parcelPhoto: string;
  signature: string;
  notes?: string;
}

export interface DeliveryPhoto {
  url: string;
  type: 'recipient_id' | 'parcel_before' | 'parcel_after' | 'signature' | 'location' | 'proof';
  timestamp: string;
  description?: string;
}

export interface DeliveryProof {
  parcelPhoto: string;
  idCardPhoto: string;
  signature: string;
  signedBy: string;
  deliveredAt: string;
  deliveredBy: string;
  location: GeoLocation;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export interface NotificationRequest {
  trackingNumber: string;
  type: NotificationType;
  recipientPhone: string;
  recipientEmail?: string;
  language: 'fr' | 'en' | 'nl';
  channels: NotificationChannel[];
  data: Record<string, any>;
}

export type NotificationType =
  | 'reception_confirmed'
  | 'weighing_completed'
  | 'weight_discrepancy'
  | 'label_generated'
  | 'ready_for_expedition'
  | 'dispatched'
  | 'in_transit'
  | 'arrived_destination'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivery_attempted'
  | 'delivered'
  | 'issue_detected'
  | 'payment_required';

export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'push';

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  sentAt?: string;
  messageId?: string;
  error?: string;
}

export interface NotificationHistory {
  notificationId: string;
  trackingNumber: string;
  type: NotificationType;
  channels: NotificationChannel[];
  results: NotificationResult[];
  createdAt: string;
  sentBy: string;
}

// ============================================================================
// TEAM MANAGEMENT
// ============================================================================

export interface TeamMemberDetails {
  teamMemberId: string;
  type: 'employee' | 'voyageur' | 'agent_aeroport' | 'contact_externe';

  firstName: string;
  lastName: string;
  pseudonym?: string;
  photo?: string;

  contact: {
    operator: string;
    whatsapp: string;
    email?: string;
  };

  role: 'responsable_groupage' | 'contact_expedition' | 'contact_reception' | 'logistic_operator' | 'delivery_driver';
  location: 'Tubize' | 'Kinshasa' | 'Lubumbashi' | 'Brussels_Airport' | string;

  isActive: boolean;

  statistics?: {
    shipmentsHandled: number;
    groupagesCreated: number;
    deliveriesCompleted: number;
    lastActivityAt: string;
  };

  createdAt: string;
  updatedAt?: string;
}

export interface CarrierPartner {
  carrierId: string;
  type: CarrierType;
  name: string;
  fullName: string;

  contact: {
    person?: string;
    phone?: string;
    email?: string;
  };

  airports?: string[];
  destinations?: string[];

  pricing?: {
    perKg23kg?: number;
    perKg32kg?: number;
    horsNorme?: number;
  };

  isActive: boolean;

  statistics?: {
    shipmentsHandled: number;
    totalWeightKg: number;
    lastShipmentAt: string;
  };

  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// STATISTICS & REPORTING
// ============================================================================

export interface LogisticsStatistics {
  period: {
    from: string;
    to: string;
  };

  reception: {
    totalReceived: number;
    totalWeighed: number;
    weightIssues: number;
    averageProcessingTime: number; // minutes
  };

  preparation: {
    totalPrepared: number;
    totalLabeled: number;
    extraPackaging: number;
    issuesDetected: number;
  };

  expedition: {
    groupagesCreated: number;
    parcelsShipped: number;
    totalWeightKg: number;
    byDestination: {
      Kinshasa: number;
      Lubumbashi: number;
    };
    byCarrier: Record<string, number>;
  };

  delivery: {
    totalDelivered: number;
    failedAttempts: number;
    averageDeliveryTime: number; // hours
    byMethod: {
      pickup_point: number;
      home_delivery: number;
    };
  };

  performance: {
    averageTotalTime: number; // days
    onTimeRate: number; // percentage
    issueRate: number; // percentage
  };
}

export interface OperatorPerformance {
  operatorId: string;
  operatorName: string;
  period: {
    from: string;
    to: string;
  };

  activities: {
    receptionsProcessed: number;
    weighingsCompleted: number;
    labelsGenerated: number;
    groupagesCreated: number;
    deliveriesCompleted: number;
  };

  quality: {
    errorsReported: number;
    averageAccuracy: number; // percentage
    clientComplaintsResolved: number;
  };

  efficiency: {
    averageProcessingTime: number; // minutes
    shipmentsPerHour: number;
  };
}

// ============================================================================
// WORKFLOWS & VALIDATIONS
// ============================================================================

export interface WorkflowValidation {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  canProceed: boolean;
}

export interface WorkflowTransition {
  from: LogisticStage;
  to: LogisticStage;
  allowedRoles: string[];
  requiredData: string[];
  validations: ((data: any) => WorkflowValidation)[];
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  timestamp: string;
}

// ============================================================================
// REALTIME UPDATES
// ============================================================================

export interface RealtimeUpdate<T> {
  type: 'created' | 'updated' | 'deleted';
  collection: string;
  documentId: string;
  data?: T;
  timestamp: string;
}

export interface RealtimeSubscription {
  unsubscribe: () => void;
  collection: string;
  filters?: Record<string, any>;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type * from './unified-shipment';
