/**
 * UI STORE - Zustand State Management
 *
 * Store centralisé pour l'état de l'interface utilisateur
 * Gère les toasts, modals, loading overlays, etc.
 *
 * @version 1.0
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // milliseconds, 0 = infinite
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface Modal {
  id: string;
  type: 'confirmation' | 'form' | 'info' | 'photo' | 'custom';
  title: string;
  content?: React.ReactNode | string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  data?: any;
}

export interface LoadingOverlay {
  id: string;
  message: string;
  progress?: number; // 0-100
  canCancel?: boolean;
  onCancel?: () => void;
}

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface UIState {
  // === TOASTS ===
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // === MODALS ===
  modals: Modal[];
  openModal: (modal: Omit<Modal, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  getTopModal: () => Modal | null;

  // === LOADING OVERLAYS ===
  loadingOverlays: LoadingOverlay[];
  showLoading: (overlay: Omit<LoadingOverlay, 'id'>) => string;
  updateLoading: (id: string, updates: Partial<Omit<LoadingOverlay, 'id'>>) => void;
  hideLoading: (id: string) => void;
  isLoading: () => boolean;

  // === SIDEBAR ===
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // === MOBILE MENU ===
  mobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      // === INITIAL STATE ===
      toasts: [],
      modals: [],
      loadingOverlays: [],
      sidebarCollapsed: false,
      mobileMenuOpen: false,

      // === TOAST ACTIONS ===

      addToast: (toast) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        const newToast: Toast = {
          id,
          ...toast,
          duration: toast.duration ?? 5000 // Default 5 seconds
        };

        set((state) => ({
          toasts: [...state.toasts, newToast]
        }));

        // Auto-remove after duration (if not infinite)
        if (newToast.duration && newToast.duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, newToast.duration);
        }

        return id;
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id)
        }));
      },

      clearToasts: () => {
        set({ toasts: [] });
      },

      // === MODAL ACTIONS ===

      openModal: (modal) => {
        const id = `modal-${Date.now()}-${Math.random()}`;
        const newModal: Modal = { id, ...modal };

        set((state) => ({
          modals: [...state.modals, newModal]
        }));

        return id;
      },

      closeModal: (id) => {
        set((state) => ({
          modals: state.modals.filter((m) => m.id !== id)
        }));
      },

      closeAllModals: () => {
        set({ modals: [] });
      },

      getTopModal: () => {
        const modals = get().modals;
        return modals.length > 0 ? modals[modals.length - 1] : null;
      },

      // === LOADING OVERLAY ACTIONS ===

      showLoading: (overlay) => {
        const id = `loading-${Date.now()}-${Math.random()}`;
        const newOverlay: LoadingOverlay = { id, ...overlay };

        set((state) => ({
          loadingOverlays: [...state.loadingOverlays, newOverlay]
        }));

        return id;
      },

      updateLoading: (id, updates) => {
        set((state) => ({
          loadingOverlays: state.loadingOverlays.map((overlay) =>
            overlay.id === id ? { ...overlay, ...updates } : overlay
          )
        }));
      },

      hideLoading: (id) => {
        set((state) => ({
          loadingOverlays: state.loadingOverlays.filter((o) => o.id !== id)
        }));
      },

      isLoading: () => {
        return get().loadingOverlays.length > 0;
      },

      // === SIDEBAR ACTIONS ===

      toggleSidebar: () => {
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed
        }));
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed });
      },

      // === MOBILE MENU ACTIONS ===

      toggleMobileMenu: () => {
        set((state) => ({
          mobileMenuOpen: !state.mobileMenuOpen
        }));
      },

      closeMobileMenu: () => {
        set({ mobileMenuOpen: false });
      }
    }),
    { name: 'UIStore' }
  )
);

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Hook pour afficher des toasts facilement
 */
export const useToast = () => {
  const addToast = useUIStore((state) => state.addToast);
  const removeToast = useUIStore((state) => state.removeToast);

  return {
    success: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'success', title, message, duration }),

    error: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'error', title, message, duration: duration ?? 0 }), // Errors stay by default

    warning: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'warning', title, message, duration }),

    info: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'info', title, message, duration }),

    remove: removeToast
  };
};

/**
 * Hook pour gérer les loading overlays
 */
export const useLoading = () => {
  const showLoading = useUIStore((state) => state.showLoading);
  const updateLoading = useUIStore((state) => state.updateLoading);
  const hideLoading = useUIStore((state) => state.hideLoading);

  return {
    show: (message: string, options?: { progress?: number; canCancel?: boolean; onCancel?: () => void }) =>
      showLoading({ message, ...options }),

    update: updateLoading,

    hide: hideLoading,

    /**
     * Wrapper pour exécuter une fonction async avec loading overlay
     */
    withLoading: async <T,>(
      message: string,
      fn: (updateProgress: (progress: number) => void) => Promise<T>
    ): Promise<T> => {
      const id = showLoading({ message, progress: 0 });

      try {
        const updateProgress = (progress: number) => {
          updateLoading(id, { progress });
        };

        const result = await fn(updateProgress);
        return result;
      } finally {
        hideLoading(id);
      }
    }
  };
};

// ============================================================================
// SELECTORS
// ============================================================================

export const selectToasts = (state: UIState) => state.toasts;

export const selectModals = (state: UIState) => state.modals;

export const selectLoadingOverlays = (state: UIState) => state.loadingOverlays;

export const selectSidebarCollapsed = (state: UIState) => state.sidebarCollapsed;

export const selectMobileMenuOpen = (state: UIState) => state.mobileMenuOpen;
