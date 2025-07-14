'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-config';
import { 
  Package, 
  MapPin, 
  Weight, 
  Search, 
  Truck
} from 'lucide-react';

interface ParcelForPreparation {
  id: string;
  trackingID: string;
  sender_name: string;
  receiver_name: string;
  destination: string;
  totalWeight?: number;
  actualWeight?: number;
  cost: number;
  status: string;
  logisticStatus?: string;
  create_date: string;
  receivedAt?: string;
  numberOfItems?: number;
  description?: string;
  type?: string;
}

export function ParcelPreparationList() {
  const [parcels, setParcels] = useState<ParcelForPreparation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('all');
  const [selectedParcels, setSelectedParcels] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchParcels = async () => {
      try {
        setLoading(true);
        console.log('Fetching parcels for preparation from Firestore...');
        
        // Récupérer les colis avec logisticStatus = 'received' (prêts à être préparés)
        // Note: Using simple query to avoid index requirements, will sort in memory
        const parcelsRef = collection(db, 'parcel');
        const q = query(
          parcelsRef,
          where('logisticStatus', '==', 'received')
        );

        const querySnapshot = await getDocs(q);
        const parcelsList: ParcelForPreparation[] = [];

        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          parcelsList.push({
            id: docSnapshot.id,
            trackingID: data.trackingID || '',
            sender_name: data.sender_name || '',
            receiver_name: data.receiver_name || '',
            destination: 'Congo-Kinshasa', // Destination par défaut
            totalWeight: data.totalWeight || 0,
            actualWeight: data.actualWeight,
            cost: data.cost || 0,
            status: data.status || 'pending',
            logisticStatus: data.logisticStatus || 'received',
            create_date: data.create_date || '',
            receivedAt: data.receivedAt,
            numberOfItems: data.numberOfItems || 1,
            description: data.description || '',
            type: data.type || 'Paquet'
          });
        });

        // Sort by receivedAt date in memory (newest first)
        parcelsList.sort((a, b) => {
          if (!a.receivedAt && !b.receivedAt) return 0;
          if (!a.receivedAt) return 1;
          if (!b.receivedAt) return -1;
          return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
        });

        console.log(`Found ${parcelsList.length} parcels ready for preparation`);
        setParcels(parcelsList);
      } catch (error) {
        console.error('Error fetching parcels for preparation:', error);
        setParcels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchParcels();
  }, []);

  const filteredParcels = parcels.filter(parcel => {
    const matchesSearch = parcel.trackingID.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         parcel.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         parcel.receiver_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDestination = selectedDestination === 'all' || parcel.destination === selectedDestination;
    
    return matchesSearch && matchesDestination;
  });

  const destinations = Array.from(new Set(parcels.map(p => p.destination)));

  const handleSelectParcel = (parcelId: string) => {
    const newSelected = new Set(selectedParcels);
    if (newSelected.has(parcelId)) {
      newSelected.delete(parcelId);
    } else {
      newSelected.add(parcelId);
    }
    setSelectedParcels(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedParcels.size === filteredParcels.length) {
      setSelectedParcels(new Set());
    } else {
      setSelectedParcels(new Set(filteredParcels.map(p => p.id)));
    }
  };

  const handleMarkForShipment = async () => {
    if (selectedParcels.size === 0) return;

    try {
      console.log('Marking parcels for shipment in Firestore:', Array.from(selectedParcels));
      
      // Mettre à jour chaque colis sélectionné dans Firestore
      const updatePromises = Array.from(selectedParcels).map(async (parcelId) => {
        const parcelRef = doc(db, 'parcel', parcelId);
        await updateDoc(parcelRef, {
          logisticStatus: 'ready_grouping',
          status: 'to_warehouse',
          preparedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      await Promise.all(updatePromises);
      
      // Retirer les colis marqués de la liste locale (ils ne sont plus "received")
      setParcels(prev => prev.filter(parcel => !selectedParcels.has(parcel.id)));
      
      setSelectedParcels(new Set());
      console.log(`Successfully marked ${updatePromises.length} parcels for shipment`);
    } catch (error) {
      console.error('Error marking parcels for shipment:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return <Badge className="bg-green-100 text-green-800">📥 Reçu à l'entrepôt</Badge>;
      case 'ready_for_shipment':
        return <Badge className="bg-green-100 text-green-800">📦 Prêt à expédier</Badge>;
      case 'sent':
        return <Badge className="bg-purple-100 text-purple-800">✈️ Expédié</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ En attente</Badge>;
      case 'to_warehouse':
        return <Badge className="bg-orange-100 text-orange-800">🚛 Vers entrepôt</Badge>;
      case 'delivered':
        return <Badge className="bg-emerald-100 text-emerald-800">✅ Livré</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Colis à Préparer</span>
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            {selectedParcels.size > 0 && (
              <Button onClick={handleMarkForShipment} className="bg-green-600 hover:bg-green-700">
                <Truck className="mr-2 h-4 w-4" />
                Marquer pour expédition ({selectedParcels.size})
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par numéro de suivi, expéditeur ou destinataire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            value={selectedDestination}
            onChange={(e) => setSelectedDestination(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">Toutes les destinations</option>
            {destinations.map(dest => (
              <option key={dest} value={dest}>{dest}</option>
            ))}
          </select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredParcels.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun colis à préparer</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Select all header */}
            <div className="flex items-center space-x-3 py-2 border-b">
              <input
                type="checkbox"
                checked={selectedParcels.size === filteredParcels.length && filteredParcels.length > 0}
                onChange={handleSelectAll}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-600">
                Sélectionner tout ({filteredParcels.length})
              </span>
            </div>

            {filteredParcels.map((parcel) => (
              <div 
                key={parcel.id} 
                className={`p-4 border rounded-lg transition-colors ${
                  selectedParcels.has(parcel.id) ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedParcels.has(parcel.id)}
                    onChange={() => handleSelectParcel(parcel.id)}
                    className="mt-1 rounded"
                  />
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Parcel info */}
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-mono font-semibold text-sm">
                          {parcel.trackingID}
                        </span>
                        {getStatusBadge(parcel.status)}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">De:</span> {parcel.sender_name}</p>
                        <p><span className="font-medium">Vers:</span> {parcel.receiver_name}</p>
                      </div>
                    </div>

                    {/* Destination & Weight */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{parcel.destination}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Weight className="h-4 w-4 text-gray-400" />
                        <span>{parcel.actualWeight || parcel.totalWeight || 0} kg</span>
                      </div>
                    </div>

                    {/* Items & Details */}
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        <div className="mb-1">
                          <span className="font-medium">Type:</span> {parcel.type || 'Paquet'}
                        </div>
                        <div className="mb-1">
                          <span className="font-medium">Articles:</span> {parcel.numberOfItems || 1}
                        </div>
                        {parcel.description && (
                          <div>
                            <span className="font-medium">Description:</span>
                            <p className="truncate mt-1 text-xs">{parcel.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}