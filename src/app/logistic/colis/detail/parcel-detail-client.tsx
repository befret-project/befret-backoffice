'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Package, 
  User, 
  MapPin, 
  Weight,
  Calendar,
  Euro,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  Edit
} from 'lucide-react';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-config';
import { MainLayout } from '@/components/layout/main-layout';

interface ParcelDetail {
  id: string;
  trackingID: string;
  sender_name: string;
  receiver_name: string;
  status: string;
  logisticStatus?: string;
  create_date: string;
  payment_date?: string;
  cost: number;
  totalWeight?: number;
  actualWeight?: number;
  weightDifference?: number;
  numberOfItems?: number;
  type?: string;
  description?: string;
  pickupMethod?: string;
  uid?: string;
  mail2User?: string;
  notified?: boolean;
  receivedAt?: string;
  weighedAt?: string;
  groupedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  logisticHistory?: Array<{
    step: string;
    timestamp: string;
    agent: string;
    notes?: string;
  }>;
  photos?: {
    initial?: string[];
    reception?: string;
    balance?: string;
    grouping?: string;
    delivery?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

const statusLabels: { [key: string]: string } = {
  'draft': '📝 Brouillon non finalisé',
  'pending': '💳 Payé - En attente réception',
  'to_warehouse': '📦 Acheminé vers entrepôt Tubize',
  'from_warehouse_to_congo': '🚢 En route vers la RD Congo',
  'arrived_in_congo': '🛬 Arrivé en RD Congo',
  'delivered': '✅ Livré au destinataire'
};

const logisticStatusLabels: { [key: string]: string } = {
  'pending_reception': '⏳ En attente de réception',
  'received': '📥 Reçu à l\'entrepôt',
  'weighed': '⚖️ Pesé et contrôlé',
  'payment_pending': '💰 En attente règlement différence',
  'ready_grouping': '📋 Prêt pour groupage',
  'grouped': '📦 Groupé pour expédition',
  'shipped_rdc': '🚢 Expédié vers RD Congo',
  'delivered_final': '🏠 Livré au destinataire final'
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'to_warehouse':
    case 'from_warehouse_to_congo':
      return 'bg-green-100 text-green-800';
    case 'arrived_in_congo':
      return 'bg-purple-100 text-purple-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getLogisticStatusColor = (status: string) => {
  switch (status) {
    case 'received':
    case 'weighed':
    case 'delivered_final':
      return 'bg-green-100 text-green-800';
    case 'grouped':
    case 'shipped_rdc':
      return 'bg-green-100 text-green-800';
    case 'ready_grouping':
      return 'bg-purple-100 text-purple-800';
    case 'payment_pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'pending_reception':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

interface ParcelDetailClientProps {
  parcelId: string;
}

export function ParcelDetailClient({ parcelId }: ParcelDetailClientProps) {
  const router = useRouter();
  const [parcel, setParcel] = useState<ParcelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParcelDetails = async () => {
      if (!parcelId) return;

      try {
        setLoading(true);
        const parcelRef = doc(db, 'parcel', parcelId);
        const parcelDoc = await getDoc(parcelRef);

        if (!parcelDoc.exists()) {
          setError('Colis non trouvé');
          return;
        }

        const data = parcelDoc.data();
        const parcelDetail: ParcelDetail = {
          id: parcelDoc.id,
          trackingID: data.trackingID || '',
          sender_name: data.sender_name || '',
          receiver_name: data.receiver_name || '',
          status: data.status || 'pending',
          logisticStatus: data.logisticStatus,
          create_date: data.create_date || '',
          payment_date: data.payment_date,
          cost: data.cost || 0,
          totalWeight: data.totalWeight,
          actualWeight: data.actualWeight,
          weightDifference: data.weightDifference,
          numberOfItems: data.numberOfItems,
          type: data.type,
          description: data.description,
          pickupMethod: data.pickupMethod,
          uid: data.uid,
          mail2User: data.mail2User,
          notified: data.notified,
          receivedAt: data.receivedAt,
          weighedAt: data.weighedAt,
          groupedAt: data.groupedAt,
          shippedAt: data.shippedAt,
          deliveredAt: data.deliveredAt,
          logisticHistory: data.logisticHistory || [],
          photos: data.photos || {},
          location: data.location ? {
            latitude: data.location.latitude,
            longitude: data.location.longitude
          } : undefined
        };

        setParcel(parcelDetail);
      } catch (error) {
        console.error('Error fetching parcel details:', error);
        setError('Erreur lors du chargement des détails');
      } finally {
        setLoading(false);
      }
    };

    fetchParcelDetails();
  }, [parcelId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non défini';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (error || !parcel) {
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
                {error || 'Colis non trouvé'}
              </h3>
              <p className="text-gray-500">
                Vérifiez l'ID du colis et réessayez.
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
            <Button variant="outline" onClick={() => router.back()} className="self-start sm:self-auto h-10 px-4 rounded-xl border-slate-300 hover:border-green-500 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Détails du Colis
              </h1>
              <p className="text-slate-600 font-mono text-lg">
                {parcel.trackingID}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {parcel.logisticStatus === 'received' && (
              <Button asChild className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all duration-200">
                <Link href={`/logistic/colis/preparation?search=${parcel.trackingID}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Peser
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-3">
        <Badge className={`${getStatusColor(parcel.status)} px-4 py-2 text-sm font-medium rounded-full shadow-sm`}>
          {statusLabels[parcel.status] || parcel.status}
        </Badge>
        {parcel.logisticStatus && (
          <Badge className={`${getLogisticStatusColor(parcel.logisticStatus)} px-4 py-2 text-sm font-medium rounded-full shadow-sm`}>
            {logisticStatusLabels[parcel.logisticStatus] || parcel.logisticStatus}
          </Badge>
        )}
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
              <p className="text-sm text-gray-500">Numéro de tracking</p>
              <p className="font-medium">{parcel.trackingID}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-medium">{parcel.type || 'Paquet'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="font-medium">{parcel.description || 'Non spécifié'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nombre d'articles</p>
              <p className="font-medium">{parcel.numberOfItems || 1}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Coût</p>
              <p className="font-medium text-lg">{parcel.cost}€</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Méthode de récupération</p>
              <p className="font-medium">
                {parcel.pickupMethod === 'warehouse' ? 'Retrait entrepôt' : 'Livraison à domicile'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Expéditeur et Destinataire */}
        <Card className="shadow-sm border-slate-200 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Expéditeur & Destinataire</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">Expéditeur</h4>
              <div className="space-y-1">
                <p className="font-medium">{parcel.sender_name}</p>
                {parcel.mail2User && (
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Mail className="h-3 w-3" />
                    <span>{parcel.mail2User}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t border-gray-200"></div>
            
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">Destinataire</h4>
              <div className="space-y-1">
                <p className="font-medium">{parcel.receiver_name}</p>
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <MapPin className="h-3 w-3" />
                  <span>Destination Congo</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Poids et Dates */}
        <Card className="shadow-sm border-slate-200 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Weight className="h-5 w-5" />
              <span>Poids & Dates</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Poids déclaré</p>
              <p className="font-medium">{parcel.totalWeight || 0} kg</p>
            </div>
            {parcel.actualWeight && (
              <div>
                <p className="text-sm text-gray-500">Poids réel</p>
                <p className="font-medium">{parcel.actualWeight} kg</p>
              </div>
            )}
            {parcel.weightDifference && (
              <div>
                <p className="text-sm text-gray-500">Différence de poids</p>
                <p className={`font-medium ${parcel.weightDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {parcel.weightDifference > 0 ? '+' : ''}{parcel.weightDifference} kg
                </p>
              </div>
            )}
            
            <div className="border-t border-gray-200"></div>
            
            <div>
              <p className="text-sm text-gray-500">Date de création</p>
              <p className="font-medium">{formatDate(parcel.create_date)}</p>
            </div>
            {parcel.payment_date && (
              <div>
                <p className="text-sm text-gray-500">Date de paiement</p>
                <p className="font-medium">{formatDate(parcel.payment_date)}</p>
              </div>
            )}
            {parcel.receivedAt && (
              <div>
                <p className="text-sm text-gray-500">Reçu le</p>
                <p className="font-medium text-green-600">{formatDate(parcel.receivedAt)}</p>
              </div>
            )}
            {parcel.weighedAt && (
              <div>
                <p className="text-sm text-gray-500">Pesé le</p>
                <p className="font-medium">{formatDate(parcel.weighedAt)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historique logistique */}
      {parcel.logisticHistory && parcel.logisticHistory.length > 0 && (
        <Card className="shadow-sm border-slate-200 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Historique Logistique</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {parcel.logisticHistory.map((entry, index) => (
                <div key={index} className="flex items-start space-x-4 pb-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {entry.step}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(entry.timestamp)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">
                      Agent: {entry.agent}
                    </p>
                    {entry.notes && (
                      <p className="text-sm text-gray-500 mt-1">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </MainLayout>
  );
}