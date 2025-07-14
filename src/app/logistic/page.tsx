import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Package, 
  Truck, 
  Clock, 
  BarChart3,
  ArrowRight,
  Scan
} from 'lucide-react';

export default function LogisticHomePage() {
  const modules = [
    {
      title: 'Réception',
      description: 'Scanner et enregistrer l\'arrivée des colis',
      href: '/logistic/colis/reception',
      icon: Scan,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Préparation',
      description: 'Organiser les colis pour l\'expédition',
      href: '/logistic/colis/preparation',
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Expédition',
      description: 'Gérer les envois vers le Congo',
      href: '/logistic/colis/expedition',
      icon: Truck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Expéditions',
      description: 'Suivi des expéditions et transporteurs',
      href: '/logistic/expeditions',
      icon: Truck,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Collectes',
      description: 'Planning des tournées de collecte',
      href: '/logistic/collectes',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Rapports',
      description: 'Statistiques et analyses logistiques',
      href: '/logistic/reporting',
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Module Logistique
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestion complète de la chaîne logistique Befret
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${module.color}`} />
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{module.description}</p>
                  <Button asChild className="w-full">
                    <Link href={module.href}>
                      Accéder
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Colis Reçus Aujourd'hui</p>
                  <p className="text-2xl font-bold text-green-600">12</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Préparation</p>
                  <p className="text-2xl font-bold text-orange-600">8</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Prêts à Expédier</p>
                  <p className="text-2xl font-bold text-green-600">15</p>
                </div>
                <Truck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expédiés Cette Semaine</p>
                  <p className="text-2xl font-bold text-purple-600">127</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}