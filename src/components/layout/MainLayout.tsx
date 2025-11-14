/**
 * MAIN LAYOUT - Layout global avec sidebar et navigation
 *
 * @version 1.0
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import {
  Home,
  Package,
  Scale,
  ClipboardCheck,
  Plane,
  Truck,
  Archive,
  Search,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  permissions?: string[];
  badge?: number;
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearUser, hasPermission } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, toggleMobileMenu, closeMobileMenu } =
    useUIStore();

  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: <Home className="w-5 h-5" />,
      href: '/dashboard-new'
    },
    {
      id: 'reception',
      label: 'Réception',
      icon: <Package className="w-5 h-5" />,
      href: '/logistic/reception-depart/recherche',
      permissions: ['reception.view']
    },
    {
      id: 'weighing',
      label: 'Pesée',
      icon: <Scale className="w-5 h-5" />,
      href: '/logistic/colis/weighing-station',
      permissions: ['weighing.view']
    },
    {
      id: 'preparation',
      label: 'Préparation',
      icon: <ClipboardCheck className="w-5 h-5" />,
      href: '/logistic/colis/preparation',
      permissions: ['preparation.view']
    },
    {
      id: 'expedition',
      label: 'Expédition',
      icon: <Plane className="w-5 h-5" />,
      href: '/logistic/expeditions',
      permissions: ['expedition.view']
    },
    {
      id: 'delivery',
      label: 'Livraison',
      icon: <Truck className="w-5 h-5" />,
      href: '/logistic/delivery',
      permissions: ['delivery.view']
    },
    {
      id: 'reception-arrivee',
      label: 'Réception Arrivée',
      icon: <Archive className="w-5 h-5" />,
      href: '/logistic/reception-arrivee',
      permissions: ['reception_arrivee.view']
    },
    {
      id: 'search',
      label: 'Recherche',
      icon: <Search className="w-5 h-5" />,
      href: '/logistic/colis/search'
    },
    {
      id: 'reporting',
      label: 'Reporting',
      icon: <BarChart3 className="w-5 h-5" />,
      href: '/logistic/reporting',
      permissions: ['reporting.view']
    },
    {
      id: 'team',
      label: 'Équipe',
      icon: <Users className="w-5 h-5" />,
      href: '/logistic/team',
      permissions: ['admin.users']
    },
    {
      id: 'settings',
      label: 'Configuration',
      icon: <Settings className="w-5 h-5" />,
      href: '/logistic/settings',
      permissions: ['admin.config']
    }
  ];

  const accessibleNavItems = navItems.filter((item) => {
    if (!item.permissions) return true;
    return item.permissions.some((perm) => hasPermission(perm));
  });

  const handleLogout = async () => {
    clearUser();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 px-4 py-3 flex items-center justify-between">
        <button onClick={toggleMobileMenu} className="p-2 hover:bg-gray-100 rounded-lg">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <h1 className="text-lg font-semibold text-gray-900">BeFret Backoffice</h1>
        <button className="p-2 hover:bg-gray-100 rounded-lg relative">
          <Bell className="w-6 h-6" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:block fixed top-0 left-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-green-600">BeFret Backoffice</h1>
          )}
          <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 rounded-lg">
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {accessibleNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <button
                key={item.id}
                onClick={() => {
                  router.push(item.href);
                  closeMobileMenu();
                }}
                className={`w-full flex items-center px-4 py-3 transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-700 border-r-4 border-green-600'
                    : 'text-gray-700 hover:bg-gray-50'
                } ${sidebarCollapsed ? 'justify-center' : 'justify-start'}`}
              >
                <div className="flex-shrink-0">{item.icon}</div>
                {!sidebarCollapsed && <span className="ml-3 font-medium">{item.label}</span>}
                {!sidebarCollapsed && item.badge && item.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4">
          {!sidebarCollapsed && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
              sidebarCollapsed ? 'justify-center' : 'justify-start'
            }`}
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span className="ml-3 font-medium">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeMobileMenu} />
          <aside className="absolute top-14 left-0 bottom-0 w-64 bg-white">
            <nav className="flex-1 overflow-y-auto py-4">
              {accessibleNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      router.push(item.href);
                      closeMobileMenu();
                    }}
                    className={`w-full flex items-center px-4 py-3 transition-colors ${
                      isActive
                        ? 'bg-green-50 text-green-700 border-r-4 border-green-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {item.icon}
                    <span className="ml-3 font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-gray-200 p-4">
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="w-5 h-5" />
                <span className="ml-3 font-medium">Déconnexion</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main
        className={`min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        } pt-14 lg:pt-0`}
      >
        {children}
      </main>
    </div>
  );
}
