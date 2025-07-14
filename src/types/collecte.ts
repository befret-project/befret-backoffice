// Types pour la gestion des collectes dans Firestore

export interface Collecte {
  id?: string;                           // Document ID Firestore
  reference: string;                     // COL-2024-XXXX

  // Client
  client: {
    nom: string;
    telephone: string;
    email: string;
    entreprise?: string;
  };

  // Adresse de collecte
  adresse: {
    rue: string;
    ville: string;
    codePostal: string;
    pays: string;
  };

  // Planification
  status: 'programmee' | 'en_cours' | 'terminee' | 'annulee';
  datePrevue: string;                    // Date prévue ISO 8601
  heureCollecte: string;                 // Format HH:MM
  dateCollecte?: string;                 // Date réelle de collecte ISO 8601

  // Contenu estimé/réel
  nbColis: number;                       // Nombre estimé puis réel
  poidsTotal: number;                    // Poids estimé puis réel en kg
  typeCollecte: 'domicile' | 'entreprise' | 'point_relais';

  // Assignation et workflow
  chauffeur?: string;                    // Chauffeur assigné
  priorite: 'normale' | 'urgente' | 'express';
  operateur: string;                     // Qui a programmé la collecte

  // Métadonnées
  notes?: string;                        // Instructions spéciales
  createdAt: string;                     // ISO 8601
  updatedAt: string;                     // ISO 8601
  createdBy: string;                     // UID utilisateur
}

// Interface pour les résultats de recherche
export interface CollecteSearchResult {
  found: boolean;
  collecte?: Collecte;
  error?: string;
}

// Interface pour les filtres de recherche
export interface CollecteFilters {
  status?: Collecte['status'];
  chauffeur?: string;
  ville?: string;
  typeCollecte?: Collecte['typeCollecte'];
  priorite?: Collecte['priorite'];
  dateDebutRange?: string;               // Format YYYY-MM-DD
  dateFinRange?: string;                 // Format YYYY-MM-DD
  operateur?: string;
  search?: string;                       // Recherche libre (référence, client, etc.)
}

// Interface pour les statistiques
export interface CollecteStats {
  total: number;
  byStatus: Record<Collecte['status'], number>;
  byType: Record<Collecte['typeCollecte'], number>;
  byPriorite: Record<Collecte['priorite'], number>;
  byChauffeur: Record<string, number>;
  totalColis: number;
  totalPoids: number;
  averageCollectionTime: number;         // En minutes
}

// Interface pour la planification (création)
export type CollecteCreate = Omit<Collecte, 'id' | 'createdAt' | 'updatedAt'>;

// Interface pour la mise à jour
export type CollecteUpdate = Partial<Omit<Collecte, 'id' | 'reference' | 'createdAt' | 'createdBy'>>;

// Interface pour les données de completion de collecte
export interface CollecteCompletion {
  nbColisReel: number;
  poidsReel: number;
  heureReelle: string;
  notesCollecteur?: string;
  photos?: string[];                     // URLs des photos prises
}

// Interface pour la planification des chauffeurs
export interface RouteJournaliere {
  date: string;                          // Format YYYY-MM-DD
  chauffeur: string;
  collectes: Collecte[];
  totalEstime: {
    colis: number;
    poids: number;
    duree: number;                       // En minutes
  };
  zones: string[];                       // Zones géographiques couvertes
}

// Énumération pour les statuts
export const COLLECTE_STATUS = {
  PROGRAMMEE: 'programmee' as const,
  EN_COURS: 'en_cours' as const,
  TERMINEE: 'terminee' as const,
  ANNULEE: 'annulee' as const,
} as const;

// Configuration des statuts pour l'affichage
export const COLLECTE_STATUS_CONFIG = {
  programmee: { 
    label: '📅 Collecte programmée', 
    color: 'bg-green-100 text-green-800',
    description: 'Collecte planifiée et confirmée'
  },
  en_cours: { 
    label: '🚚 Collecte en cours', 
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Chauffeur en route ou sur place'
  },
  terminee: { 
    label: '✅ Collecte terminée', 
    color: 'bg-green-100 text-green-800',
    description: 'Colis collectés avec succès'
  },
  annulee: { 
    label: '❌ Collecte annulée', 
    color: 'bg-red-100 text-red-800',
    description: 'Collecte annulée ou reportée'
  }
} as const;

// Configuration des types de collecte
export const TYPE_COLLECTE_CONFIG = {
  domicile: { 
    label: '🏠 Collecte à domicile', 
    description: 'Collecte chez un particulier',
    dureeEstimee: 15 // minutes
  },
  entreprise: { 
    label: '🏢 Collecte en entreprise', 
    description: 'Collecte dans une entreprise',
    dureeEstimee: 30 // minutes
  },
  point_relais: { 
    label: '📍 Collecte point relais', 
    description: 'Collecte dans un point relais partenaire',
    dureeEstimee: 10 // minutes
  }
} as const;

// Configuration des priorités
export const COLLECTE_PRIORITE_CONFIG = {
  normale: { 
    label: '📋 Priorité normale', 
    color: 'bg-gray-100 text-gray-800',
    description: 'Collecte dans les délais standards'
  },
  urgente: { 
    label: '⚡ Priorité urgente', 
    color: 'bg-orange-100 text-orange-800',
    description: 'Collecte prioritaire dans la journée'
  },
  express: { 
    label: '🚀 Priorité express', 
    color: 'bg-red-100 text-red-800',
    description: 'Collecte immédiate si possible'
  }
} as const;