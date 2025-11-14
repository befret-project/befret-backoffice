/**
 * SHIPMENT STORE - Zustand State Management
 *
 * Store centralisé pour la gestion des expéditions dans le backoffice
 * Gère le cache, les recherches, et la synchronisation temps réel
 *
 * @version 1.0
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { UnifiedShipment } from '@/types/unified-shipment';

// Temporary compatibility types until full migration
type LogisticStage = 'reception' | 'preparation' | 'expedition' | 'delivery';
type ParcelSearchFilters = {
  status?: string;
  destination?: string;
  dateFrom?: string;
  dateTo?: string;
};
type ParcelSearchResult = {
  shipments: UnifiedShipment[];
  total: number;
};

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface ShipmentState {
  // === DATA ===
  shipments: Map<string, UnifiedShipment>; // Cache by trackingNumber
  searchResults: ParcelSearchResult | null;
  activeShipment: UnifiedShipment | null;

  // === UI STATE ===
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;

  // === FILTERS ===
  currentFilters: ParcelSearchFilters;

  // === ACTIONS - DATA MANAGEMENT ===
  setShipment: (shipment: UnifiedShipment) => void;
  setShipments: (shipments: UnifiedShipment[]) => void;
  updateShipment: (trackingNumber: string, updates: Partial<UnifiedShipment>) => void;
  removeShipment: (trackingNumber: string) => void;
  clearCache: () => void;

  // === ACTIONS - SEARCH ===
  setSearchResults: (results: ParcelSearchResult) => void;
  setFilters: (filters: Partial<ParcelSearchFilters>) => void;
  clearFilters: () => void;

  // === ACTIONS - ACTIVE SHIPMENT ===
  setActiveShipment: (shipment: UnifiedShipment | null) => void;
  loadShipmentByTracking: (trackingNumber: string) => Promise<UnifiedShipment | null>;

  // === ACTIONS - UI STATE ===
  setLoading: (loading: boolean) => void;
  setSearching: (searching: boolean) => void;
  setError: (error: string | null) => void;

  // === ACTIONS - LOGISTICS UPDATES ===
  updateLogisticStage: (trackingNumber: string, stage: LogisticStage, data: any) => void;

  // === HELPERS ===
  getShipmentByTracking: (trackingNumber: string) => UnifiedShipment | undefined;
  getShipmentsByStage: (stage: LogisticStage) => UnifiedShipment[];
  getShipmentsByDestination: (destination: 'Kinshasa' | 'Lubumbashi') => UnifiedShipment[];
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useShipmentStore = create<ShipmentState>()(
  devtools(
    persist(
      (set, get) => ({
        // === INITIAL STATE ===
        shipments: new Map(),
        searchResults: null,
        activeShipment: null,
        isLoading: false,
        isSearching: false,
        error: null,
        currentFilters: {},

        // === DATA MANAGEMENT ACTIONS ===

        setShipment: (shipment: UnifiedShipment) => {
          set((state) => {
            const newShipments = new Map(state.shipments);
            newShipments.set(shipment.trackingNumber, shipment);
            return { shipments: newShipments };
          });
        },

        setShipments: (shipments: UnifiedShipment[]) => {
          set(() => {
            const shipmentsMap = new Map<string, UnifiedShipment>();
            shipments.forEach((shipment) => {
              shipmentsMap.set(shipment.trackingNumber, shipment);
            });
            return { shipments: shipmentsMap };
          });
        },

        updateShipment: (trackingNumber: string, updates: Partial<UnifiedShipment>) => {
          set((state) => {
            const existing = state.shipments.get(trackingNumber);
            if (!existing) return state;

            const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
            const newShipments = new Map(state.shipments);
            newShipments.set(trackingNumber, updated);

            // Update activeShipment if it's the same
            const activeShipment =
              state.activeShipment?.trackingNumber === trackingNumber
                ? updated
                : state.activeShipment;

            return { shipments: newShipments, activeShipment };
          });
        },

        removeShipment: (trackingNumber: string) => {
          set((state) => {
            const newShipments = new Map(state.shipments);
            newShipments.delete(trackingNumber);

            // Clear activeShipment if it's the removed one
            const activeShipment =
              state.activeShipment?.trackingNumber === trackingNumber
                ? null
                : state.activeShipment;

            return { shipments: newShipments, activeShipment };
          });
        },

        clearCache: () => {
          set({
            shipments: new Map(),
            searchResults: null,
            activeShipment: null,
            error: null
          });
        },

        // === SEARCH ACTIONS ===

        setSearchResults: (results: ParcelSearchResult) => {
          set({ searchResults: results, isSearching: false });

          // Add results to cache
          results.shipments.forEach((shipment) => {
            get().setShipment(shipment);
          });
        },

        setFilters: (filters: Partial<ParcelSearchFilters>) => {
          set((state) => ({
            currentFilters: { ...state.currentFilters, ...filters }
          }));
        },

        clearFilters: () => {
          set({ currentFilters: {} });
        },

        // === ACTIVE SHIPMENT ACTIONS ===

        setActiveShipment: (shipment: UnifiedShipment | null) => {
          set({ activeShipment: shipment });
        },

        loadShipmentByTracking: async (trackingNumber: string) => {
          const cached = get().getShipmentByTracking(trackingNumber);
          if (cached) {
            get().setActiveShipment(cached);
            return cached;
          }

          // Load from API (implemented in service layer)
          get().setLoading(true);
          try {
            // This will be implemented by service layer
            // For now, return null
            return null;
          } catch (error) {
            console.error('Error loading shipment:', error);
            get().setError(error instanceof Error ? error.message : 'Error loading shipment');
            return null;
          } finally {
            get().setLoading(false);
          }
        },

        // === UI STATE ACTIONS ===

        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        setSearching: (searching: boolean) => {
          set({ isSearching: searching });
        },

        setError: (error: string | null) => {
          set({ error });
        },

        // === LOGISTICS UPDATE ACTIONS ===

        updateLogisticStage: (trackingNumber: string, stage: LogisticStage, data: any) => {
          set((state) => {
            const existing = state.shipments.get(trackingNumber);
            if (!existing) return state;

            // TODO: Adapt to new UnifiedShipment structure
            // The new structure uses currentPhase instead of logisticData stages
            const updated: UnifiedShipment = {
              ...existing,
              // Update timestamps (new structure)
              timestamps: {
                ...existing.timestamps,
                updatedAt: new Date()
              },
              // Update metadata if exists
              metadata: existing.metadata ? {
                ...existing.metadata,
                updatedAt: new Date()
              } : undefined
            };

            const newShipments = new Map(state.shipments);
            newShipments.set(trackingNumber, updated);

            const activeShipment =
              state.activeShipment?.trackingNumber === trackingNumber
                ? updated
                : state.activeShipment;

            return { shipments: newShipments, activeShipment };
          });
        },

        // === HELPER FUNCTIONS ===

        getShipmentByTracking: (trackingNumber: string) => {
          return get().shipments.get(trackingNumber);
        },

        getShipmentsByStage: (stage: LogisticStage) => {
          const shipments = Array.from(get().shipments.values());
          // TODO: Adapt to new UnifiedShipment.currentPhase instead of logisticData
          return shipments.filter((shipment) => {
            // Map LogisticStage to ShipmentPhase
            const phaseMap: Record<LogisticStage, string[]> = {
              'reception': ['WAREHOUSE'],
              'preparation': ['PREPARATION'],
              'expedition': ['BEFRET_TRANSIT'],
              'delivery': ['DELIVERED']
            };
            const validPhases = phaseMap[stage] || [];
            return validPhases.includes(shipment.currentPhase);
          });
        },

        getShipmentsByDestination: (destination: 'Kinshasa' | 'Lubumbashi') => {
          const shipments = Array.from(get().shipments.values());
          return shipments.filter(
            (shipment) => shipment.customerInfo.receiver.address.city === destination
          );
        }
      }),
      {
        name: 'befret-shipments',
        // Only persist cache, not UI state
        partialize: (state) => ({
          shipments: Array.from(state.shipments.entries()),
          currentFilters: state.currentFilters
        }),
        // Deserialize Map correctly
        onRehydrateStorage: () => (state) => {
          if (state && Array.isArray(state.shipments)) {
            state.shipments = new Map(state.shipments as any);
          }
        }
      }
    ),
    { name: 'ShipmentStore' }
  )
);

// ============================================================================
// SELECTORS (for performance optimization)
// ============================================================================

export const selectShipmentByTracking = (trackingNumber: string) => (state: ShipmentState) =>
  state.shipments.get(trackingNumber);

export const selectShipmentsByStage = (stage: LogisticStage) => (state: ShipmentState) =>
  state.getShipmentsByStage(stage);

export const selectShipmentsByDestination =
  (destination: 'Kinshasa' | 'Lubumbashi') => (state: ShipmentState) =>
    state.getShipmentsByDestination(destination);

export const selectActiveShipment = (state: ShipmentState) => state.activeShipment;

export const selectIsLoading = (state: ShipmentState) => state.isLoading;

export const selectError = (state: ShipmentState) => state.error;

export const selectSearchResults = (state: ShipmentState) => state.searchResults;

export const selectCurrentFilters = (state: ShipmentState) => state.currentFilters;
