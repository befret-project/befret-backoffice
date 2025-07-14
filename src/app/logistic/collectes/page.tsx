'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { CollecteService } from '@/services/collecte';
import { Collecte, CollecteFilters } from '@/types/collecte';
import { COLLECTE_STATUS_CONFIG, COLLECTE_PRIORITE_CONFIG, TYPE_COLLECTE_CONFIG } from '@/types/collecte';
import { 
  MapPin, 
  Package, 
  User, 
  Calendar, 
  Search, 
  Plus,
  Download,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Phone,
  Home,
  Building,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  XCircle,
  Filter
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


type SortField = 'reference' | 'client.nom' | 'datePrevue' | 'status' | 'priorite' | 'nbColis' | 'typeCollecte';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  status: string;
  type: string;
  priorite: string;
  chauffeur: string;
  dateRange: string;
}

const statusConfig = COLLECTE_STATUS_CONFIG;
const prioriteConfig = COLLECTE_PRIORITE_CONFIG;
const typeConfig = TYPE_COLLECTE_CONFIG;

export default function CollectesPage() {
  const [collectes, setCollectes] = useState<Collecte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Professional filtering state
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    type: '',
    priorite: '',
    chauffeur: '',
    dateRange: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('datePrevue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selection state
  const [selectedCollectes, setSelectedCollectes] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);


  const fetchCollectes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construire les filtres Firestore
      const firestoreFilters: CollecteFilters = {
        search: searchTerm || undefined,
        status: filters.status ? filters.status as Collecte['status'] : undefined,
        typeCollecte: filters.type ? filters.type as Collecte['typeCollecte'] : undefined,
        priorite: filters.priorite ? filters.priorite as Collecte['priorite'] : undefined,
        chauffeur: filters.chauffeur || undefined
      };
      
      const fetchedCollectes = await CollecteService.getWithFilters(firestoreFilters);
      setCollectes(fetchedCollectes);
    } catch (error) {
      console.error('Erreur lors du chargement des collectes:', error);
      setError('Erreur lors du chargement des collectes');
      setCollectes([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters]);

  useEffect(() => {
    fetchCollectes();
  }, [fetchCollectes]);

  // Professional data processing functions
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCollectes([]);
    } else {
      setSelectedCollectes(paginatedCollectes.map(collecte => collecte.id!).filter(Boolean));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectCollecte = (collecteId: string) => {
    setSelectedCollectes(prev => 
      prev.includes(collecteId) 
        ? prev.filter(id => id !== collecteId)
        : [...prev, collecteId]
    );
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      type: '',
      priorite: '',
      chauffeur: '',
      dateRange: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Advanced filtering and sorting logic
  const filteredAndSortedCollectes = collectes
    .filter(collecte => {
      // Tab filtering
      const matchesTab = activeTab === 'all' || 
                        (activeTab === 'programmees' && collecte.status === 'programmee') ||
                        (activeTab === 'en_cours' && collecte.status === 'en_cours') ||
                        (activeTab === 'terminees' && collecte.status === 'terminee');
      
      if (!matchesTab) return false;

      // Search filtering
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          collecte.reference.toLowerCase().includes(searchLower) ||
          collecte.client.nom.toLowerCase().includes(searchLower) ||
          collecte.client.email.toLowerCase().includes(searchLower) ||
          (collecte.client.entreprise && collecte.client.entreprise.toLowerCase().includes(searchLower)) ||
          collecte.adresse.ville.toLowerCase().includes(searchLower) ||
          (collecte.chauffeur && collecte.chauffeur.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Advanced filtering
      if (filters.status && collecte.status !== filters.status) return false;
      if (filters.type && collecte.typeCollecte !== filters.type) return false;
      if (filters.priorite && collecte.priorite !== filters.priorite) return false;
      if (filters.chauffeur && (!collecte.chauffeur || !collecte.chauffeur.toLowerCase().includes(filters.chauffeur.toLowerCase()))) return false;

      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'reference':
          aValue = a.reference;
          bValue = b.reference;
          break;
        case 'client.nom':
          aValue = a.client.nom;
          bValue = b.client.nom;
          break;
        case 'datePrevue':
          aValue = new Date(a.datePrevue || '');
          bValue = new Date(b.datePrevue || '');
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'priorite':
          aValue = a.priorite;
          bValue = b.priorite;
          break;
        case 'nbColis':
          aValue = a.nbColis || 0;
          bValue = b.nbColis || 0;
          break;
        case 'typeCollecte':
          aValue = a.typeCollecte;
          bValue = b.typeCollecte;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedCollectes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCollectes = filteredAndSortedCollectes.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedCollectes([]); // Clear selection when changing pages
    setSelectAll(false);
  };

  const getStatusIcon = (status: string) => {
    // Mapping des icônes pour les statuts
    const iconMap = {
      programmee: Calendar,
      en_cours: Clock,
      terminee: CheckCircle,
      annulee: AlertCircle
    };
    const Icon = iconMap[status as keyof typeof iconMap] || AlertCircle;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.programmee;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {getStatusIcon(status)}
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

  const getTypeIcon = (type: string) => {
    // Mapping des icônes pour les types
    const iconMap = {
      domicile: Home,
      entreprise: Building,
      point_relais: MapPin
    };
    const Icon = iconMap[type as keyof typeof iconMap] || MapPin;
    return <Icon className="h-4 w-4" />;
  };

  const getTotalStats = () => {
    return {
      programmee: filteredAndSortedCollectes.filter(c => c.status === 'programmee').length,
      en_cours: filteredAndSortedCollectes.filter(c => c.status === 'en_cours').length,
      terminee: filteredAndSortedCollectes.filter(c => c.status === 'terminee').length,
      annulee: filteredAndSortedCollectes.filter(c => c.status === 'annulee').length,
      total: filteredAndSortedCollectes.length,
      totalColis: filteredAndSortedCollectes.reduce((sum, c) => sum + (c.nbColis || 0), 0),
      totalPoids: filteredAndSortedCollectes.reduce((sum, c) => sum + (c.poidsTotal || 0), 0)
    };
  };

  const stats = getTotalStats();

  // CRUD Functions
  const handleExportAll = async () => {
    try {
      setLoading(true);
      const csvContent = await CollecteService.exportToCSV({
        search: searchTerm || undefined,
        status: filters.status ? filters.status as Collecte['status'] : undefined,
        typeCollecte: filters.type ? filters.type as Collecte['typeCollecte'] : undefined,
        priorite: filters.priorite ? filters.priorite as Collecte['priorite'] : undefined,
        chauffeur: filters.chauffeur || undefined
      });
      downloadCSV(csvContent, `collectes_toutes_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export des collectes');
    } finally {
      setLoading(false);
    }
  };

  const handleExportSelected = async () => {
    if (selectedCollectes.length === 0) {
      alert('Aucune collecte sélectionnée pour l\'export');
      return;
    }

    try {
      setLoading(true);
      // Créer un CSV basique à partir des données sélectionnées
      const selectedData = collectes.filter(c => c.id && selectedCollectes.includes(c.id));
      const headers = [
        'Référence',
        'Statut',
        'Client',
        'Entreprise',
        'Email',
        'Téléphone',
        'Adresse',
        'Ville',
        'Date prévue',
        'Heure',
        'Type collecte',
        'Nb colis',
        'Poids (kg)',
        'Priorité',
        'Chauffeur',
        'Opérateur'
      ];

      const rows = selectedData.map(col => [
        col.reference,
        col.status,
        col.client.nom,
        col.client.entreprise || '',
        col.client.email,
        col.client.telephone,
        col.adresse.rue,
        col.adresse.ville,
        col.datePrevue,
        col.heureCollecte,
        col.typeCollecte,
        (col.nbColis || 0).toString(),
        (col.poidsTotal || 0).toString(),
        col.priorite,
        col.chauffeur || '',
        col.operateur
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      downloadCSV(csvContent, `collectes_selection_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export des collectes sélectionnées');
    } finally {
      setLoading(false);
    }
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

  const router = useRouter();

  const handleNewCollecte = () => {
    router.push('/logistic/collectes/create');
  };

  const handleViewCollecte = (collecteId: string) => {
    router.push(`/logistic/collectes/detail?id=${collecteId}`);
  };

  const handleEditCollecte = (collecteId: string) => {
    router.push(`/logistic/collectes/edit?id=${collecteId}`);
  };

  const handleDeleteCollecte = async (collecteId: string) => {
    const collecte = collectes.find(c => c.id === collecteId);
    if (!collecte) return;

    if (confirm(`Êtes-vous sûr de vouloir supprimer la collecte ${collecte.reference} ?`)) {
      try {
        setLoading(true);
        await CollecteService.delete(collecteId);
        setCollectes(prev => prev.filter(c => c.id !== collecteId));
        alert(`Collecte ${collecte.reference} supprimée`);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la collecte');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteSelected = () => {
    if (selectedCollectes.length === 0) {
      alert('Aucune collecte sélectionnée pour suppression');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedCollectes.length} collecte(s) ?`)) {
      setCollectes(prev => prev.filter(c => !c.id || !selectedCollectes.includes(c.id)));
      setSelectedCollectes([]);
      alert(`${selectedCollectes.length} collecte(s) supprimée(s)`);
    }
  };

  const handleMarkAsCompleted = () => {
    if (selectedCollectes.length === 0) {
      alert('Aucune collecte sélectionnée');
      return;
    }

    setCollectes(prev => prev.map(c => 
      c.id && selectedCollectes.includes(c.id) ? { ...c, status: 'terminee' as const } : c
    ));
    setSelectedCollectes([]);
    alert(`${selectedCollectes.length} collecte(s) marquée(s) comme terminée(s)`);
  };

  const handleReschedule = (collecteId?: string) => {
    const ids = collecteId ? [collecteId] : selectedCollectes;
    if (ids.length === 0) {
      alert('Aucune collecte sélectionnée pour reprogrammation');
      return;
    }
    alert(`Fonctionnalité "Reprogrammer" pour ${ids.length} collecte(s) - Ouverture du formulaire de reprogrammation`);
  };

  const handleMarkCollecteCompleted = (collecteId: string) => {
    setCollectes(prev => prev.map(c => 
      c.id === collecteId ? { ...c, status: 'terminee' as const } : c
    ));
    alert('Collecte marquée comme terminée');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Collectes</h1>
            <p className="text-gray-600">Planification et suivi des collectes à domicile</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExportAll}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button size="sm" onClick={handleNewCollecte}>
              <Plus className="h-4 w-4 mr-2" />
              Programmer collecte
            </Button>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Programmées</p>
                  <p className="text-2xl font-bold">{stats.programmee}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">En cours</p>
                  <p className="text-2xl font-bold">{stats.en_cours}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Terminées</p>
                  <p className="text-2xl font-bold">{stats.terminee}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total colis</p>
                  <p className="text-2xl font-bold">{stats.totalColis}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="programmees">Programmées</TabsTrigger>
            <TabsTrigger value="en_cours">En cours</TabsTrigger>
            <TabsTrigger value="terminees">Terminées</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {/* Barre d'outils et recherche */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Rechercher par référence, client, ville..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Filtres
                      {(filters.status || filters.type || filters.priorite || filters.chauffeur) && (
                        <Badge variant="secondary" className="ml-1">
                          {[filters.status, filters.type, filters.priorite, filters.chauffeur].filter(Boolean).length}
                        </Badge>
                      )}
                    </Button>
                    <Button variant="outline" onClick={fetchCollectes}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Actualiser
                    </Button>
                    <Button variant="outline" onClick={handleExportAll}>
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Filtres avancés (repliables) */}
              {showFilters && (
                <CardContent className="border-t bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 py-4">
                    <div>
                      <Label>Statut</Label>
                      <Select 
                        value={filters.status} 
                        onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tous les statuts" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Tous les statuts</SelectItem>
                          <SelectItem value="programmee">Programmée</SelectItem>
                          <SelectItem value="en_cours">En cours</SelectItem>
                          <SelectItem value="terminee">Terminée</SelectItem>
                          <SelectItem value="annulee">Annulée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Type</Label>
                      <Select 
                        value={filters.type} 
                        onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tous les types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Tous les types</SelectItem>
                          <SelectItem value="domicile">Domicile</SelectItem>
                          <SelectItem value="entreprise">Entreprise</SelectItem>
                          <SelectItem value="point_relais">Point relais</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Priorité</Label>
                      <Select 
                        value={filters.priorite} 
                        onValueChange={(value) => setFilters(prev => ({ ...prev, priorite: value }))}
                      >
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
                      <Label>Chauffeur</Label>
                      <Input
                        placeholder="Nom du chauffeur..."
                        value={filters.chauffeur}
                        onChange={(e) => setFilters(prev => ({ ...prev, chauffeur: e.target.value }))}
                      />
                    </div>

                    <div className="flex items-end">
                      <Button variant="outline" onClick={clearFilters} className="w-full">
                        <XCircle className="h-4 w-4 mr-2" />
                        Effacer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Table professionnelle */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Collectes ({stats.total})</CardTitle>
                    <CardDescription>
                      {selectedCollectes.length > 0 && `${selectedCollectes.length} collecte(s) sélectionnée(s) • `}
                      Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredAndSortedCollectes.length)} sur {filteredAndSortedCollectes.length}
                    </CardDescription>
                  </div>
                  {selectedCollectes.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          Actions ({selectedCollectes.length})
                          <MoreHorizontal className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleMarkAsCompleted}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Marquer comme terminées
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleReschedule()}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Reprogrammer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportSelected}>
                          <Download className="h-4 w-4 mr-2" />
                          Exporter la sélection
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={handleDeleteSelected}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement des collectes...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="p-2 bg-red-100 rounded-lg w-fit mx-auto">
                      <AlertCircle className="h-12 w-12 text-red-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Erreur de chargement</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={fetchCollectes} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Réessayer
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Table Desktop */}
                    <div className="hidden lg:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={selectAll}
                                onCheckedChange={handleSelectAll}
                              />
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handleSort('reference')}
                            >
                              <div className="flex items-center gap-2">
                                Référence
                                {getSortIcon('reference')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handleSort('client.nom')}
                            >
                              <div className="flex items-center gap-2">
                                Client
                                {getSortIcon('client.nom')}
                              </div>
                            </TableHead>
                            <TableHead>Adresse</TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handleSort('datePrevue')}
                            >
                              <div className="flex items-center gap-2">
                                Date prévue
                                {getSortIcon('datePrevue')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-50 text-right"
                              onClick={() => handleSort('nbColis')}
                            >
                              <div className="flex items-center gap-2 justify-end">
                                Colis/Poids
                                {getSortIcon('nbColis')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handleSort('typeCollecte')}
                            >
                              <div className="flex items-center gap-2">
                                Type
                                {getSortIcon('typeCollecte')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handleSort('priorite')}
                            >
                              <div className="flex items-center gap-2">
                                Priorité
                                {getSortIcon('priorite')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handleSort('status')}
                            >
                              <div className="flex items-center gap-2">
                                Statut
                                {getSortIcon('status')}
                              </div>
                            </TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedCollectes.map((collecte) => (
                            <TableRow key={collecte.id} className="hover:bg-gray-50">
                              <TableCell>
                                <Checkbox
                                  checked={collecte.id ? selectedCollectes.includes(collecte.id) : false}
                                  onCheckedChange={() => collecte.id && handleSelectCollecte(collecte.id)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="font-mono text-sm">{collecte.reference}</div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{collecte.client.nom}</div>
                                  <div className="text-sm text-gray-500">{collecte.client.email}</div>
                                  {collecte.client.entreprise && (
                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                      <Building className="h-3 w-3" />
                                      {collecte.client.entreprise}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-gray-400" />
                                    {collecte.adresse.ville}
                                  </div>
                                  <div className="text-xs text-gray-500">{collecte.adresse.codePostal}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {collecte.datePrevue && new Date(collecte.datePrevue).toLocaleDateString('fr-FR')}
                                  {collecte.heureCollecte && (
                                    <div className="text-xs text-gray-500">{collecte.heureCollecte}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="text-sm">
                                  <div className="font-semibold">{collecte.nbColis || 0} colis</div>
                                  <div className="text-xs text-gray-500">{collecte.poidsTotal || 0} kg</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {getTypeIcon(collecte.typeCollecte)}
                                  <span className="text-sm">{typeConfig[collecte.typeCollecte as keyof typeof typeConfig]?.label}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getPrioriteBadge(collecte.priorite)}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(collecte.status)}
                                {collecte.chauffeur && (
                                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {collecte.chauffeur}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => collecte.id && handleViewCollecte(collecte.id)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Voir
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => collecte.id && handleEditCollecte(collecte.id)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Modifier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleReschedule(collecte.id)}>
                                      <Calendar className="h-4 w-4 mr-2" />
                                      Reprogrammer
                                    </DropdownMenuItem>
                                    {collecte.status === 'programmee' && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => collecte.id && handleMarkCollecteCompleted(collecte.id)}>
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Marquer terminée
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600" onClick={() => collecte.id && handleDeleteCollecte(collecte.id)}>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Supprimer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Table Tablet */}
                    <div className="hidden md:block lg:hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={selectAll}
                                onCheckedChange={handleSelectAll}
                              />
                            </TableHead>
                            <TableHead>Collecte</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Date/Lieu</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedCollectes.map((collecte) => (
                            <TableRow key={collecte.id} className="hover:bg-gray-50">
                              <TableCell>
                                <Checkbox
                                  checked={collecte.id ? selectedCollectes.includes(collecte.id) : false}
                                  onCheckedChange={() => collecte.id && handleSelectCollecte(collecte.id)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="font-mono text-sm">{collecte.reference}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  {getTypeIcon(collecte.typeCollecte)}
                                  {collecte.nbColis || 0} colis • {collecte.poidsTotal || 0} kg
                                </div>
                                {getPrioriteBadge(collecte.priorite)}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{collecte.client.nom}</div>
                                <div className="text-sm text-gray-500">{collecte.client.email}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">{collecte.datePrevue && new Date(collecte.datePrevue).toLocaleDateString('fr-FR')}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {collecte.adresse.ville}
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(collecte.status)}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => collecte.id && handleViewCollecte(collecte.id)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Voir
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => collecte.id && handleEditCollecte(collecte.id)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Modifier
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                      {paginatedCollectes.map((collecte) => (
                        <Card key={collecte.id} className="border-l-4 border-l-green-500">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={collecte.id ? selectedCollectes.includes(collecte.id) : false}
                                  onCheckedChange={() => collecte.id && handleSelectCollecte(collecte.id)}
                                />
                                <span className="font-mono text-sm text-gray-600">{collecte.reference}</span>
                              </div>
                              {getStatusBadge(collecte.status)}
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <div className="font-semibold">{collecte.client.nom}</div>
                                <div className="text-sm text-gray-600">{collecte.client.email}</div>
                                {collecte.client.entreprise && (
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    {collecte.client.entreprise}
                                  </div>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">Date prévue:</span>
                                  <div className="font-medium">
                                    {collecte.datePrevue && new Date(collecte.datePrevue).toLocaleDateString('fr-FR')}
                                    {collecte.heureCollecte && ` ${collecte.heureCollecte}`}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Lieu:</span>
                                  <div className="font-medium flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {collecte.adresse.ville}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center pt-2">
                                <div className="flex items-center gap-4">
                                  <div className="text-sm">
                                    <span className="font-semibold">{collecte.nbColis || 0}</span> colis
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-semibold">{collecte.poidsTotal || 0}</span> kg
                                  </div>
                                  {getPrioriteBadge(collecte.priorite)}
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => collecte.id && handleViewCollecte(collecte.id)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Voir
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => collecte.id && handleEditCollecte(collecte.id)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Modifier
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* État vide */}
                    {filteredAndSortedCollectes.length === 0 && (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune collecte trouvée</h3>
                        <p className="text-gray-600 mb-4">
                          {searchTerm || filters.status || filters.type || filters.priorite || filters.chauffeur
                            ? 'Aucune collecte ne correspond à vos critères de recherche.'
                            : 'Commencez par programmer votre première collecte.'}
                        </p>
                        {(searchTerm || filters.status || filters.type || filters.priorite || filters.chauffeur) && (
                          <Button variant="outline" onClick={clearFilters}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Effacer les filtres
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t">
                        <div className="text-sm text-gray-600">
                          Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredAndSortedCollectes.length)} sur {filteredAndSortedCollectes.length} collecte(s)
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Précédent
                          </Button>
                          
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              const page = i + 1;
                              return (
                                <Button
                                  key={page}
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePageChange(page)}
                                  className="w-8 h-8 p-0"
                                >
                                  {page}
                                </Button>
                              );
                            })}
                            {totalPages > 5 && (
                              <>
                                <span className="px-2">...</span>
                                <Button
                                  variant={currentPage === totalPages ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePageChange(totalPages)}
                                  className="w-8 h-8 p-0"
                                >
                                  {totalPages}
                                </Button>
                              </>
                            )}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Suivant
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}