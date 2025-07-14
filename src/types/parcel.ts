// Types basés sur l'analyse de la collection "parcel" existante

export interface Sender {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address: string;
}

export interface Receiver {
  full_name: string;
  gender: 'male' | 'female';
  phone: string;
  address: string;
  city: 'kinshasa' | 'lubumbashi';
}

export interface Item {
  itemDescription: string;    // Aligné sur la structure existante
  itemValue: number;         // Aligné sur la structure existante
  numberOfItems: number;     // Aligné sur la structure existante
}

// Nouveaux types pour Sprint 2
export interface QRScanData {
  timestamp: string;
  operator: string;
  scannerId: string;
  location: string;
  photo?: string;
}

export interface WeightPhoto {
  url: string;
  timestamp: string;
  type: 'balance' | 'parcel' | 'comparison';
  operator: string;
  metadata?: {
    cameraDevice: string;
    location: string;
    lighting: string;
  };
}

export interface WeightVerification {
  difference: number;        // Différence en kg
  percentage: number;        // % d'écart
  status: 'OK' | 'WARNING' | 'ERROR';
  tolerance: number;         // Seuil de tolérance
  autoApproved: boolean;     // Approuvé automatiquement
  notes?: string;
  operator?: string;
  timestamp?: string;
}

export interface NotificationRecord {
  type: 'arrival' | 'weight_issue' | 'ready_pickup' | 'delivered' | 'delay';
  timestamp: string;
  recipient: string;
  channel: 'email' | 'sms' | 'push' | 'whatsapp';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  template: string;
  subject?: string;
  content?: string;
  data?: any;
  provider?: string;
  cost?: number;
}

export interface ProcessingStep {
  step: string;
  timestamp: string;
  operator: string;
  data?: any;
  location?: string;
  duration?: number;
}

export interface StorageLocation {
  zone: string;
  shelf: string;
  position: string;
  assignedAt: string;
  assignedBy: string;
}

export interface BackofficeNote {
  note: string;
  timestamp: string;
  operator: string;
  category: 'general' | 'weight' | 'damage' | 'client';
}

export interface QualityFlags {
  weightVarianceHigh?: boolean;
  packageDamaged?: boolean;
  contentMismatch?: boolean;
  clientNotified?: boolean;
  supervisorApproval?: boolean;
}

// Nouveaux enums pour les champs logistiques
export type LogisticsStatusEnum = 
  | 'pending_reception'       // En attente de réception
  | 'received'               // Reçu à l'entrepôt
  | 'weighed'               // Pesé
  | 'verified'              // Vérifié (poids conforme)
  | 'weight_issue'          // Problème de poids
  | 'ready_grouping'        // Prêt pour groupage
  | 'grouped'               // Groupé pour expédition
  | 'shipped'               // Expédié vers destination
  | 'arrived_destination'   // Arrivé à destination
  | 'ready_pickup'          // Prêt pour retrait
  | 'delivered'             // Livré
  | 'special_case'          // Cas spécial
  | 'sorted';               // Trié

export type DestinationEnum = 'kinshasa' | 'lubumbashi';

export type SpecialCaseTypeEnum = 
  | ''                      // Pas de cas spécial
  | 'dangerous'             // Marchandise dangereuse
  | 'payment_pending'       // Paiement en attente
  | 'fragile'              // Fragile
  | 'oversized'            // Surdimensionné
  | 'high_value'           // Haute valeur
  | 'customs_issue'        // Problème douanier
  | 'damaged'              // Endommagé
  | 'lost'                 // Perdu
  | 'returned';            // Retourné

// Modèle Parcel basé sur l'analyse réelle de la collection existante
export interface Parcel {
  // === CHAMPS EXISTANTS (à conserver) ===
  
  // Identifiants
  id?: string;                           // Document ID Firestore
  trackingID?: string;                   // Code de suivi (ex: "BGFXNG")
  uid: string;                           // User ID Firebase du client
  
  // Informations expéditeur/destinataire (structure existante)
  sender_name: string;
  sender_phone: string;
  receiver_name: string;
  receiver_phone: string;
  phonePrefix1: string;                  // Préfixe téléphonique
  phonePrefix2: string;                  // Description pays
  mail2User?: string;                    // Email du client
  
  // Destination
  city: string;                          // Ville de destination
  address: string;                       // Adresse (souvent vide)
  
  // Contenu et caractéristiques
  type: string;                          // "Paquet" | "Courrier"
  description?: string;                  // Description du contenu
  weight: number;                        // Poids déclaré
  totalWeight?: number;                  // Poids total (optionnel)
  items: Item[];                         // Array des objets
  fragile?: boolean;                     // Marquage fragile
  emballage?: boolean;                   // Emballage spécial
  condition: boolean;                    // Conditions acceptées
  
  // Financier
  cost: number;                          // Coût calculé
  codePromo?: string;                    // Code promo utilisé
  payment_date?: string;                 // Date de paiement
  
  // Workflow et statut (existant)
  status: 'draft' | 'pending' | 'to_warehouse' | 'from_warehouse_to_congo' | 'arrived_in_congo' | 'delivered';
  logisticStatus?: string;               // Statut logistique détaillé (ancien champ)
  pickupMethod: 'warehouse' | 'home_delivery';
  
  // Géolocalisation
  location?: {
    _latitude: number;
    _longitude: number;
  };
  
  // Dates
  create_date: string;
  notified: boolean;
  
  // === NOUVEAUX CHAMPS LOGISTIQUES REQUIS ===
  
  // Scanner et codes
  uniqueCode?: string;                   // Code scanner unique (différent du QR)
  qrCode?: string;                       // Code QR unique généré
  qrCodeImage?: string;                  // Image QR code en base64
  qrGenerated?: string;                  // Timestamp de génération QR
  arrivalScan?: QRScanData;              // Données du scan d'arrivée
  receptionTimestamp?: string;           // Timestamp scan arrivée
  
  // Poids et pesée
  weightDeclared?: number;               // Poids déclaré par le client
  weightReal?: number;                   // Poids réel à la pesée
  actualWeight?: number;                 // Alias pour compatibilité
  weightUnit?: 'kg' | 'g';              // Unité de poids
  weightPhotos?: WeightPhoto[];          // Photos de la balance
  weightVerification?: WeightVerification; // Vérification du poids
  
  // Agent et traitement
  agentId?: string;                      // ID de l'agent qui traite
  lastUpdatedBy?: string;                // Qui a fait la dernière modif
  
  // Cas spéciaux
  specialCaseType?: SpecialCaseTypeEnum; // Type de cas spécial
  specialCaseReason?: string;            // Raison du cas spécial
  
  // Destination et logistique
  destination?: DestinationEnum;         // Destination finale (kinshasa/lubumbashi)
  logisticsStatus?: LogisticsStatusEnum; // Statut logistique détaillé
  sortingZone?: string;                  // Zone de tri (A, B, C, D)
  sortedAt?: string;                     // Date de tri
  
  // Workflow logistique étendu
  processingHistory?: ProcessingStep[];   // Historique des étapes
  storageLocation?: StorageLocation;      // Emplacement de stockage
  
  // Notifications étendues
  notificationHistory?: NotificationRecord[]; // Historique complet
  
  // Métadonnées techniques
  lastUpdated?: string;                  // Dernière modification backoffice
  backofficeNotes?: BackofficeNote[];    // Notes internes
  
  // Timestamps de processus
  receivedAt?: string;                   // Date de réception
  weighedAt?: string;                    // Date de pesée
  
  // Flags de qualité
  qualityFlags?: QualityFlags;           // Indicateurs de problèmes
}

export interface LogisticStep {
  step: string;
  timestamp: string;
  agent: string;
  notes?: string;
  photos?: string[];
}

// Interface pour les données de pesée
export interface WeightData {
  actualWeight: number;
  photo: string;
  timestamp: string;
  agent: string;
  notes?: string;
}

// Interface pour la recherche de colis
export interface ParcelSearchResult {
  found: boolean;
  parcel?: Parcel;
  error?: string;
}