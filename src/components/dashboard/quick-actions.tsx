'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Scan, 
  MessageSquare, 
  FileText, 
  Plus,
  Search,
  BarChart3,
  Users
} from 'lucide-react';
// import { hasPermission } from '@/lib/auth-config';

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  variant?: 'default' | 'outline';
}

export function QuickActions() {
  const { user, hasPermission } = useAuth();

  const actions: QuickAction[] = [
    {
      title: 'Scanner un colis',
      description: 'Enregistrer l\'arrivée d\'un colis',
      href: '/logistic/colis/reception',
      icon: Scan,
      permission: 'logistic.read'
    },
    {
      title: 'Créer un utilisateur',
      description: 'Ajouter un nouvel employé',
      href: '/settings/users',
      icon: Users,
      permission: 'admin.write'
    },
    {
      title: 'Nouveau ticket',
      description: 'Créer un ticket de support',
      href: '/support/plaintes',
      icon: MessageSquare,
      permission: 'support.write'
    },
    {
      title: 'Voir les rapports',
      description: 'Consulter les statistiques',
      href: '/logistic/reporting',
      icon: BarChart3,
      permission: 'logistic.read'
    },
    {
      title: 'Rechercher un colis',
      description: 'Tracking et suivi',
      href: '/logistic/colis/search',
      icon: Search,
      permission: 'logistic.read'
    },
    {
      title: 'Générer facture',
      description: 'Créer une nouvelle facture',
      href: '/finance/invoices',
      icon: FileText,
      permission: 'finance.write'
    }
  ];

  // Filtrer les actions selon les permissions utilisateur
  const visibleActions = actions.filter(action => 
    !action.permission || hasPermission(action.permission)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Actions Rapides</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {visibleActions.slice(0, 6).map((action, index) => {
            const Icon = action.icon;
            return (
              <Link href={action.href} key={index}>
                <Button
                  variant={action.variant || 'outline'}
                  className="h-auto p-4 justify-start w-full"
                >
                  <div className="flex items-start space-x-3">
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {action.description}
                      </div>
                    </div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>

        {visibleActions.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune action disponible avec vos permissions actuelles</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}