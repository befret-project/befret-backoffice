'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Package, 
  Clock, 
  MapPin, 
  User, 
  Weight,
  Eye,
  Edit,
  Truck,
  CheckCircle,
  AlertCircle,
  XCircle,
  Filter,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Download,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-config';
import { MainLayout } from '@/components/layout/main-layout';
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

interface ParcelData {
  id: string;
  trackingID: string;
  sender_name: string;
  receiver_name: string;
  status: string;
  logisticStatus?: string;
  create_date: string;
  cost: number;
  totalWeight?: number;
  actualWeight?: number;
  receivedAt?: string;
  weighedAt?: string;
  destination?: string;
  deliveredAt?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveryAddress?: string;
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
  'delivered_final': '🏠 Livré au destinataire final',
  'pending': '⏳ En attente de traitement',
  'prepared': '📋 Préparé pour expédition',
  'shipped': '🚚 Expédié'
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'from_warehouse_to_congo':
    case 'arrived_in_congo':
      return 'bg-green-100 text-green-800';
    case 'to_warehouse':
      return 'bg-yellow-100 text-yellow-800';
    case 'pending':
      return 'bg-orange-100 text-orange-800';
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getLogisticStatusColor = (status?: string) => {
  switch (status) {
    case 'shipped':
      return 'bg-green-100 text-green-800';
    case 'prepared':
      return 'bg-green-100 text-green-800';
    case 'weighed':
      return 'bg-purple-100 text-purple-800';
    case 'received':
      return 'bg-yellow-100 text-yellow-800';
    case 'pending':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'delivered':
      return CheckCircle;
    case 'from_warehouse_to_congo':
    case 'arrived_in_congo':
      return Truck;
    case 'to_warehouse':
      return Package;
    case 'pending':
      return Clock;
    case 'draft':
      return AlertCircle;
    default:
      return XCircle;
  }
};

type SortField = 'create_date' | 'trackingID' | 'sender_name' | 'status' | 'cost' | 'totalWeight';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  status: string;
  logisticStatus: string;
  dateRange: string;
  minCost: string;
  maxCost: string;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || '';
  
  // États de base
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(true);
  
  // États pour pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  
  // États pour tri
  const [sortField, setSortField] = useState<SortField>('create_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // États pour filtres
  const [filters, setFilters] = useState<FilterState>({
    status: statusFilter || 'all',
    logisticStatus: 'all',
    dateRange: '',
    minCost: '',
    maxCost: ''
  });
  
  // États pour sélection
  const [selectedParcels, setSelectedParcels] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadParcels();
  }, [sortField, sortDirection, filters, currentPage]);

  useEffect(() => {
    // Reset page when filters change
    setCurrentPage(1);
  }, [filters, searchTerm]);

  const loadParcels = async (page: number = currentPage) => {
    setLoading(true);
    
    try {
      const parcelsRef = collection(db, 'parcel');
      
      // Stratégie simplifiée : récupérer tous les colis et filtrer côté client
      // pour éviter les problèmes d'index Firestore
      let baseQuery;
      
      // Si on a un seul filtre simple, on peut l'utiliser
      if (filters.status && filters.status !== 'all' && (!filters.logisticStatus || filters.logisticStatus === 'all')) {
        baseQuery = query(parcelsRef, where('status', '==', filters.status));
      } else if (filters.logisticStatus && filters.logisticStatus !== 'all' && (!filters.status || filters.status === 'all')) {
        baseQuery = query(parcelsRef, where('logisticStatus', '==', filters.logisticStatus));
      } else {
        // Sinon, récupérer tous les colis
        baseQuery = query(parcelsRef);
      }
      
      const querySnapshot = await getDocs(baseQuery);
      
      // Filtrage côté client de tous les critères
      const allFilteredParcels: ParcelData[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Appliquer tous les filtres côté client
        
        // Filtre par statut
        if (filters.status && filters.status !== 'all' && data.status !== filters.status) {
          return;
        }
        
        // Filtre par statut logistique
        if (filters.logisticStatus && filters.logisticStatus !== 'all' && data.logisticStatus !== filters.logisticStatus) {
          return;
        }
        
        // Filtrage par recherche textuelle
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const matches = 
            data.trackingID?.toLowerCase().includes(searchLower) ||
            data.sender_name?.toLowerCase().includes(searchLower) ||
            data.receiver_name?.toLowerCase().includes(searchLower);
          if (!matches) return;
        }
        
        // Filtrage par coût
        if (filters.minCost && data.cost < parseFloat(filters.minCost)) return;
        if (filters.maxCost && data.cost > parseFloat(filters.maxCost)) return;
        
        allFilteredParcels.push({
          id: doc.id,
          trackingID: data.trackingID || '',
          sender_name: data.sender_name || '',
          receiver_name: data.receiver_name || '',
          status: data.status || 'pending',
          logisticStatus: data.logisticStatus,
          create_date: data.create_date || '',
          cost: data.cost || 0,
          totalWeight: data.totalWeight,
          actualWeight: data.actualWeight,
          receivedAt: data.receivedAt,
          weighedAt: data.weighedAt,
          destination: data.destination || 'Congo-Kinshasa',
          deliveredAt: data.deliveredAt,
          estimatedDelivery: data.estimatedDelivery,
          shippedAt: data.shippedAt,
          deliveryAddress: data.deliveryAddress
        });
      });
      
      // Tri côté client
      allFilteredParcels.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
          case 'trackingID':
            aValue = a.trackingID || '';
            bValue = b.trackingID || '';
            break;
          case 'sender_name':
            aValue = a.sender_name || '';
            bValue = b.sender_name || '';
            break;
          case 'status':
            aValue = a.status || '';
            bValue = b.status || '';
            break;
          case 'cost':
            aValue = a.cost || 0;
            bValue = b.cost || 0;
            break;
          case 'totalWeight':
            aValue = a.totalWeight || a.actualWeight || 0;
            bValue = b.totalWeight || b.actualWeight || 0;
            break;
          case 'create_date':
          default:
            aValue = new Date(a.create_date || 0).getTime();
            bValue = new Date(b.create_date || 0).getTime();
            break;
        }
        
        if (typeof aValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sortDirection === 'asc' ? comparison : -comparison;
        } else {
          const comparison = aValue - bValue;
          return sortDirection === 'asc' ? comparison : -comparison;
        }
      });
      
      // Pagination côté client
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedParcels = allFilteredParcels.slice(startIndex, endIndex);
      
      setParcels(paginatedParcels);
      setTotalItems(allFilteredParcels.length);
      
      console.log(`📦 Page ${page}: ${paginatedParcels.length} colis affichés sur ${allFilteredParcels.length} total`);
    } catch (error) {
      console.error('Error loading parcels:', error);
      
      // En cas d'erreur, essayer une requête simple sans filtres
      try {
        console.log('🔄 Tentative de récupération simple...');
        const simpleQuery = query(collection(db, 'parcel'));
        const simpleSnapshot = await getDocs(simpleQuery);
        
        const simpleParcels: ParcelData[] = [];
        simpleSnapshot.forEach((doc) => {
          const data = doc.data();
          simpleParcels.push({
            id: doc.id,
            trackingID: data.trackingID || '',
            sender_name: data.sender_name || '',
            receiver_name: data.receiver_name || '',
            status: data.status || 'pending',
            logisticStatus: data.logisticStatus,
            create_date: data.create_date || '',
            cost: data.cost || 0,
            totalWeight: data.totalWeight,
            actualWeight: data.actualWeight,
            receivedAt: data.receivedAt,
            weighedAt: data.weighedAt,
            destination: data.destination || 'Congo-Kinshasa',
            deliveredAt: data.deliveredAt,
            estimatedDelivery: data.estimatedDelivery,
            shippedAt: data.shippedAt,
            deliveryAddress: data.deliveryAddress
          });
        });
        
        setParcels(simpleParcels.slice(0, itemsPerPage));
        setTotalItems(simpleParcels.length);
        console.log(`✅ Récupération simple réussie: ${simpleParcels.length} colis`);
      } catch (fallbackError) {
        console.error('Fallback query failed:', fallbackError);
        setParcels([]);
        setTotalItems(0);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fonctions utilitaires
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadParcels(1);
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      logisticStatus: 'all',
      dateRange: '',
      minCost: '',
      maxCost: ''
    });
    setSearchTerm('');
  };

  // Fonctions d'export
  const handleExportSelected = () => {
    if (selectedParcels.size === 0) {
      alert('Aucun colis sélectionné pour l\'export');
      return;
    }

    const selectedData = parcels.filter(parcel => selectedParcels.has(parcel.id));
    const csvContent = generateCSV(selectedData);
    downloadCSV(csvContent, `colis_selection_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportAll = () => {
    const csvContent = generateCSV(parcels);
    downloadCSV(csvContent, `colis_tous_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const generateCSV = (data: ParcelData[]) => {
    const headers = [
      'Numéro de suivi',
      'Expéditeur',
      'Destinataire',
      'Statut',
      'Statut logistique',
      'Coût',
      'Poids total',
      'Poids réel',
      'Date création',
      'Date réception',
      'Destination'
    ];

    const csvRows = [
      headers.join(','),
      ...data.map(parcel => [
        parcel.trackingID,
        `"${parcel.sender_name}"`,
        `"${parcel.receiver_name}"`,
        statusLabels[parcel.status] || parcel.status,
        logisticStatusLabels[parcel.logisticStatus || ''] || parcel.logisticStatus,
        parcel.cost,
        parcel.totalWeight || 0,
        parcel.actualWeight || 0,
        parcel.create_date,
        parcel.receivedAt || '',
        `"${parcel.destination || ''}"`
      ].join(','))
    ];

    return csvRows.join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fonction pour marquer comme traités
  const handleMarkAsProcessed = async () => {
    if (selectedParcels.size === 0) {
      alert('Aucun colis sélectionné');
      return;
    }

    try {
      // Mise à jour des colis sélectionnés
      const updatePromises = Array.from(selectedParcels).map(async (parcelId) => {
        const parcelRef = doc(db, 'parcel', parcelId);
        await updateDoc(parcelRef, {
          logisticStatus: 'weighed',
          weighedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      await Promise.all(updatePromises);
      
      // Réactualiser les données
      await loadParcels(currentPage);
      setSelectedParcels(new Set());
      
      alert(`${selectedParcels.size} colis marqués comme traités`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour des colis');
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    loadParcels(1);
  };

  const handleSelectAll = () => {
    if (selectedParcels.size === parcels.length) {
      setSelectedParcels(new Set());
    } else {
      setSelectedParcels(new Set(parcels.map(p => p.id)));
    }
  };

  const handleSelectParcel = (id: string) => {
    const newSelected = new Set(selectedParcels);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedParcels(newSelected);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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

  return (
    <div className="space-y-6 max-w-none">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Recherche de Colis
          </h1>
          <p className="mt-2 text-slate-600">
            Consultez tous les colis ou recherchez par numéro de tracking, nom d'expéditeur ou destinataire
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-slate-900">
            <Search className="h-5 w-5 text-green-600" />
            <span>Rechercher un colis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusFilter && (
            <div className="mb-6">
              <Badge variant="secondary" className="bg-green-100 text-green-800 px-3 py-1 text-sm font-medium">
                <span className="mr-1">🔍</span>
                Filtré par statut: {statusLabels[statusFilter] || statusFilter}
              </Badge>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Entrez le numéro de tracking (ex: BF-2025-123456) ou nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-12 text-base border-slate-300 focus:border-green-500 focus:ring-green-500 rounded-xl"
              />
            </div>
            <Button 
              onClick={() => handleSearch()}
              disabled={loading}
              className="h-12 px-8 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Recherche...</span>
                </div>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Rechercher
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            💡 Astuce: Utilisez le numéro complet (BF-2025-123456) pour une recherche précise
          </p>
        </CardContent>
      </Card>

      {/* Filtres avancés */}
      {showFilters && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-slate-900">
              <Filter className="h-5 w-5 text-green-600" />
              <span>Filtres avancés</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Statut</label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Statut logistique</label>
                <Select value={filters.logisticStatus} onValueChange={(value) => handleFilterChange('logisticStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {Object.entries(logisticStatusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Coût minimum (€)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minCost}
                  onChange={(e) => handleFilterChange('minCost', e.target.value)}
                  className="border-slate-300"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Coût maximum (€)</label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={filters.maxCost}
                  onChange={(e) => handleFilterChange('maxCost', e.target.value)}
                  className="border-slate-300"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="h-9"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Effacer les filtres
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultats - Table professionnelle */}
      {hasSearched && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-slate-900">
                  {searchTerm || statusFilter ? 'Résultats de recherche' : 'Tous les colis'}
                </CardTitle>
                {parcels.length > 0 && (
                  <p className="text-sm text-slate-600 mt-1">
                    {parcels.length} colis {searchTerm || statusFilter ? 'trouvé' : 'affiché'}{parcels.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-9"
                >
                  <Filter className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{showFilters ? 'Masquer' : 'Filtres'}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="h-9"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Actualiser</span>
                </Button>
                {selectedParcels.size > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9">
                        <span className="sm:hidden">({selectedParcels.size})</span>
                        <span className="hidden sm:inline">Actions ({selectedParcels.size})</span>
                        <MoreHorizontal className="h-4 w-4 ml-1 sm:ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={handleExportSelected}>
                        <Download className="h-4 w-4 mr-2" />
                        Exporter sélection
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleMarkAsProcessed}>
                        Marquer comme traités
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6">
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 animate-pulse">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : parcels.length > 0 ? (
              <div>
                {/* Table desktop */}
                <div className="hidden lg:block overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedParcels.size === parcels.length && parcels.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('trackingID')}>
                          <div className="flex items-center space-x-1">
                            <span>Tracking ID</span>
                            {sortField === 'trackingID' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('sender_name')}>
                          <div className="flex items-center space-x-1">
                            <span>Expéditeur</span>
                            {sortField === 'sender_name' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Destinataire</TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                          <div className="flex items-center space-x-1">
                            <span>Statut</span>
                            {sortField === 'status' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('cost')}>
                          <div className="flex items-center space-x-1">
                            <span>Coût</span>
                            {sortField === 'cost' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('totalWeight')}>
                          <div className="flex items-center space-x-1">
                            <span>Poids</span>
                            {sortField === 'totalWeight' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('create_date')}>
                          <div className="flex items-center space-x-1">
                            <span>Date création</span>
                            {sortField === 'create_date' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Livraison</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parcels.map((parcel) => {
                        const StatusIcon = getStatusIcon(parcel.status);
                        return (
                          <TableRow 
                            key={parcel.id} 
                            className="hover:bg-slate-50 transition-colors"
                            data-state={selectedParcels.has(parcel.id) ? 'selected' : ''}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedParcels.has(parcel.id)}
                                onCheckedChange={() => handleSelectParcel(parcel.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <StatusIcon className="h-4 w-4 text-green-600" />
                                <span className="font-medium">{parcel.trackingID}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[150px] truncate" title={parcel.sender_name}>
                                {parcel.sender_name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[150px] truncate" title={parcel.receiver_name}>
                                {parcel.receiver_name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge className={getStatusColor(parcel.status)} variant="secondary">
                                  {statusLabels[parcel.status] || parcel.status}
                                </Badge>
                                {parcel.logisticStatus && (
                                  <Badge className={getLogisticStatusColor(parcel.logisticStatus)} variant="outline">
                                    {logisticStatusLabels[parcel.logisticStatus] || parcel.logisticStatus}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold">{parcel.cost}€</span>
                            </TableCell>
                            <TableCell>
                              <span>{parcel.actualWeight || parcel.totalWeight || 0} kg</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-slate-600">
                                {formatDate(parcel.create_date).split(' ')[0]}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {parcel.deliveredAt ? (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="h-3 w-3" />
                                    <span className="font-medium">Livré</span>
                                  </div>
                                ) : parcel.estimatedDelivery ? (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <Clock className="h-3 w-3" />
                                    <span>Prév. {formatDate(parcel.estimatedDelivery).split(' ')[0]}</span>
                                  </div>
                                ) : parcel.shippedAt ? (
                                  <div className="flex items-center gap-1 text-orange-600">
                                    <Truck className="h-3 w-3" />
                                    <span>En transit</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">Non expédié</span>
                                )}
                                {parcel.deliveredAt && (
                                  <div className="text-xs text-slate-500 mt-1">
                                    {formatDate(parcel.deliveredAt).split(' ')[0]}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="outline" asChild className="h-8 px-3">
                                  <Link href={`/logistic/colis/detail?id=${parcel.id}`}>
                                    <Eye className="h-3 w-3 mr-1" />
                                    Voir
                                  </Link>
                                </Button>
                                {parcel.logisticStatus === 'received' && (
                                  <Button size="sm" asChild className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700">
                                    <Link href={`/logistic/colis/preparation?search=${parcel.trackingID}`}>
                                      <Edit className="h-3 w-3 mr-1" />
                                      Peser
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Table tablette */}
                <div className="hidden md:block lg:hidden overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedParcels.size === parcels.length && parcels.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors min-w-[140px]" onClick={() => handleSort('trackingID')}>
                          <div className="flex items-center space-x-1">
                            <span>Tracking ID</span>
                            {sortField === 'trackingID' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors min-w-[120px]" onClick={() => handleSort('sender_name')}>
                          <div className="flex items-center space-x-1">
                            <span>Expéditeur</span>
                            {sortField === 'sender_name' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors min-w-[100px]" onClick={() => handleSort('status')}>
                          <div className="flex items-center space-x-1">
                            <span>Statut</span>
                            {sortField === 'status' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('cost')}>
                          <div className="flex items-center space-x-1">
                            <span>Coût</span>
                            {sortField === 'cost' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parcels.map((parcel) => {
                        const StatusIcon = getStatusIcon(parcel.status);
                        return (
                          <TableRow 
                            key={parcel.id} 
                            className="hover:bg-slate-50 transition-colors"
                            data-state={selectedParcels.has(parcel.id) ? 'selected' : ''}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedParcels.has(parcel.id)}
                                onCheckedChange={() => handleSelectParcel(parcel.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <StatusIcon className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-sm">{parcel.trackingID}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[120px] truncate text-sm" title={parcel.sender_name}>
                                {parcel.sender_name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge className={getStatusColor(parcel.status)} variant="secondary">
                                  {statusLabels[parcel.status] || parcel.status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-sm">{parcel.cost}€</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="sm" variant="outline" asChild className="h-8 px-2">
                                  <Link href={`/logistic/colis/detail?id=${parcel.id}`}>
                                    <Eye className="h-3 w-3" />
                                  </Link>
                                </Button>
                                {parcel.logisticStatus === 'received' && (
                                  <Button size="sm" asChild className="h-8 px-2 bg-emerald-600 hover:bg-emerald-700">
                                    <Link href={`/logistic/colis/preparation?search=${parcel.trackingID}`}>
                                      <Edit className="h-3 w-3" />
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Vue mobile en cartes */}
                <div className="block md:hidden space-y-4">
                  {parcels.map((parcel) => {
                    const StatusIcon = getStatusIcon(parcel.status);
                    return (
                      <div key={parcel.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={selectedParcels.has(parcel.id)}
                              onCheckedChange={() => handleSelectParcel(parcel.id)}
                            />
                            <StatusIcon className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-sm">{parcel.trackingID}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Badge className={getStatusColor(parcel.status)} variant="secondary">
                              {statusLabels[parcel.status] || parcel.status}
                            </Badge>
                            {parcel.logisticStatus && (
                              <Badge className={getLogisticStatusColor(parcel.logisticStatus)} variant="outline">
                                {logisticStatusLabels[parcel.logisticStatus] || parcel.logisticStatus}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-3 mb-3 text-sm">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-slate-500 text-xs">Expéditeur</p>
                              <p className="font-medium truncate" title={parcel.sender_name}>{parcel.sender_name}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs">Destinataire</p>
                              <p className="font-medium truncate" title={parcel.receiver_name}>{parcel.receiver_name}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <p className="text-slate-500 text-xs">Coût</p>
                              <p className="font-semibold text-slate-900">{parcel.cost}€</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs">Poids</p>
                              <p className="font-medium">{parcel.actualWeight || parcel.totalWeight || 0} kg</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs">Livraison</p>
                              {parcel.deliveredAt ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="h-3 w-3" />
                                  <span className="font-medium text-xs">Livré</span>
                                </div>
                              ) : parcel.estimatedDelivery ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <Clock className="h-3 w-3" />
                                  <span className="text-xs">Prév.</span>
                                </div>
                              ) : parcel.shippedAt ? (
                                <div className="flex items-center gap-1 text-orange-600">
                                  <Truck className="h-3 w-3" />
                                  <span className="text-xs">Transit</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">Non expédié</span>
                              )}
                            </div>
                          </div>
                          {parcel.deliveredAt && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle className="h-4 w-4" />
                                <div>
                                  <p className="font-medium text-sm">Livré avec succès</p>
                                  <p className="text-xs">Le {formatDate(parcel.deliveredAt)}</p>
                                  {parcel.deliveryAddress && (
                                    <p className="text-xs mt-1">📍 {parcel.deliveryAddress}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          {parcel.estimatedDelivery && !parcel.deliveredAt && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                              <div className="flex items-center gap-2 text-green-700">
                                <Clock className="h-4 w-4" />
                                <div>
                                  <p className="font-medium text-sm">Livraison prévue</p>
                                  <p className="text-xs">Le {formatDate(parcel.estimatedDelivery)}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <span className="text-xs text-slate-500">
                            {formatDate(parcel.create_date).split(' ')[0]}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" asChild className="h-8 px-3">
                              <Link href={`/logistic/colis/detail?id=${parcel.id}`}>
                                <Eye className="h-3 w-3 mr-1" />
                                Voir
                              </Link>
                            </Button>
                            {parcel.logisticStatus === 'received' && (
                              <Button size="sm" asChild className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700">
                                <Link href={`/logistic/colis/preparation?search=${parcel.trackingID}`}>
                                  <Edit className="h-3 w-3 mr-1" />
                                  Peser
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Pagination */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 border-t gap-4">
                  <div className="text-sm text-slate-600 text-center sm:text-left">
                    <span className="hidden sm:inline">
                      Affichage de <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}</span> à{' '}
                      <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> sur{' '}
                      <span className="font-medium">{totalItems}</span> résultats
                    </span>
                    <span className="sm:hidden">
                      <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> sur{' '}
                      <span className="font-medium">{totalItems}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1 || loading}
                      className="h-8 px-2 sm:px-3"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Précédent</span>
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(3, Math.ceil(totalItems / itemsPerPage)) }, (_, i) => {
                        const page = currentPage <= 2 ? i + 1 : currentPage - 1 + i;
                        const totalPages = Math.ceil(totalItems / itemsPerPage);
                        if (page > totalPages) return null;
                        
                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            disabled={loading}
                            className="h-8 w-8 p-0"
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(Math.ceil(totalItems / itemsPerPage), currentPage + 1))}
                      disabled={currentPage >= Math.ceil(totalItems / itemsPerPage) || loading}
                      className="h-8 px-2 sm:px-3"
                    >
                      <span className="hidden sm:inline mr-1">Suivant</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun colis trouvé</h3>
                <p className="text-gray-500">
                  Essayez avec un autre numéro de tracking ou nom, ou ajustez vos filtres
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!hasSearched && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Recherche de colis</h3>
            <p className="text-gray-500 mb-6">
              Entrez un numéro de tracking ou un nom pour commencer votre recherche
            </p>
            <div className="bg-green-50 rounded-lg p-4 text-sm text-green-800">
              <h4 className="font-medium mb-2">Types de recherche supportés :</h4>
              <ul className="text-left space-y-1">
                <li>• Numéro de tracking complet : BF-2025-123456</li>
                <li>• Nom d'expéditeur : Jean Dupont</li>
                <li>• Nom de destinataire : Marie Martin</li>
                <li>• Recherche partielle dans les noms</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div>Chargement...</div>}>
        <SearchPageContent />
      </Suspense>
    </MainLayout>
  );
}