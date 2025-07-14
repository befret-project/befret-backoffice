import { MainLayout } from '@/components/layout/main-layout';
import { ParcelReceptionForm } from '@/components/logistic/parcel-reception-form';
import { RecentReceptions } from '@/components/logistic/recent-receptions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scale, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ParcelReceptionPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header avec boutons d'accès */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Réception des Colis
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Scanner et enregistrer l&apos;arrivée des colis à l&apos;entrepôt
            </p>
          </div>
          
          {/* Boutons d'accès aux différentes interfaces */}
          <div className="flex items-center space-x-3">
            <Link href="/logistic/colis/reception-v2">
              <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                <Zap className="h-4 w-4 mr-2" />
                Interface Avancée
              </Button>
            </Link>
            
            <Link href="/logistic/colis/weighing-station">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Scale className="h-4 w-4 mr-2" />
                Station de Pesée
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Notification sur les nouvelles fonctionnalités */}
        <div className="bg-gradient-to-r from-green-50 to-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Scale className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Nouvelle Station de Pesée Disponible</span>
                <Badge className="bg-green-600 text-white">NOUVEAU</Badge>
              </div>
            </div>
            <div className="text-sm text-green-700">
              <span>Pesée automatisée • Calcul suppléments • Génération paiements</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ParcelReceptionForm />
          <RecentReceptions />
        </div>
      </div>
    </MainLayout>
  );
}