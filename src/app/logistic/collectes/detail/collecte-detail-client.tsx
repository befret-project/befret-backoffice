'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CollecteService } from '@/services/collecte';
import { Collecte, COLLECTE_STATUS_CONFIG, COLLECTE_PRIORITE_CONFIG, TYPE_COLLECTE_CONFIG } from '@/types/collecte';
import { 
  ArrowLeft,
  MapPin, 
  Package, 
  User, 
  Calendar, 
  Phone,
  Mail,
  Building,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Home,
  RefreshCw
} from 'lucide-react';






export default function CollecteDetailClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const collecteId = searchParams.get('id');
  
  const [collecte, setCollecte] = useState<Collecte | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollecte = async () => {
      if (!collecteId) {
        setError('ID de collecte manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const collecteData = await CollecteService.getById(collecteId);
        setCollecte(collecteData);
      } catch (err) {
        setError('Erreur lors du chargement de la collecte');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCollecte();
  }, [collecteId]);

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

  const getStatusBadge = (status: string) => {
    const config = COLLECTE_STATUS_CONFIG[status as keyof typeof COLLECTE_STATUS_CONFIG] || COLLECTE_STATUS_CONFIG.programmee;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.label}
      </Badge>
    );
  };

  const getPrioriteBadge = (priorite: string) => {
    const config = COLLECTE_PRIORITE_CONFIG[priorite as keyof typeof COLLECTE_PRIORITE_CONFIG] || COLLECTE_PRIORITE_CONFIG.normale;
    return (
      <Badge className={config.color} variant="outline">
        {config.label}
      </Badge>
    );
  };

  const getTypeInfo = (type: string) => {
    const config = TYPE_COLLECTE_CONFIG[type as keyof typeof TYPE_COLLECTE_CONFIG];
    return { label: config?.label || type };
  };

  const handleEdit = () => {
    if (collecte) {
      router.push(`/logistic/collectes/edit?id=${collecte.id}`);
    }
  };

  const handleDelete = async () => {
    if (collecte && confirm(`Êtes-vous sûr de vouloir supprimer la collecte ${collecte.reference} ?`)) {
      try {
        await CollecteService.delete(collecte.id!);
        router.push('/logistic/collectes');
      } catch (error) {
        console.error('Error deleting collecte:', error);
        alert('Erreur lors de la suppression de la collecte');
      }
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

  if (error || !collecte) {
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
                  {error || 'Collecte non trouvée'}
                </h3>
                <p className="text-gray-500">
                  Vérifiez l'ID de la collecte et réessayez.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const typeInfo = getTypeInfo(collecte.typeCollecte);

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
                  Détails de la Collecte
                </h1>
                <p className="text-slate-600 font-mono text-lg">
                  {collecte.reference}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
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
          {getStatusBadge(collecte.status)}
          {getPrioriteBadge(collecte.priorite)}
          <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
            {typeInfo.label}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations client */}
          <Card className="shadow-sm border-slate-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Informations Client</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Nom</p>
                <p className="font-medium text-lg">{collecte.client.nom}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a 
                    href={`mailto:${collecte.client.email}`}
                    className="text-green-600 hover:text-green-800 transition-colors"
                  >
                    {collecte.client.email}
                  </a>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Téléphone</p>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a 
                    href={`tel:${collecte.client.telephone}`}
                    className="text-green-600 hover:text-green-800 transition-colors"
                  >
                    {collecte.client.telephone}
                  </a>
                </div>
              </div>
              
              {collecte.client.entreprise && (
                <div>
                  <p className="text-sm text-gray-500">Entreprise</p>
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <p className="font-medium">{collecte.client.entreprise}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Adresse et planification */}
          <Card className="shadow-sm border-slate-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Adresse & Planification</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Adresse de collecte</p>
                <div className="space-y-1">
                  <p className="font-medium">{collecte.adresse.rue}</p>
                  <p className="text-gray-600">
                    {collecte.adresse.codePostal} {collecte.adresse.ville}
                  </p>
                  <p className="text-gray-600">{collecte.adresse.pays}</p>
                </div>
              </div>
              
              {collecte.datePrevue && (
                <div>
                  <p className="text-sm text-gray-500">Date prévue</p>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="font-medium">{formatDateOnly(collecte.datePrevue)}</p>
                  </div>
                </div>
              )}
              
              {collecte.heureCollecte && (
                <div>
                  <p className="text-sm text-gray-500">Heure prévue</p>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <p className="font-medium">{collecte.heureCollecte}</p>
                  </div>
                </div>
              )}
              
              {collecte.chauffeur && (
                <div>
                  <p className="text-sm text-gray-500">Chauffeur assigné</p>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <p className="font-medium">{collecte.chauffeur}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Détails de la collecte */}
          <Card className="shadow-sm border-slate-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Détails de la Collecte</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Référence</p>
                <p className="font-mono font-medium">{collecte.reference}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Nombre de colis</p>
                <p className="font-medium text-lg">{collecte.nbColis}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Poids total estimé</p>
                <p className="font-medium text-lg">{collecte.poidsTotal} kg</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Type de collecte</p>
                <div className="flex items-center space-x-2">
                  <p className="font-medium">{typeInfo.label}</p>
                </div>
              </div>
              
              {collecte.operateur && (
                <div>
                  <p className="text-sm text-gray-500">Opérateur</p>
                  <p className="font-medium">{collecte.operateur}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-500">Créé le</p>
                <p className="font-medium">{formatDate(collecte.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {collecte.notes && (
          <Card className="shadow-sm border-slate-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <span>Notes et Instructions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{collecte.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}