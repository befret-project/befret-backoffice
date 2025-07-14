'use client';

import { Suspense } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scale, ArrowLeft, Info } from 'lucide-react';
import { WeighingStationWrapper } from '@/components/logistic/weighing-station-wrapper';
import Link from 'next/link';

export default function WeighingStationPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/logistic/colis">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <Scale className="h-8 w-8 text-green-600" />
                <span>Station de Pesée Avancée</span>
              </h1>
              <p className="text-gray-600 mt-1">
                Réception avec pesée, calcul de supplément et génération de paiement
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Version 2.0
          </Badge>
        </div>

        {/* Informations importantes */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Info className="h-5 w-5" />
              <span>Fonctionnalités de la Station de Pesée</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-green-800">✅ Pesée Intelligente</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Validation automatique du poids</li>
                  <li>• Capture photo obligatoire de la balance</li>
                  <li>• Comparaison avec poids déclaré</li>
                  <li>• Calcul automatique des écarts</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-800">💰 Gestion Financière</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Calcul supplément si écart &gt; 200g</li>
                  <li>• Calcul remboursement si poids insuffisant</li>
                  <li>• Génération liens de paiement sécurisés</li>
                  <li>• Notifications automatiques clients</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">🎯 Workflow Optimisé</h4>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <span>Scanner</span>
                </div>
                <div className="flex-1 h-px bg-green-300"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <span>Peser</span>
                </div>
                <div className="flex-1 h-px bg-green-300"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <span>Facturer</span>
                </div>
                <div className="flex-1 h-px bg-green-300"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</div>
                  <span>Valider</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interface de réception avec station de pesée */}
        <Suspense fallback={
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-2">Chargement de la station de pesée...</span>
          </div>
        }>
          <WeighingStationWrapper />
        </Suspense>

        {/* Aide */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-gray-800">📚 Guide d'Utilisation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">🔍 Recherche</h4>
                <p className="text-gray-600">
                  Utilisez le scanner QR ou code-barres pour identifier le colis, 
                  ou saisissez manuellement le tracking ID.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">⚖️ Pesée</h4>
                <p className="text-gray-600">
                  Saisissez le poids réel, prenez une photo de la balance. 
                  Le système calcule automatiquement les suppléments.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">💳 Paiement</h4>
                <p className="text-gray-600">
                  Si un supplément est requis, générez un lien de paiement sécurisé 
                  pour le client.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}