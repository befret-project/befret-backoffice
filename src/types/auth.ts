// Authentication and authorization types for the backoffice

export interface BackofficeUser {
  uid: string;
  email: string;
  displayName?: string;
  role: BackofficeRole;
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export enum BackofficeRole {
  SUPER_ADMIN = 'super_admin',
  LOGISTIC_MANAGER = 'logistic_manager',
  LOGISTIC_OPERATOR = 'logistic_operator',
  SUPPORT_MANAGER = 'support_manager',
  SUPPORT_AGENT = 'support_agent',
  FINANCE_MANAGER = 'finance_manager',
  COMMERCIAL_MANAGER = 'commercial_manager'
}

export enum Permission {
  // Dashboard permissions
  DASHBOARD_VIEW = 'dashboard:view',
  
  // Logistic permissions
  LOGISTIC_VIEW = 'logistic:view',
  LOGISTIC_MANAGE_PARCELS = 'logistic:manage_parcels',
  LOGISTIC_SCAN_PARCELS = 'logistic:scan_parcels',
  LOGISTIC_UPDATE_STATUS = 'logistic:update_status',
  LOGISTIC_VIEW_REPORTS = 'logistic:view_reports',
  LOGISTIC_MANAGE_COLLECTES = 'logistic:manage_collectes',
  
  // Support permissions
  SUPPORT_VIEW = 'support:view',
  SUPPORT_MANAGE_TICKETS = 'support:manage_tickets',
  SUPPORT_VIEW_METRICS = 'support:view_metrics',
  SUPPORT_MANAGE_KB = 'support:manage_knowledge_base',
  
  // Finance permissions
  FINANCE_VIEW = 'finance:view',
  FINANCE_VIEW_REPORTS = 'finance:view_reports',
  FINANCE_MANAGE_INVOICES = 'finance:manage_invoices',
  
  // Commercial permissions
  COMMERCIAL_VIEW = 'commercial:view',
  COMMERCIAL_MANAGE_CRM = 'commercial:manage_crm',
  COMMERCIAL_VIEW_ANALYTICS = 'commercial:view_analytics',
  
  // Settings permissions
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_MANAGE_USERS = 'settings:manage_users',
  SETTINGS_MANAGE_ROLES = 'settings:manage_roles',
  SETTINGS_VIEW_AUDIT = 'settings:view_audit',
  SETTINGS_MANAGE_SYSTEM = 'settings:manage_system'
}

export const ROLE_PERMISSIONS: Record<BackofficeRole, Permission[]> = {
  [BackofficeRole.SUPER_ADMIN]: Object.values(Permission),
  
  [BackofficeRole.LOGISTIC_MANAGER]: [
    Permission.DASHBOARD_VIEW,
    Permission.LOGISTIC_VIEW,
    Permission.LOGISTIC_MANAGE_PARCELS,
    Permission.LOGISTIC_SCAN_PARCELS,
    Permission.LOGISTIC_UPDATE_STATUS,
    Permission.LOGISTIC_VIEW_REPORTS,
    Permission.LOGISTIC_MANAGE_COLLECTES,
    Permission.SETTINGS_VIEW
  ],
  
  [BackofficeRole.LOGISTIC_OPERATOR]: [
    Permission.DASHBOARD_VIEW,
    Permission.LOGISTIC_VIEW,
    Permission.LOGISTIC_SCAN_PARCELS,
    Permission.LOGISTIC_UPDATE_STATUS
  ],
  
  [BackofficeRole.SUPPORT_MANAGER]: [
    Permission.DASHBOARD_VIEW,
    Permission.SUPPORT_VIEW,
    Permission.SUPPORT_MANAGE_TICKETS,
    Permission.SUPPORT_VIEW_METRICS,
    Permission.SUPPORT_MANAGE_KB,
    Permission.SETTINGS_VIEW
  ],
  
  [BackofficeRole.SUPPORT_AGENT]: [
    Permission.DASHBOARD_VIEW,
    Permission.SUPPORT_VIEW,
    Permission.SUPPORT_MANAGE_TICKETS
  ],
  
  [BackofficeRole.FINANCE_MANAGER]: [
    Permission.DASHBOARD_VIEW,
    Permission.FINANCE_VIEW,
    Permission.FINANCE_VIEW_REPORTS,
    Permission.FINANCE_MANAGE_INVOICES,
    Permission.SETTINGS_VIEW
  ],
  
  [BackofficeRole.COMMERCIAL_MANAGER]: [
    Permission.DASHBOARD_VIEW,
    Permission.COMMERCIAL_VIEW,
    Permission.COMMERCIAL_MANAGE_CRM,
    Permission.COMMERCIAL_VIEW_ANALYTICS,
    Permission.SETTINGS_VIEW
  ]
};

export interface AuthSession {
  user: BackofficeUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ============================================
// Two-Factor Authentication (2FA) Types
// ============================================

export interface TwoFactorSecret {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
}

export interface TwoFactorSetupResponse {
  success: boolean;
  secret?: TwoFactorSecret;
  backupCodes?: string[];
  message?: string;
}

export interface TwoFactorVerifyRequest {
  userId: string;
  token: string;
}

export interface TwoFactorVerifyResponse {
  success: boolean;
  valid: boolean;
  message?: string;
}

export interface TwoFactorEnableRequest {
  userId: string;
  token: string;
  secret: string;
}

export interface TwoFactorEnableResponse {
  success: boolean;
  enabled: boolean;
  backupCodes: string[];
  message?: string;
}

export interface TwoFactorDisableRequest {
  userId: string;
  password: string;
}

export interface TwoFactorDisableResponse {
  success: boolean;
  message?: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
  enrolledAt?: string;
  lastUsedAt?: string;
  backupCodesRemaining?: number;
}

export interface UserTwoFactorData {
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorEnrolledAt?: string;
  twoFactorLastUsedAt?: string;
  backupCodes?: string[];
}

export interface LoginWithTwoFactorRequest {
  email: string;
  password: string;
  token?: string;
}

export interface LoginWithTwoFactorResponse {
  success: boolean;
  requiresTwoFactor: boolean;
  userId?: string;
  tempToken?: string;
  message?: string;
}