'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  Scale, 
  Package,
  Clock,
  User,
  MapPin,
  FileText,
  Camera
} from 'lucide-react';
import { Parcel, SpecialCaseTypeEnum } from '@/types/parcel';

interface ParcelActionsProps {
  parcel: Parcel;
  actualWeight?: number;
  weightPhotos?: string[];
  onValidate: () => void;
  onSpecialCase: (caseType: SpecialCaseTypeEnum, reason: string) => void;
  onWeightDifference: () => void;
  loading?: boolean;
}

export function ParcelActions({ 
  parcel, 
  actualWeight, 
  weightPhotos = [], 
  onValidate, 
  onSpecialCase, 
  onWeightDifference,
  loading = false 
}: ParcelActionsProps) {
  const [showSpecialCaseModal, setShowSpecialCaseModal] = useState(false);
  const [selectedCaseType, setSelectedCaseType] = useState<SpecialCaseTypeEnum>('');
  const [caseReason, setCaseReason] = useState('');

  // Calculer l'écart de poids
  const getWeightVariance = () => {
    const declared = parcel.weightDeclared || parcel.weight || parcel.totalWeight || 0;
    const actual = actualWeight || 0;
    
    if (declared === 0 || actual === 0) return null;
    
    const difference = Math.abs(actual - declared);
    const percentage = (difference / declared) * 100;
    
    return {
      declared,
      actual,
      difference,
      percentage,
      hasIssue: difference > 0.2
    };
  };

  const variance = getWeightVariance();

  // Vérifier si toutes les conditions sont remplies pour validation
  const canValidate = () => {
    return actualWeight && 
           weightPhotos.length > 0 && 
           (!variance?.hasIssue || variance.difference <= 0.5);
  };

  // Vérifier si il y a un problème de poids nécessitant une action
  const hasWeightIssue = () => {
    return variance && variance.difference > 0.2;
  };

  // Vérifier si c'est un cas spécial critique
  const isCriticalCase = () => {
    return variance && variance.difference > 0.5;
  };

  const handleSpecialCase = (caseType: SpecialCaseTypeEnum) => {
    let defaultReason = '';
    
    switch (caseType) {
      case 'fragile':
        defaultReason = 'Colis marqué comme fragile nécessitant précautions spéciales';
        break;
      case 'dangerous':
        defaultReason = 'Marchandise dangereuse détectée';
        break;
      case 'oversized':
        defaultReason = 'Colis surdimensionné par rapport aux spécifications';
        break;
      case 'damaged':
        defaultReason = 'Dommages constatés lors de la réception';
        break;
      case 'payment_pending':
        defaultReason = 'Problème de paiement à résoudre';
        break;
      case 'customs_issue':
        defaultReason = 'Problème douanier nécessitant intervention';
        break;
      default:
        defaultReason = 'Cas spécial nécessitant attention particulière';
    }
    
    onSpecialCase(caseType, defaultReason);
    setShowSpecialCaseModal(false);
  };

  const specialCaseTypes: { value: SpecialCaseTypeEnum; label: string; description: string; color: string }[] = [
    { value: 'fragile', label: 'Fragile', description: 'Nécessite précautions spéciales', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'dangerous', label: 'Dangereux', description: 'Marchandise dangereuse', color: 'bg-red-100 text-red-800' },
    { value: 'oversized', label: 'Surdimensionné', description: 'Taille non conforme', color: 'bg-orange-100 text-orange-800' },
    { value: 'damaged', label: 'Endommagé', description: 'Dommages constatés', color: 'bg-red-100 text-red-800' },
    { value: 'payment_pending', label: 'Paiement en attente', description: 'Problème de paiement', color: 'bg-purple-100 text-purple-800' },
    { value: 'customs_issue', label: 'Problème douanier', description: 'Intervention douane requise', color: 'bg-green-100 text-green-800' },
    { value: 'high_value', label: 'Haute valeur', description: 'Valeur élevée - sécurité renforcée', color: 'bg-green-100 text-green-800' },
    { value: 'lost', label: 'Perdu', description: 'Colis introuvable', color: 'bg-gray-100 text-gray-800' },
    { value: 'returned', label: 'Retourné', description: 'Retour à l\'expéditeur', color: 'bg-indigo-100 text-indigo-800' }
  ];

  return (
    <div className="space-y-4">
      {/* Résumé du colis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Package className="h-5 w-5" />
            <span>Actions - {parcel.trackingID}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="font-medium">Expéditeur</p>
                <p className="text-gray-600">{parcel.sender_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <p className="font-medium">Destinataire</p>
                <p className="text-gray-600">{parcel.receiver_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Scale className="h-4 w-4 text-gray-500" />
              <div>
                <p className="font-medium">Poids</p>
                <p className="text-gray-600">
                  {actualWeight ? `${actualWeight} kg` : 'Non pesé'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Camera className="h-4 w-4 text-gray-500" />
              <div>
                <p className="font-medium">Photos</p>
                <p className="text-gray-600">{weightPhotos.length} photo(s)</p>
              </div>
            </div>
          </div>

          {/* Alerte écart de poids */}
          {variance && variance.hasIssue && (
            <Alert className="mt-4 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="font-semibold">Écart de poids détecté</div>
                <div className="text-sm mt-1">
                  Déclaré: {variance.declared} kg • Réel: {variance.actual} kg • 
                  Écart: {variance.difference.toFixed(1)} kg ({variance.percentage.toFixed(1)}%)
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Boutons d'action principaux */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Valider */}
        <Button
          onClick={onValidate}
          disabled={!canValidate() || loading}
          className={`h-20 text-lg font-semibold ${
            canValidate() 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            <CheckCircle className="h-6 w-6" />
            <span>Valider</span>
            {!canValidate() && (
              <span className="text-xs font-normal">
                {!actualWeight ? 'Pesée requise' : 
                 weightPhotos.length === 0 ? 'Photos requises' :
                 'Écart trop important'}
              </span>
            )}
          </div>
        </Button>

        {/* Cas spécial */}
        <Button
          onClick={() => setShowSpecialCaseModal(true)}
          disabled={loading}
          variant="outline"
          className="h-20 text-lg font-semibold border-2 border-yellow-300 hover:bg-yellow-50"
        >
          <div className="flex flex-col items-center space-y-2">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            <span className="text-yellow-700">Cas Spécial</span>
            <span className="text-xs font-normal text-yellow-600">
              Fragile, Dangereux, etc.
            </span>
          </div>
        </Button>

        {/* Différence de poids */}
        <Button
          onClick={onWeightDifference}
          disabled={!hasWeightIssue() || loading}
          className={`h-20 text-lg font-semibold ${
            hasWeightIssue()
              ? 'bg-orange-600 hover:bg-orange-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            <Scale className="h-6 w-6" />
            <span>Différence Poids</span>
            <span className="text-xs font-normal">
              {hasWeightIssue() ? `Écart: ${variance?.difference.toFixed(1)}kg` : 'Pas d\'écart'}
            </span>
          </div>
        </Button>
      </div>

      {/* Indicateurs de statut */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className={`p-3 rounded-lg border-2 ${
          actualWeight ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center space-x-2">
            <Scale className={`h-4 w-4 ${actualWeight ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${actualWeight ? 'text-green-700' : 'text-gray-500'}`}>
              Pesé
            </span>
          </div>
        </div>

        <div className={`p-3 rounded-lg border-2 ${
          weightPhotos.length > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center space-x-2">
            <Camera className={`h-4 w-4 ${weightPhotos.length > 0 ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${weightPhotos.length > 0 ? 'text-green-700' : 'text-gray-500'}`}>
              Photographié
            </span>
          </div>
        </div>

        <div className={`p-3 rounded-lg border-2 ${
          variance && !variance.hasIssue ? 'bg-green-50 border-green-200' : 
          variance && variance.hasIssue ? 'bg-orange-50 border-orange-200' : 
          'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center space-x-2">
            <CheckCircle className={`h-4 w-4 ${
              variance && !variance.hasIssue ? 'text-green-600' : 
              variance && variance.hasIssue ? 'text-orange-600' : 
              'text-gray-400'
            }`} />
            <span className={`text-sm font-medium ${
              variance && !variance.hasIssue ? 'text-green-700' : 
              variance && variance.hasIssue ? 'text-orange-700' : 
              'text-gray-500'
            }`}>
              Vérifié
            </span>
          </div>
        </div>

        <div className={`p-3 rounded-lg border-2 ${
          canValidate() ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center space-x-2">
            <Clock className={`h-4 w-4 ${canValidate() ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${canValidate() ? 'text-green-700' : 'text-gray-500'}`}>
              Prêt
            </span>
          </div>
        </div>
      </div>

      {/* Modal cas spécial */}
      {showSpecialCaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <span>Déclarer un Cas Spécial</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {specialCaseTypes.map((caseType) => (
                  <button
                    key={caseType.value}
                    onClick={() => handleSpecialCase(caseType.value)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-400 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{caseType.label}</span>
                      <Badge className={caseType.color}>
                        {caseType.value}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{caseType.description}</p>
                  </button>
                ))}
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowSpecialCaseModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}