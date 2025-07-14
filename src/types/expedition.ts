// Types pour la gestion des expéditions dans Firestore

export interface Expedition {
  id?: string;                           // Document ID Firestore
  reference: string;                     // EXP-2024-XXXX

  // Destination
  destination: {
    ville: string;
    pays: string;
    adresse: string;
  };

  // Transporteur
  transporteur: {
    nom: string;
    contact: string;
    telephone: string;
  };

  // Statuts et workflow
  status: 'preparation' | 'en_cours' | 'arrive' | 'livre';
  priorite: 'normale' | 'urgente' | 'express';

  // Contenu
  nbColis: number;
  poids: number;                         // Poids total en kg
  valeur: number;                        // Valeur déclarée en EUR
  conteneur?: string;                    // Référence conteneur

  // Planning
  dateDepart: string;                    // ISO 8601
  dateArriveePrevu: string;              // ISO 8601
  dateArriveeReelle?: string;            // ISO 8601 - quand livré

  // Suivi
  tracking: string;                      // Numéro de suivi transporteur
  responsable: string;                   // Responsable BEFRET

  // Métadonnées
  notes?: string;
  createdAt: string;                     // ISO 8601
  updatedAt: string;                     // ISO 8601
  createdBy: string;                     // UID utilisateur
}

// Interface pour les résultats de recherche
export interface ExpeditionSearchResult {
  found: boolean;
  expedition?: Expedition;
  error?: string;
}

// Interface pour les filtres de recherche
export interface ExpeditionFilters {
  status?: Expedition['status'];
  transporteur?: string;
  destination?: string;
  priorite?: Expedition['priorite'];
  dateDebutRange?: string;               // Format YYYY-MM-DD
  dateFinRange?: string;                 // Format YYYY-MM-DD
  responsable?: string;
  search?: string;                       // Recherche libre (référence, tracking, etc.)
}

// Interface pour les statistiques
export interface ExpeditionStats {
  total: number;
  byStatus: Record<Expedition['status'], number>;
  byPriorite: Record<Expedition['priorite'], number>;
  byTransporteur: Record<string, number>;
  totalPoids: number;
  totalValeur: number;
  averageDeliveryTime: number;           // En jours
}

// Interface pour la création (sans champs auto-générés)
export type ExpeditionCreate = Omit<Expedition, 'id' | 'createdAt' | 'updatedAt'>;

// Interface pour la mise à jour (champs optionnels)
export type ExpeditionUpdate = Partial<Omit<Expedition, 'id' | 'reference' | 'createdAt' | 'createdBy'>>;

// Énumération pour les statuts
export const EXPEDITION_STATUS = {
  PREPARATION: 'preparation' as const,
  EN_COURS: 'en_cours' as const,
  ARRIVE: 'arrive' as const,
  LIVRE: 'livre' as const,
} as const;

// Configuration des statuts pour l'affichage
export const EXPEDITION_STATUS_CONFIG = {
  preparation: { 
    label: '📋 En préparation à l\'entrepôt', 
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Expédition en cours de préparation à l\'entrepôt'
  },
  en_cours: { 
    label: '🚢 En transit vers destination', 
    color: 'bg-green-100 text-green-800',
    description: 'Expédition en cours de transport'
  },
  arrive: { 
    label: '🛬 Arrivé à destination', 
    color: 'bg-green-100 text-green-800',
    description: 'Expédition arrivée au pays de destination'
  },
  livre: { 
    label: '✅ Livré aux destinataires', 
    color: 'bg-emerald-100 text-emerald-800',
    description: 'Expédition livrée avec succès'
  }
} as const;

// Configuration des priorités
export const EXPEDITION_PRIORITE_CONFIG = {
  normale: { 
    label: '📋 Priorité normale', 
    color: 'bg-gray-100 text-gray-800',
    description: 'Délai standard de livraison'
  },
  urgente: { 
    label: '⚡ Priorité urgente', 
    color: 'bg-orange-100 text-orange-800',
    description: 'Traitement prioritaire'
  },
  express: { 
    label: '🚀 Priorité express', 
    color: 'bg-red-100 text-red-800',
    description: 'Livraison la plus rapide possible'
  }
} as const;