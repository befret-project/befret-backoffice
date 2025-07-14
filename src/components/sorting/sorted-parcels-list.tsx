'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Filter, 
  Package, 
  MapPin, 
  Scale, 
  User, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Download,
  RefreshCw
} from 'lucide-react';

interface SortedParcel {
  id: string;
  trackingID: string;
  destination: string;
  weight: number;
  sortedAt: string;
  sortedBy: string;
  zone: string;
  receiver_name: string;
  specialCaseType: string;
  status: string;
}

export function SortedParcelsList() {
  const [parcels, setParcels] = useState<SortedParcel[]>([]);
  const [filteredParcels, setFilteredParcels] = useState<SortedParcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedParcels, setSelectedParcels] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchParcels = async () => {
      try {
        const response = await fetch('https://api-rcai6nfrla-uc.a.run.app/api/sorting/parcels', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setParcels(data);
        setFilteredParcels(data);
      } catch (err) {
        console.error('Error fetching sorted parcels:', err);
        setError('Erreur lors du chargement des colis');
      } finally {
        setLoading(false);
      }
    };

    fetchParcels();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchParcels, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = parcels;

    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(parcel => 
        parcel.trackingID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parcel.receiver_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrer par destination
    if (selectedDestination !== 'all') {
      filtered = filtered.filter(parcel => parcel.destination === selectedDestination);
    }

    // Filtrer par zone
    if (selectedZone !== 'all') {
      filtered = filtered.filter(parcel => parcel.zone === selectedZone);
    }

    setFilteredParcels(filtered);
  }, [parcels, searchTerm, selectedDestination, selectedZone]);

  const handleParcelSelection = (parcelId: string) => {
    setSelectedParcels(prev => 
      prev.includes(parcelId)
        ? prev.filter(id => id !== parcelId)
        : [...prev, parcelId]
    );
  };

  const handleSelectAll = () => {
    if (selectedParcels.length === filteredParcels.length) {
      setSelectedParcels([]);
    } else {
      setSelectedParcels(filteredParcels.map(p => p.id));
    }
  };

  const handleBatchAction = async (action: string) => {
    if (selectedParcels.length === 0) return;

    console.log(`Batch action: ${action} on ${selectedParcels.length} parcels`);
    // Ici vous pouvez implémenter les actions en lot
    // Par exemple, re-tri, validation, etc.
  };

  const handleExport = () => {
    const dataToExport = filteredParcels.map(parcel => ({
      'Code Suivi': parcel.trackingID,
      'Destinataire': parcel.receiver_name,
      'Destination': parcel.destination,
      'Zone': parcel.zone,
      'Poids': `${parcel.weight} kg`,
      'Trié le': new Date(parcel.sortedAt).toLocaleDateString('fr-FR'),
      'Trié par': parcel.sortedBy,
      'Statut': parcel.status
    }));

    const csv = [
      Object.keys(dataToExport[0]).join(','),
      ...dataToExport.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `colis_tries_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-green-100 text-green-800';
      case 'C': return 'bg-orange-100 text-orange-800';
      case 'D': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDestinationIcon = (destination: string) => {
    return <MapPin className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mt-2"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Colis triés</span>
            </CardTitle>
            <CardDescription>
              {filteredParcels.length} colis triés • {selectedParcels.length} sélectionnés
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={filteredParcels.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtres */}
        {showFilters && (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Rechercher</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Code ou destinataire..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Destination</label>
                <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="kinshasa">Kinshasa</SelectItem>
                    <SelectItem value="lubumbashi">Lubumbashi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Zone</label>
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="A">Zone A - Kinshasa</SelectItem>
                    <SelectItem value="B">Zone B - Lubumbashi</SelectItem>
                    <SelectItem value="C">Zone C - Cas spéciaux</SelectItem>
                    <SelectItem value="D">Zone D - Bloqués</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Actions en lot */}
        {selectedParcels.length > 0 && (
          <div className="border rounded-lg p-4 bg-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">
                  {selectedParcels.length} colis sélectionnés
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchAction('re-sort')}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Re-trier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchAction('validate')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Valider
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* En-tête de la liste */}
        <div className="flex items-center space-x-2 border-b pb-2">
          <Checkbox
            checked={selectedParcels.length === filteredParcels.length && filteredParcels.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm font-medium">Sélectionner tout</span>
        </div>

        {/* Liste des colis */}
        <div className="space-y-2">
          {filteredParcels.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun colis trié trouvé</p>
            </div>
          ) : (
            filteredParcels.map((parcel) => (
              <div
                key={parcel.id}
                className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                  selectedParcels.includes(parcel.id) ? 'bg-green-50 border-green-200' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedParcels.includes(parcel.id)}
                      onCheckedChange={() => handleParcelSelection(parcel.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-lg">{parcel.trackingID}</span>
                        <Badge className={getZoneColor(parcel.zone)}>
                          Zone {parcel.zone}
                        </Badge>
                        {parcel.specialCaseType && (
                          <Badge variant="outline" className="text-orange-600">
                            {parcel.specialCaseType}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{parcel.receiver_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {getDestinationIcon(parcel.destination)}
                          <span className="capitalize">{parcel.destination}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Scale className="h-3 w-3" />
                          <span>{parcel.weight} kg</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(parcel.sortedAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="text-xs mt-1">
                        Par {parcel.sortedBy}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination (si nécessaire) */}
        {filteredParcels.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-500">
              Affichage de {filteredParcels.length} colis
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}