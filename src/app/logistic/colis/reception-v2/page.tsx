import { MainLayout } from '@/components/layout/main-layout';
import { EnhancedParcelReception } from '@/components/logistic/enhanced-parcel-reception';
import { RecentReceptions } from '@/components/logistic/recent-receptions';

export default function EnhancedReceptionPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Réception Avancée des Colis
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Interface complète avec scanner QR, pesée et validation
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-green-700 text-sm font-medium">
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                <span>Interface Tablette Optimisée</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Interface principale (2/3 de l'écran) */}
          <div className="xl:col-span-2">
            <EnhancedParcelReception />
          </div>
          
          {/* Panneau latéral (1/3 de l'écran) */}
          <div className="space-y-6">
            <RecentReceptions />
            
            {/* Aide rapide */}
            <div className="bg-gradient-to-r from-green-50 to-indigo-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3">🚀 Aide Rapide</h3>
              <div className="space-y-2 text-sm text-green-800">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Scanner QR ou saisir numéro</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Peser et photographier</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Valider ou signaler cas spécial</span>
                </div>
              </div>
            </div>
            
            {/* Statistiques rapides */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3">📊 Aujourd'hui</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">-</div>
                  <div className="text-green-600">Colis reçus</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">-</div>
                  <div className="text-green-600">Cas spéciaux</div>
                </div>
              </div>
            </div>
            
            {/* Raccourcis */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-3">⚡ Raccourcis</h3>
              <div className="space-y-2">
                <button className="w-full text-left text-sm text-purple-700 hover:bg-purple-100 p-2 rounded">
                  📦 Gestion QR Codes
                </button>
                <button className="w-full text-left text-sm text-purple-700 hover:bg-purple-100 p-2 rounded">
                  📊 Rapports Logistique
                </button>
                <button className="w-full text-left text-sm text-purple-700 hover:bg-purple-100 p-2 rounded">
                  ⚙️ Paramètres Scanner
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}