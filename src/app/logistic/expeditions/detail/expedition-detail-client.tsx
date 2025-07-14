'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExpeditionService } from '@/services/expedition';
import { Expedition, EXPEDITION_STATUS_CONFIG, EXPEDITION_PRIORITE_CONFIG } from '@/types/expedition';
import { 
  ArrowLeft,
  Truck, 
  MapPin, 
  Package, 
  User, 
  Calendar,
  Phone,
  Building,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Download,
  Euro
} from 'lucide-react';

const statusConfig = {
  preparation: { label: '📋 En préparation à l\'entrepôt', color: 'bg-yellow-100 text-yellow-800', icon: Package },
  en_cours: { label: '🚢 En transit vers destination', color: 'bg-green-100 text-green-800', icon: Truck },
  arrive: { label: '🛬 Arrivé à destination', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  livre: { label: '✅ Livré aux destinataires', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle }
};

const prioriteConfig = EXPEDITION_PRIORITE_CONFIG;

export default function ExpeditionDetailClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const expeditionId = searchParams.get('id');
  
  const [expedition, setExpedition] = useState<Expedition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpedition = async () => {
      if (!expeditionId) {
        setError('ID d\'expédition manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Utiliser le service Firebase
        const expeditionData = await ExpeditionService.getById(expeditionId);
        
        if (!expeditionData) {
          setError('Expédition non trouvée');
          return;
        }
        
        setExpedition(expeditionData);
      } catch (err) {
        setError('Erreur lors du chargement de l\'expédition');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchExpedition();
  }, [expeditionId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(1)} kg`;
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.preparation;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-4 w-4" />
        {config.label}
      </Badge>
    );
  };

  const getPrioriteBadge = (priorite: string) => {
    const config = prioriteConfig[priorite as keyof typeof prioriteConfig] || prioriteConfig.normale;
    return (
      <Badge className={config.color} variant="outline">
        {config.label}
      </Badge>
    );
  };

  const handleEdit = () => {
    if (expedition) {
      router.push(`/logistic/expeditions/edit?id=${expedition.id}`);
    }
  };

  const handleDelete = () => {
    if (expedition && confirm(`Êtes-vous sûr de vouloir supprimer l'expédition ${expedition.reference} ?`)) {
      // In real app, call delete API
      alert('Expédition supprimée (simulation)');
      router.push('/logistic/expeditions');
    }
  };

  const handleExport = () => {
    if (expedition) {
      // Simple CSV export
      const csvContent = [
        'Référence,Destination,Transporteur,Date départ,Statut,Nb colis,Poids,Valeur',
        `${expedition.reference},"${expedition.destination.ville}","${expedition.transporteur.nom}",${expedition.dateDepart},${statusConfig[expedition.status].label},${expedition.nbColis},${expedition.poids},${expedition.valeur}`
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `expedition_${expedition.reference}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" disabled>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !expedition) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
          <Card className="shadow-sm border-slate-200 rounded-2xl">
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {error || 'Expédition non trouvée'}
                </h3>
                <p className="text-gray-500">
                  Vérifiez l'ID de l'expédition et réessayez.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button 
                variant="outline" 
                onClick={() => router.back()} 
                className="self-start sm:self-auto h-10 px-4 rounded-xl border-slate-300 hover:border-green-500 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Détails de l'Expédition
                </h1>
                <p className="text-slate-600 font-mono text-lg">
                  {expedition.reference}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={handleExport}
                className="h-10 px-4 rounded-xl border-slate-300 hover:border-green-500 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button 
                variant="outline" 
                onClick={handleEdit}
                className="h-10 px-4 rounded-xl border-slate-300 hover:border-green-500 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDelete}
                className="h-10 px-4 rounded-xl border-red-300 hover:border-red-500 text-red-600 hover:text-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>
        </div>

        {/* Status and Priority Badges */}
        <div className="flex flex-wrap gap-3">
          {getStatusBadge(expedition.status)}
          {getPrioriteBadge(expedition.priorite)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations générales */}
          <Card className="shadow-sm border-slate-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Informations Générales</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Référence</p>
                <p className="font-mono font-medium text-lg">{expedition.reference}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Tracking</p>
                <p className="font-mono font-medium">{expedition.tracking}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Responsable</p>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <p className="font-medium">{expedition.responsable}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Nombre de colis</p>
                <p className="font-medium text-2xl text-green-600">{expedition.nbColis}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Poids total</p>
                <p className="font-medium text-lg">{formatWeight(expedition.poids)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Valeur déclarée</p>
                <p className="font-medium text-lg text-green-600">{formatCurrency(expedition.valeur)}</p>
              </div>
              
              {expedition.conteneur && (
                <div>
                  <p className="text-sm text-gray-500">Conteneur</p>
                  <p className="font-mono font-medium">{expedition.conteneur}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Destination */}
          <Card className="shadow-sm border-slate-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Destination</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Ville</p>
                <p className="font-medium text-lg">{expedition.destination.ville}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Pays</p>
                <p className="font-medium">{expedition.destination.pays}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Adresse</p>
                <p className="font-medium">{expedition.destination.adresse}</p>
              </div>
              
              <div className="pt-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-900">Itinéraire</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Belgique → {expedition.destination.ville}, {expedition.destination.pays}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transporteur */}
          <Card className="shadow-sm border-slate-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Transporteur</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Compagnie</p>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <p className="font-medium text-lg">{expedition.transporteur.nom}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Contact</p>
                <p className="font-medium">{expedition.transporteur.contact}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Téléphone</p>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a 
                    href={`tel:${expedition.transporteur.telephone}`}
                    className="text-green-600 hover:text-green-800 transition-colors font-medium"
                  >
                    {expedition.transporteur.telephone}
                  </a>
                </div>
              </div>
              
              <div className="pt-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-900">Statut transporteur</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Partenaire vérifié et certifié
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Planning et dates */}
        <Card className="shadow-sm border-slate-200 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Planning et Dates</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-2">Créé le</p>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="font-medium">{formatDate(expedition.createdAt)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-2">Date de départ</p>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-green-400" />
                  <p className="font-medium text-green-700">{formatDateOnly(expedition.dateDepart)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-2">Arrivée prévue</p>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-400" />
                  <p className="font-medium text-orange-700">{formatDateOnly(expedition.dateArriveePrevu)}</p>
                </div>
              </div>
              
              {expedition.dateArriveeReelle && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Arrivée réelle</p>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <p className="font-medium text-green-700">{formatDateOnly(expedition.dateArriveeReelle)}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {expedition.notes && (
          <Card className="shadow-sm border-slate-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <span>Notes et Instructions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{expedition.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}