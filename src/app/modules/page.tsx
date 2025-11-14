'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/hooks/useAuth';
import { SmartLink } from '@/components/smart-link';
import {
  Package,
  Headphones,
  DollarSign,
  Settings,
  BarChart3,
  MessageSquare,
  ShoppingCart,
  ArrowRight,
  Shield,
  Clock,
  TrendingUp,
  Loader2
} from 'lucide-react';
// TODO: Implement stats service with new UnifiedShipment structure
// import { getModulesStats, formatNumber, formatCurrency, type ModuleStats } from '@/services/stats.service';
type ModuleStats = any;

const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;
const formatNumber = (num: number) => num.toLocaleString('fr-FR');

interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  gradient: string;
  getStats?: (stats: ModuleStats) => {
    label: string;
    value: string;
  };
  permissions?: string[];
}

export default function ModulesPage() {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState<ModuleStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Charger les statistiques au montage du composant
  useEffect(() => {
    async function loadStats() {
      try {
        // TODO: Implement getModulesStats with new UnifiedShipment structure
        // const moduleStats = await getModulesStats();
        // setStats(moduleStats);
        setStats(null);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoadingStats(false);
      }
    }

    loadStats();
  }, []);

  const modules: Module[] = [
    {
      id: 'dashboard',
      title: 'Tableau de bord',
      description: 'Vue d\'ensemble de l\'activité et statistiques en temps réel',
      icon: BarChart3,
      href: '/dashboard',
      color: 'from-blue-500 to-blue-700',
      gradient: 'bg-gradient-to-br from-blue-50 to-blue-100',
      getStats: () => ({
        label: 'Vue globale',
        value: 'Temps réel'
      }),
      permissions: ['dashboard:view']
    },
    {
      id: 'logistic',
      title: 'Logistique',
      description: 'Gestion des colis, réception, préparation, expédition et suivi',
      icon: Package,
      href: '/logistic',
      color: 'from-green-500 to-green-700',
      gradient: 'bg-gradient-to-br from-green-50 to-green-100',
      getStats: (s) => ({
        label: 'Colis actifs',
        value: s.logistic.activeParcels > 0 ? `${s.logistic.activeParcels}` : '0'
      }),
      permissions: ['logistic:view']
    },
    {
      id: 'support',
      title: 'Support Client',
      description: 'Gestion des plaintes, tickets, chat en direct et base de connaissances',
      icon: Headphones,
      href: '/support',
      color: 'from-purple-500 to-purple-700',
      gradient: 'bg-gradient-to-br from-purple-50 to-purple-100',
      getStats: (s) => ({
        label: 'Tickets ouverts',
        value: s.support.openTickets > 0 ? `${s.support.openTickets}` : 'Aucun'
      }),
      permissions: ['support:view']
    },
    {
      id: 'finance',
      title: 'Finance',
      description: 'Facturation, paiements, rapports financiers et comptabilité',
      icon: DollarSign,
      href: '/finance',
      color: 'from-yellow-500 to-yellow-700',
      gradient: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
      getStats: (s) => ({
        label: 'CA mensuel',
        value: s.finance.monthlyRevenue > 0 ? formatCurrency(s.finance.monthlyRevenue) : '€0'
      }),
      permissions: ['finance:view']
    },
    {
      id: 'commercial',
      title: 'Commercial',
      description: 'CRM, pipeline de ventes, devis et gestion des clients',
      icon: ShoppingCart,
      href: '/commercial',
      color: 'from-orange-500 to-orange-700',
      gradient: 'bg-gradient-to-br from-orange-50 to-orange-100',
      getStats: (s) => ({
        label: 'Opportunités',
        value: s.commercial.activeOpportunities > 0 ? `${s.commercial.activeOpportunities}` : '0'
      }),
      permissions: ['commercial:view']
    },
    {
      id: 'settings',
      title: 'Administration',
      description: 'Gestion des utilisateurs, rôles, permissions et paramètres système',
      icon: Settings,
      href: '/settings/users',
      color: 'from-slate-500 to-slate-700',
      gradient: 'bg-gradient-to-br from-slate-50 to-slate-100',
      getStats: (s) => ({
        label: 'Utilisateurs',
        value: s.users.totalUsers > 0 ? `${s.users.totalUsers}` : '0'
      }),
      permissions: ['settings:view']
    }
  ];

  // Filtrer les modules selon les permissions
  const visibleModules = modules.filter(module => {
    if (!module.permissions || module.permissions.length === 0) return true;
    return module.permissions.some(permission => hasPermission(permission));
  });

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header - Couleur Befret officielle uniforme */}
        <div className="relative overflow-hidden rounded-2xl bg-[#1f981f] p-8 shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center p-2 shadow-lg">
                <img
                  src="/befret_logo.png"
                  alt="Befret Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  Befret Backoffice
                </h1>
                <p className="text-white/90 text-sm font-medium">
                  Logistique Europe-Congo
                </p>
              </div>
            </div>
            <p className="text-white/90 text-lg max-w-2xl">
              Bienvenue <span className="font-semibold">{user?.name || user?.email}</span>.
              Sélectionnez un module pour accéder à ses fonctionnalités.
            </p>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
        </div>

        {/* User info bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Rôle</p>
                <p className="font-semibold text-slate-900 capitalize">
                  {user?.role?.replace('_', ' ') || 'Utilisateur'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Dernière connexion</p>
                <p className="font-semibold text-slate-900">
                  {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Modules actifs</p>
                <p className="font-semibold text-slate-900">
                  {visibleModules.length} / {modules.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modules grid */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Modules disponibles</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleModules.map((module) => {
              const Icon = module.icon;
              return (
                <SmartLink key={module.id} href={module.href}>
                  <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-slate-300 cursor-pointer transform hover:-translate-y-1">
                    {/* Gradient background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                    {/* Content */}
                    <div className="relative p-6 space-y-4">
                      {/* Icon and title */}
                      <div className="flex items-start justify-between">
                        <div className={`w-14 h-14 rounded-xl ${module.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="h-7 w-7 text-slate-700" />
                        </div>

                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-all duration-300">
                          <ArrowRight className="h-4 w-4 text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>

                      {/* Title and description */}
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-slate-800 transition-colors mb-2">
                          {module.title}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {module.description}
                        </p>
                      </div>

                      {/* Stats */}
                      {module.getStats && (
                        <div className="pt-4 border-t border-slate-100">
                          {loadingStats ? (
                            <div className="flex items-center justify-center py-2">
                              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            </div>
                          ) : stats ? (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500 font-medium">
                                {module.getStats(stats).label}
                              </span>
                              <span className={`text-sm font-bold text-slate-700`}>
                                {module.getStats(stats).value}
                              </span>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 text-center">
                              Stats indisponibles
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Hover indicator */}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${module.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
                  </div>
                </SmartLink>
              );
            })}
          </div>
        </div>

        {/* No modules available */}
        {visibleModules.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun module disponible</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              Vous n'avez actuellement accès à aucun module. Contactez votre administrateur pour obtenir les permissions nécessaires.
            </p>
          </div>
        )}

        {/* Footer info */}
        <div className="bg-gradient-to-r from-slate-50 to-green-50 rounded-xl p-6 border border-slate-200">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Besoin d'aide ?</h3>
              <p className="text-sm text-slate-600 mb-3">
                Notre équipe est disponible 24/7 pour vous assister dans l'utilisation des modules.
              </p>
              <SmartLink href="/support">
                <button className="text-sm font-medium text-green-700 hover:text-green-800 flex items-center space-x-1 group">
                  <span>Contacter le support</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </SmartLink>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
