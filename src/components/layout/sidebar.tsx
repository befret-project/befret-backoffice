'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
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
  X
} from 'lucide-react';

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard:view'
  },
  {
    title: 'Logistique',
    icon: Package,
    permission: 'logistic:view',
    children: [
      {
        title: 'Réception',
        href: '/logistic/colis/reception',
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
        title: 'Expédition',
        href: '/logistic/colis/expedition',
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
  {
    title: 'Support',
    icon: Headphones,
    permission: 'support:view',
    children: [
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
  {
    title: 'Finance',
    icon: DollarSign,
    permission: 'finance:view',
    children: [
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
  {
    title: 'Commercial',
    icon: Users,
    permission: 'commercial:view',
    children: [
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
  {
    title: 'Paramètres',
    icon: Settings,
    permission: 'settings:view',
    children: [
      {
        title: 'Utilisateurs',
        href: '/settings/users',
        icon: Users,
        permission: 'settings:manage_users'
      },
      {
        title: 'Rôles',
        href: '/settings/roles',
        icon: Shield,
        permission: 'settings:manage_roles'
      },
      {
        title: 'Audit',
        href: '/settings/audit',
        icon: FileText,
        permission: 'settings:view_audit'
      },
      {
        title: 'Système',
        href: '/settings/system',
        icon: Database,
        permission: 'settings:manage_system'
      }
    ]
  }
];

export function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // const userPermissions = session?.user?.permissions || [];

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
      return (
        <div key={item.title}>
          <button
            onClick={() => toggleExpanded(item.title)}
            className={cn(
              'w-full flex items-center justify-between p-4 text-left rounded-xl transition-all duration-200',
              'hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1',
              'touch-manipulation select-none',
              level > 0 && 'pl-8'
            )}
          >
            <div className="flex items-center space-x-3">
              <Icon className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {item.title}
              </span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-4 space-y-1">
              {item.children?.map(child => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    if (!item.href) return null;

    return (
      <Link
        key={item.title}
        href={item.href}
        onClick={() => setIsMobileOpen(false)}
        className={cn(
          'flex items-center space-x-3 p-4 rounded-xl transition-all duration-200',
          'hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1',
          'touch-manipulation select-none',
          isActive && 'bg-green-50 text-green-700 border border-green-200 shadow-sm',
          level > 0 && 'pl-8'
        )}
      >
        <Icon className={cn(
          'h-5 w-5',
          isActive ? 'text-green-600' : 'text-gray-500'
        )} />
        <span className={cn(
          'font-medium',
          isActive ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-200'
        )}>
          {item.title}
        </span>
      </Link>
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
          <div className="flex items-center h-16 px-4 bg-gradient-to-r from-green-600 to-green-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Befret</h1>
                <p className="text-xs text-green-100">Backoffice</p>
              </div>
            </div>
          </div>

          {/* User info */}
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-base font-semibold">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user?.name || user?.email}
                </p>
                <p className="text-xs text-slate-500 bg-green-100 text-green-700 px-3 py-1 rounded-full inline-block font-medium">
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
          <div className="p-4 border-t border-slate-200 bg-slate-50/50">
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