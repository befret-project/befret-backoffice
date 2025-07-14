'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Package, 
  Search, 
  Filter, 
  Plus,
  Eye,
  Edit,
  Truck,
  Weight,
  MapPin,
  Calendar,
  RefreshCw,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  CheckCircle,
  Clock,
  User,
  FileText,
  Download
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-config';
import Link from 'next/link';

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
  pickupMethod?: string;
  priority?: 'normale' | 'urgente' | 'express';
}

type SortField = 'trackingID' | 'sender_name' | 'receiver_name' | 'destination' | 'receivedAt' | 'totalWeight' | 'cost' | 'status';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  status: string;
  destination: string;
  priority: string;
  pickupMethod: string;
  weightRange: string;
  dateRange: string;
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

const priorityConfig = {
  normale: { label: '📋 Priorité normale', color: 'bg-gray-100 text-gray-800' },
  urgente: { label: '⚡ Priorité urgente', color: 'bg-orange-100 text-orange-800' },
  express: { label: '🚀 Priorité express', color: 'bg-red-100 text-red-800' }
};

export default function PreparationPage() {
  const [parcels, setParcels] = useState<ParcelForPreparation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Professional filtering state
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    destination: '',
    priority: '',
    pickupMethod: '',
    weightRange: '',
    dateRange: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('receivedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selection state
  const [selectedParcels, setSelectedParcels] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Modal state
  const [selectedParcel, setSelectedParcel] = useState<ParcelForPreparation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchParcels = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📦 [Préparation] Fetching parcels for preparation from Firestore...');
      
      // Récupérer les colis avec logisticStatus = 'received' (prêts à être préparés)
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
          destination: data.receiver?.city || 'Congo-Kinshasa',
          totalWeight: data.totalWeight || 0,
          actualWeight: data.actualWeight,
          cost: data.cost || 0,
          status: data.status || 'pending',
          logisticStatus: data.logisticStatus || 'received',
          create_date: data.create_date || '',
          receivedAt: data.receivedAt,
          numberOfItems: data.numberOfItems || 1,
          description: data.description || '',
          type: data.type || 'Paquet',
          pickupMethod: data.pickupMethod || 'warehouse',
          priority: data.priority || 'normale'
        });
      });

      // Sort by receivedAt date in memory (newest first)
      parcelsList.sort((a, b) => {
        if (!a.receivedAt && !b.receivedAt) return 0;
        if (!a.receivedAt) return 1;
        if (!b.receivedAt) return -1;
        return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
      });

      console.log(`✅ [Préparation] Found ${parcelsList.length} parcels ready for preparation`);
      setParcels(parcelsList);
    } catch (error) {
      console.error('❌ [Préparation] Error fetching parcels for preparation:', error);
      setParcels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParcels();
  }, [fetchParcels]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectParcel = (parcelId: string) => {
    setSelectedParcels(prev => 
      prev.includes(parcelId) 
        ? prev.filter(id => id !== parcelId)
        : [...prev, parcelId]
    );
  };

  const handleSelectAll = () => {
    const currentPageParcels = getCurrentPageItems();
    if (selectedParcels.length === currentPageParcels.length) {
      setSelectedParcels([]);
      setSelectAll(false);
    } else {
      setSelectedParcels(currentPageParcels.map(p => p.id));
      setSelectAll(true);
    }
  };

  const handleMarkForShipment = async () => {
    if (selectedParcels.length === 0) return;

    try {
      console.log('🚛 [Préparation] Marking parcels for shipment:', selectedParcels);
      
      const updatePromises = selectedParcels.map(async (parcelId) => {
        const parcelRef = doc(db, 'parcel', parcelId);
        await updateDoc(parcelRef, {
          logisticStatus: 'ready_grouping',
          status: 'to_warehouse',
          preparedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      await Promise.all(updatePromises);
      
      // Remove marked parcels from the list
      setParcels(prev => prev.filter(parcel => !selectedParcels.includes(parcel.id)));
      setSelectedParcels([]);
      setSelectAll(false);
      
      console.log(`✅ [Préparation] Successfully marked ${updatePromises.length} parcels for shipment`);
    } catch (error) {
      console.error('❌ [Préparation] Error marking parcels for shipment:', error);
    }
  };

  const applyFilters = (parcelsList: ParcelForPreparation[]) => {
    return parcelsList.filter(parcel => {
      const matchesSearch = !searchTerm || 
        parcel.trackingID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parcel.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parcel.receiver_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !filters.status || parcel.status === filters.status;
      const matchesDestination = !filters.destination || parcel.destination === filters.destination;
      const matchesPriority = !filters.priority || parcel.priority === filters.priority;
      const matchesPickupMethod = !filters.pickupMethod || parcel.pickupMethod === filters.pickupMethod;

      // Weight range filter
      const matchesWeight = !filters.weightRange || (() => {
        const weight = parcel.actualWeight || parcel.totalWeight || 0;
        switch (filters.weightRange) {
          case 'light': return weight < 5;
          case 'medium': return weight >= 5 && weight < 20;
          case 'heavy': return weight >= 20;
          default: return true;
        }
      })();

      return matchesSearch && matchesStatus && matchesDestination && 
             matchesPriority && matchesPickupMethod && matchesWeight;
    });
  };

  const applySorting = (parcelsList: ParcelForPreparation[]) => {
    return [...parcelsList].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'receivedAt') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getFilteredAndSortedParcels = () => {
    let result = applyFilters(parcels);
    result = applySorting(result);
    return result;
  };

  const getCurrentPageItems = () => {
    const filteredParcels = getFilteredAndSortedParcels();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredParcels.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filteredParcels = getFilteredAndSortedParcels();
    return Math.ceil(filteredParcels.length / itemsPerPage);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  const currentPageItems = getCurrentPageItems();
  const totalItems = getFilteredAndSortedParcels().length;

  const getTabCounts = () => {
    return {
      all: parcels.length,
      received: parcels.filter(p => p.logisticStatus === 'received').length,
      weighed: parcels.filter(p => p.logisticStatus === 'weighed').length,
      ready: parcels.filter(p => p.logisticStatus === 'ready_grouping').length
    };
  };

  const tabCounts = getTabCounts();

  const handleViewDetails = (parcel: ParcelForPreparation) => {
    setSelectedParcel(parcel);
    setShowDetailsModal(true);
  };

  const handleExportCSV = () => {
    const dataToExport = getFilteredAndSortedParcels();
    const headers = [
      'Numéro de suivi',
      'Expéditeur',
      'Destinataire',
      'Destination',
      'Statut',
      'Statut logistique',
      'Coût',
      'Poids déclaré',
      'Poids réel',
      'Date réception',
      'Type',
      'Méthode livraison'
    ];

    const csvContent = [
      headers.join(','),
      ...dataToExport.map(parcel => [
        parcel.trackingID,
        `"${parcel.sender_name}"`,
        `"${parcel.receiver_name}"`,
        `"${parcel.destination}"`,
        statusLabels[parcel.status] || parcel.status,
        logisticStatusLabels[parcel.logisticStatus || ''] || parcel.logisticStatus,
        parcel.cost,
        parcel.totalWeight || 0,
        parcel.actualWeight || 0,
        parcel.receivedAt || '',
        parcel.type || '',
        parcel.pickupMethod === 'warehouse' ? 'Point relais' : 'Domicile'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `colis_preparation_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des colis à préparer...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Préparation des Expéditions</h1>
            <p className="text-gray-600 mt-2">Organiser et préparer les colis pour l'expédition vers le Congo</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchParcels} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            {selectedParcels.length > 0 && (
              <Button onClick={handleMarkForShipment} className="bg-green-600 hover:bg-green-700">
                <Truck className="h-4 w-4 mr-2" />
                Marquer pour expédition ({selectedParcels.length})
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Colis</p>
                  <p className="text-2xl font-bold text-green-600">{parcels.length}</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Reçus</p>
                  <p className="text-2xl font-bold text-green-600">{tabCounts.received}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pesés</p>
                  <p className="text-2xl font-bold text-purple-600">{tabCounts.weighed}</p>
                </div>
                <Weight className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Prêts</p>
                  <p className="text-2xl font-bold text-orange-600">{tabCounts.ready}</p>
                </div>
                <Truck className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres et Recherche
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Masquer' : 'Afficher'} filtres avancés
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="search">Recherche</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Numéro de suivi, expéditeur, destinataire..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="items-per-page">Éléments par page</Label>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t">
                  <div>
                    <Label>Statut</Label>
                    <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les statuts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tous les statuts</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="to_warehouse">Vers entrepôt</SelectItem>
                        <SelectItem value="from_warehouse_to_congo">Vers Congo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Priorité</Label>
                    <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes priorités" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Toutes priorités</SelectItem>
                        <SelectItem value="normale">Normale</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                        <SelectItem value="express">Express</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Méthode livraison</Label>
                    <Select value={filters.pickupMethod} onValueChange={(value) => setFilters(prev => ({ ...prev, pickupMethod: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes méthodes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Toutes méthodes</SelectItem>
                        <SelectItem value="warehouse">Point relais</SelectItem>
                        <SelectItem value="home_delivery">Domicile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Poids</Label>
                    <Select value={filters.weightRange} onValueChange={(value) => setFilters(prev => ({ ...prev, weightRange: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous poids" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tous poids</SelectItem>
                        <SelectItem value="light">&lt; 5 kg</SelectItem>
                        <SelectItem value="medium">5-20 kg</SelectItem>
                        <SelectItem value="heavy">&gt; 20 kg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setFilters({ status: '', destination: '', priority: '', pickupMethod: '', weightRange: '', dateRange: '' })}
                    >
                      Réinitialiser
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Colis à Préparer ({totalItems})</CardTitle>
                <CardDescription>
                  Colis reçus en attente de préparation pour expédition
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('trackingID')}>
                      <div className="flex items-center gap-1">
                        N° Suivi
                        {getSortIcon('trackingID')}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('sender_name')}>
                      <div className="flex items-center gap-1">
                        Expéditeur
                        {getSortIcon('sender_name')}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('receiver_name')}>
                      <div className="flex items-center gap-1">
                        Destinataire
                        {getSortIcon('receiver_name')}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('destination')}>
                      <div className="flex items-center gap-1">
                        Destination
                        {getSortIcon('destination')}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('totalWeight')}>
                      <div className="flex items-center gap-1">
                        Poids
                        {getSortIcon('totalWeight')}
                      </div>
                    </TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('receivedAt')}>
                      <div className="flex items-center gap-1">
                        Reçu le
                        {getSortIcon('receivedAt')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPageItems.map((parcel) => (
                    <TableRow key={parcel.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedParcels.includes(parcel.id)}
                          onCheckedChange={() => handleSelectParcel(parcel.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono font-medium">
                        {parcel.trackingID}
                      </TableCell>
                      <TableCell>{parcel.sender_name}</TableCell>
                      <TableCell>{parcel.receiver_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {parcel.destination}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Weight className="h-4 w-4 text-gray-400" />
                          {parcel.actualWeight || parcel.totalWeight || 0} kg
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge className="bg-green-100 text-green-800">
                            {logisticStatusLabels[parcel.logisticStatus || 'received']}
                          </Badge>
                          <div>
                            <Badge variant="outline" className="text-xs">
                              {statusLabels[parcel.status] || parcel.status}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{formatDate(parcel.receivedAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(parcel)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/logistic/colis/detail?id=${parcel.id}`}>
                              <Edit className="h-4 w-4 mr-1" />
                              Éditer
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {getTotalPages() > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-gray-700">
                  Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems} résultats
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} sur {getTotalPages()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(getTotalPages(), prev + 1))}
                    disabled={currentPage === getTotalPages()}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {currentPageItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun colis à préparer trouvé</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails du Colis</DialogTitle>
              <DialogDescription>
                Informations complètes du colis {selectedParcel?.trackingID}
              </DialogDescription>
            </DialogHeader>
            {selectedParcel && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Numéro de suivi</Label>
                    <p className="font-mono font-medium">{selectedParcel.trackingID}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Type</Label>
                    <p>{selectedParcel.type}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Expéditeur</Label>
                    <p>{selectedParcel.sender_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Destinataire</Label>
                    <p>{selectedParcel.receiver_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Destination</Label>
                    <p>{selectedParcel.destination}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Méthode livraison</Label>
                    <p>{selectedParcel.pickupMethod === 'warehouse' ? 'Point relais' : 'Domicile'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Poids déclaré</Label>
                    <p>{selectedParcel.totalWeight} kg</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Poids réel</Label>
                    <p>{selectedParcel.actualWeight || 'Non pesé'} kg</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Coût</Label>
                    <p className="font-medium text-green-600">{formatCurrency(selectedParcel.cost)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nombre d'articles</Label>
                    <p>{selectedParcel.numberOfItems}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Reçu le</Label>
                    <p>{formatDate(selectedParcel.receivedAt)}</p>
                  </div>
                </div>

                {selectedParcel.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Description</Label>
                    <p className="text-sm text-gray-700">{selectedParcel.description}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Badge className="bg-green-100 text-green-800">
                    {logisticStatusLabels[selectedParcel.logisticStatus || 'received']}
                  </Badge>
                  <Badge variant="outline">
                    {statusLabels[selectedParcel.status] || selectedParcel.status}
                  </Badge>
                  {selectedParcel.priority && (
                    <Badge className={priorityConfig[selectedParcel.priority]?.color}>
                      {priorityConfig[selectedParcel.priority]?.label}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Fermer
              </Button>
              <Button asChild>
                <Link href={`/logistic/colis/detail?id=${selectedParcel?.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Éditer
                </Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}