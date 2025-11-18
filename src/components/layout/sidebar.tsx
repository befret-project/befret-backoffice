'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { SmartLink } from '@/components/smart-link';
import { cn } from '@/lib/utils';
// import { hasPermission } from '@/lib/auth-config';
import {
  LayoutDashboard,
  Package,
  Headphones,
  DollarSign,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Truck,
  FileText,
  Clock,
  BarChart3,
  MessageSquare,
  BookOpen,
  Activity,
  CreditCard,
  Receipt,
  UserCheck,
  Shield,
  Database,
  Menu,
  X,
  LogOut,
  Grid
} from 'lucide-react';

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  // Page d'accueil - Vue d'ensemble de tous les modules
  {
    title: 'Accueil',
    href: '/modules',
    icon: Grid,
  },

  // Dashboard global - Statistiques générales
  {
    title: 'Dashboard Global',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard:view'
  },

  // Module Logistique avec ses fonctions
  {
    title: 'Logistique',
    icon: Package,
    permission: 'logistic:view',
    children: [
      {
        title: 'Dashboard Logistique',
        href: '/logistic',
        icon: LayoutDashboard,
        permission: 'logistic:view'
      },
      {
        title: 'Recherche de Colis',
        href: '/logistic/colis/search',
        icon: Package,
        permission: 'logistic:manage_parcels'
      },
      {
        title: 'Réception Départ',
        href: '/logistic/reception-depart/recherche',
        icon: Package,
        permission: 'logistic:manage_parcels'
      },
      {
        title: 'Préparation',
        href: '/logistic/colis/preparation',
        icon: Package,
        permission: 'logistic:manage_parcels'
      },
      {
        title: 'Tri des Colis',
        href: '/logistic/sorting',
        icon: Package,
        permission: 'logistic:manage_parcels'
      },
      {
        title: 'Créer un Groupage',
        href: '/logistic/colis/expedition',
        icon: Package,
        permission: 'logistic:manage_parcels'
      },
      {
        title: 'Liste des Groupages',
        href: '/logistic/groupages',
        icon: Truck,
        permission: 'logistic:manage_parcels'
      },
      {
        title: 'Collectes',
        href: '/logistic/collectes',
        icon: Clock,
        permission: 'logistic:manage_collectes'
      },
      {
        title: 'Rapports',
        href: '/logistic/reporting',
        icon: BarChart3,
        permission: 'logistic:view_reports'
      }
    ]
  },

  // Module Support
  {
    title: 'Support Client',
    icon: Headphones,
    permission: 'support:view',
    children: [
      {
        title: 'Dashboard Support',
        href: '/support',
        icon: LayoutDashboard,
        permission: 'support:view'
      },
      {
        title: 'Plaintes',
        href: '/support/plaintes',
        icon: MessageSquare,
        permission: 'support:manage_tickets'
      },
      {
        title: 'Base de connaissances',
        href: '/support/knowledge-base',
        icon: BookOpen,
        permission: 'support:manage_kb'
      },
      {
        title: 'Métriques',
        href: '/support/metrics',
        icon: Activity,
        permission: 'support:view_metrics'
      }
    ]
  },

  // Module Finance
  {
    title: 'Finance',
    icon: DollarSign,
    permission: 'finance:view',
    children: [
      {
        title: 'Dashboard Finance',
        href: '/finance',
        icon: LayoutDashboard,
        permission: 'finance:view'
      },
      {
        title: 'Facturation',
        href: '/finance/invoices',
        icon: Receipt,
        permission: 'finance:manage_invoices'
      },
      {
        title: 'Paiements',
        href: '/finance/payments',
        icon: CreditCard,
        permission: 'finance:view_reports'
      },
      {
        title: 'Rapports',
        href: '/finance/reports',
        icon: FileText,
        permission: 'finance:view_reports'
      }
    ]
  },

  // Module Commercial
  {
    title: 'Commercial',
    icon: Users,
    permission: 'commercial:view',
    children: [
      {
        title: 'Dashboard Commercial',
        href: '/commercial',
        icon: LayoutDashboard,
        permission: 'commercial:view'
      },
      {
        title: 'CRM',
        href: '/commercial/crm',
        icon: UserCheck,
        permission: 'commercial:manage_crm'
      },
      {
        title: 'Analytics',
        href: '/commercial/analytics',
        icon: BarChart3,
        permission: 'commercial:view_analytics'
      }
    ]
  },

  // Administration & Paramètres
  {
    title: 'Administration',
    icon: Settings,
    permission: 'settings:view',
    children: [
      {
        title: 'Dashboard Admin',
        href: '/administration',
        icon: LayoutDashboard,
        permission: 'settings:view'
      },
      {
        title: 'Utilisateurs',
        href: '/settings/users',
        icon: Users,
        permission: 'settings:manage_users'
      },
      {
        title: 'Rôles & Permissions',
        href: '/settings/roles',
        icon: Shield,
        permission: 'settings:manage_roles'
      },
      {
        title: 'Journal d\'audit',
        href: '/settings/audit',
        icon: FileText,
        permission: 'settings:view_audit'
      },
      {
        title: 'Configuration système',
        href: '/settings/system',
        icon: Database,
        permission: 'settings:manage_system'
      }
    ]
  },

  // Mon Compte - Available to all users
  {
    title: 'Mon Compte',
    href: '/settings',
    icon: UserCheck,
  }
];

export function Sidebar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Auto-expand menus containing the current page
  useEffect(() => {
    navigation.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => child.href === pathname);
        if (hasActiveChild && !expandedItems.includes(item.title)) {
          setExpandedItems(prev => [...prev, item.title]);
        }
      }
    });
  }, [pathname, expandedItems]);

  // const userPermissions = session?.user?.permissions || [];

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isItemVisible = (item: NavItem) => {
    if (!item.permission) return true;
    // return hasPermission(userPermissions, item.permission);
    return true; // Temporarily allow all items
  };

  const hasVisibleChildren = (item: NavItem) => {
    return item.children?.some(child => isItemVisible(child)) || false;
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    if (!isItemVisible(item) && !hasVisibleChildren(item)) {
      return null;
    }

    const Icon = item.icon;
    const isExpanded = expandedItems.includes(item.title);
    const hasChildren = item.children && item.children.length > 0;
    const isActive = item.href ? pathname === item.href : false;

    if (hasChildren) {
      const hasActiveChild = item.children?.some(child => child.href === pathname);
      return (
        <div key={item.title}>
          <button
            onClick={() => toggleExpanded(item.title)}
            className={cn(
              'w-full flex items-center justify-between p-3 text-left rounded-xl transition-all duration-200',
              'hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1',
              'touch-manipulation select-none group',
              hasActiveChild && 'bg-green-50/50 border border-green-200',
              level > 0 && 'pl-8'
            )}
          >
            <div className="flex items-center space-x-3">
              <Icon className={cn(
                'h-5 w-5 transition-colors',
                hasActiveChild ? 'text-green-600' : 'text-gray-500 group-hover:text-gray-700'
              )} />
              <span className={cn(
                'font-medium transition-colors',
                hasActiveChild ? 'text-green-700' : 'text-gray-700 group-hover:text-gray-900'
              )}>
                {item.title}
              </span>
            </div>
            {isExpanded ? (
              <ChevronDown className={cn(
                'h-4 w-4 transition-all duration-200',
                hasActiveChild ? 'text-green-600' : 'text-gray-400'
              )} />
            ) : (
              <ChevronRight className={cn(
                'h-4 w-4 transition-all duration-200',
                hasActiveChild ? 'text-green-600' : 'text-gray-400'
              )} />
            )}
          </button>
          {isExpanded && (
            <div className="ml-2 mt-1 space-y-1 border-l-2 border-slate-200 pl-2">
              {item.children?.map(child => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    if (!item.href) return null;

    return (
      <SmartLink
        key={item.title}
        href={item.href}
        onClick={() => setIsMobileOpen(false)}
        className={cn(
          'flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group relative',
          'hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1',
          'touch-manipulation select-none',
          isActive && 'bg-gradient-to-r from-green-50 to-green-50/30 text-green-700 border border-green-200 shadow-sm',
          level > 0 && 'pl-6 text-sm'
        )}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-600 rounded-r-full" />
        )}
        <Icon className={cn(
          'h-5 w-5 transition-colors flex-shrink-0',
          isActive ? 'text-green-600' : 'text-gray-500 group-hover:text-gray-700'
        )} />
        <span className={cn(
          'font-medium transition-colors',
          isActive ? 'text-green-700 font-semibold' : 'text-gray-700 group-hover:text-gray-900'
        )}>
          {item.title}
        </span>
      </SmartLink>
    );
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-white shadow-lg border border-slate-200 hover:bg-slate-50 transition-all duration-200 active:scale-95"
        aria-label={isMobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
      >
        {isMobileOpen ? <X className="h-5 w-5 text-slate-600" /> : <Menu className="h-5 w-5 text-slate-600" />}
      </button>

      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-40 w-72 sm:w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out border-r border-slate-200',
        'lg:translate-x-0',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          {/* Logo Header */}
          <div className="flex items-center h-16 px-4 bg-[#1f981f]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1.5 shadow-md">
                <img
                  src="/befret_logo.png"
                  alt="Befret Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Befret</h1>
                <p className="text-xs text-white/80">Backoffice</p>
              </div>
            </div>
          </div>

          {/* User info */}
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-[#1f981f] rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-base font-semibold">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#22A922] rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user?.name || user?.email}
                </p>
                <p className="text-xs bg-[#f8fff9] text-[#1f981f] px-3 py-1 rounded-full inline-block font-medium border border-[#1f981f]/20">
                  {user?.role?.replace('_', ' ') || 'Utilisateur'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            {navigation.map(item => renderNavItem(item))}
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
            {/* Logout button */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 rounded-xl transition-all duration-200 border border-red-200 hover:border-red-300 shadow-sm hover:shadow active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium text-sm">Déconnexion</span>
            </button>

            {/* Copyright */}
            <div className="text-center">
              <p className="text-xs text-slate-500">© 2024 Befret</p>
              <p className="text-xs text-slate-400">v1.0.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}