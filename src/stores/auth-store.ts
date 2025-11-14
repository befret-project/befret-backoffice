/**
 * AUTH STORE - Zustand State Management
 *
 * Store centralisé pour l'authentification et les permissions
 *
 * @version 1.0
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { BefretUser } from '@/lib/firebase-auth';
import { BackofficeRole } from '@/types/auth';

interface AuthState {
  // === USER DATA ===
  user: BefretUser | null;
  isAuthenticated: boolean;

  // === UI STATE ===
  isLoading: boolean;
  error: string | null;

  // === ACTIONS ===
  setUser: (user: BefretUser | null) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // === PERMISSION CHECKS ===
  hasPermission: (permission: string) => boolean;
  hasRole: (role: BackofficeRole) => boolean;
  canAccessModule: (module: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // === INITIAL STATE ===
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // === ACTIONS ===

        setUser: (user: BefretUser | null) => {
          set({
            user,
            isAuthenticated: !!user,
            error: null
          });
        },

        clearUser: () => {
          set({
            user: null,
            isAuthenticated: false,
            error: null
          });
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        setError: (error: string | null) => {
          set({ error });
        },

        // === PERMISSION CHECKS ===

        hasPermission: (permission: string) => {
          const { user } = get();
          if (!user) return false;
          return user.permissions.includes(permission);
        },

        hasRole: (role: BackofficeRole) => {
          const { user } = get();
          if (!user) return false;
          return user.role === role;
        },

        canAccessModule: (module: string) => {
          const { user } = get();
          if (!user) return false;

          // Module access mapping
          const modulePermissions: Record<string, string[]> = {
            reception: ['reception.scan', 'reception.view'],
            weighing: ['weighing.execute', 'weighing.view'],
            preparation: ['preparation.execute', 'preparation.view'],
            expedition: ['expedition.create', 'expedition.view'],
            delivery: ['delivery.execute', 'delivery.view'],
            administration: ['admin.users', 'admin.config'],
            reporting: ['reporting.view']
          };

          const requiredPermissions = modulePermissions[module] || [];
          return requiredPermissions.some((perm) => user.permissions.includes(perm));
        }
      }),
      {
        name: 'befret-auth',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated
        })
      }
    ),
    { name: 'AuthStore' }
  )
);

// === SELECTORS ===

export const selectUser = (state: AuthState) => state.user;

export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;

export const selectIsLoading = (state: AuthState) => state.isLoading;

export const selectError = (state: AuthState) => state.error;

export const selectUserRole = (state: AuthState) => state.user?.role;

export const selectUserPermissions = (state: AuthState) => state.user?.permissions || [];
