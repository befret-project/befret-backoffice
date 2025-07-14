'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ExpeditionService } from '@/services/expedition';
import { EXPEDITION_STATUS_CONFIG, EXPEDITION_PRIORITE_CONFIG } from '@/types/expedition';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Truck, 
  Package, 
  MapPin, 
  Calendar, 
  Search, 
  Filter, 
  Plus,
  Download,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  User,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  XCircle,
  Building
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

import { Expedition, ExpeditionFilters } from '@/types/expedition';

type SortField = 'reference' | 'destination.ville' | 'dateDepart' | 'dateArriveePrevu' | 'status' | 'transporteur.nom' | 'nbColis' | 'priorite';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  status: string;
  transporteur: string;
  destination: string;
  priorite: string;
  dateRange: string;
}

const statusConfig = EXPEDITION_STATUS_CONFIG;
const prioriteConfig = EXPEDITION_PRIORITE_CONFIG;

// Données sample temporaires - pour que tout fonctionne immédiatement
const generateSampleExpeditions = (): Expedition[] => {
  return [
    {
      id: '1',
      reference: 'EXP-2024-001',
      destination: {
        ville: 'Kinshasa',
        pays: 'RD Congo',
        adresse: 'Avenue Tombalbaye, Gombe'
      },
      status: 'en_cours',
      nbColis: 45,
      transporteur: {
        nom: 'DHL Congo',
        contact: 'Pierre Mukendi',
        telephone: '+243 81 234 5678'
      },
      dateDepart: '2024-01-15',
      dateArriveePrevu: '2024-01-22',
      tracking: 'DHL-CD-789012345',
      responsable: 'Marc Dubois',
      conteneur: 'CONT-001',
      poids: 1250.5,
      valeur: 45000,
      priorite: 'urgente',
      notes: 'Livraison express demandée par le client',
      createdAt: '2024-01-10T08:30:00Z',
      updatedAt: '2024-01-10T08:30:00Z',
      createdBy: 'user-1'
    },
    {
      id: '2',
      reference: 'EXP-2024-002',
      destination: {
        ville: 'Lubumbashi',
        pays: 'RD Congo',
        adresse: 'Boulevard Mobutu, Lubumbashi'
      },
      status: 'preparation',
      nbColis: 32,
      transporteur: {
        nom: 'FedEx Africa',
        contact: 'Sarah Ngandu',
        telephone: '+243 97 876 5432'
      },
      dateDepart: '2024-01-20',
      dateArriveePrevu: '2024-01-27',
      tracking: 'FDX-AF-567890123',
      responsable: 'Julie Martin',
      conteneur: 'CONT-002',
      poids: 890.2,
      valeur: 32000,
      priorite: 'normale',
      notes: 'Matériel médical - manipulation avec précaution',
      createdAt: '2024-01-12T14:15:00Z',
      updatedAt: '2024-01-12T14:15:00Z',
      createdBy: 'user-1'
    },
    {
      id: '3',
      reference: 'EXP-2024-003',
      destination: {
        ville: 'Bukavu',
        pays: 'RD Congo',
        adresse: 'Avenue Patrice Lumumba, Bukavu'
      },
      status: 'arrive',
      nbColis: 28,
      transporteur: {
        nom: 'UPS Congo',
        contact: 'Jean Kabila',
        telephone: '+243 85 345 6789'
      },
      dateDepart: '2024-01-08',
      dateArriveePrevu: '2024-01-15',
      dateArriveeReelle: '2024-01-14',
      tracking: 'UPS-CG-345678901',
      responsable: 'David Leroy',
      conteneur: 'CONT-003',
      poids: 675.8,
      valeur: 28500,
      priorite: 'express',
      notes: 'Arrivé avec 1 jour d\'avance',
      createdAt: '2024-01-05T09:45:00Z',
      updatedAt: '2024-01-05T09:45:00Z',
      createdBy: 'user-1'
    }
  ];
};

export default function ExpeditionsPage() {
  const [expeditions, setExpeditions] = useState<Expedition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('dateDepart');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExpeditions, setSelectedExpeditions] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    transporteur: '',
    destination: '',
    priorite: '',
    dateRange: ''
  });

  // Fonction pour charger les expéditions depuis Firestore
  const fetchExpeditions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Créer les filtres Firestore à partir de l'état local
      const firestoreFilters: ExpeditionFilters = {};
      
      if (filters.status) {
        firestoreFilters.status = filters.status as any;
      }
      if (filters.transporteur) {
        firestoreFilters.transporteur = filters.transporteur;
      }
      if (filters.priorite) {
        firestoreFilters.priorite = filters.priorite as any;
      }
      if (searchTerm) {
        firestoreFilters.search = searchTerm;
      }
      if (filters.destination) {
        firestoreFilters.destination = filters.destination;
      }
      
      // Utiliser les services Firebase
      const data = await ExpeditionService.getWithFilters(firestoreFilters);
      setExpeditions(data);
    } catch (err) {
      console.error('Error fetching expeditions:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des expéditions');
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm]);

  // Charger les expéditions au montage du composant
  useEffect(() => {
    fetchExpeditions();
  }, [fetchExpeditions]);

  // Fonctions de tri
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  // Fonction de filtrage et tri
  const getFilteredAndSortedExpeditions = useCallback(() => {
    let filtered = expeditions.filter(expedition => {
      const matchesSearch = !searchTerm || 
        expedition.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expedition.destination.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expedition.transporteur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expedition.responsable.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !filters.status || expedition.status === filters.status;
      const matchesTransporteur = !filters.transporteur || expedition.transporteur.nom.toLowerCase().includes(filters.transporteur.toLowerCase());
      const matchesDestination = !filters.destination || expedition.destination.ville.toLowerCase().includes(filters.destination.toLowerCase());
      const matchesPriorite = !filters.priorite || expedition.priorite === filters.priorite;
      
      return matchesSearch && matchesStatus && matchesTransporteur && matchesDestination && matchesPriorite;
    });

    // Tri
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'destination.ville':
          aValue = a.destination.ville;
          bValue = b.destination.ville;
          break;
        case 'transporteur.nom':
          aValue = a.transporteur.nom;
          bValue = b.transporteur.nom;
          break;
        default:
          aValue = a[sortField as keyof Expedition];
          bValue = b[sortField as keyof Expedition];
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    return filtered;
  }, [expeditions, searchTerm, sortField, sortDirection, filters]);

  const filteredExpeditions = getFilteredAndSortedExpeditions();
  const totalPages = Math.ceil(filteredExpeditions.length / itemsPerPage);
  const paginatedExpeditions = filteredExpeditions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Gestion de la sélection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExpeditions(new Set(paginatedExpeditions.filter(exp => exp.id).map(exp => exp.id!)));
    } else {
      setSelectedExpeditions(new Set());
    }
  };

  const handleSelectExpedition = (expeditionId: string, checked: boolean) => {
    const newSelected = new Set(selectedExpeditions);
    if (checked) {
      newSelected.add(expeditionId);
    } else {
      newSelected.delete(expeditionId);
    }
    setSelectedExpeditions(newSelected);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      transporteur: '',
      destination: '',
      priorite: '',
      dateRange: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '') || searchTerm !== '';

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'preparation':
        return <Package className="h-4 w-4" />;
      case 'en_cours':
        return <Truck className="h-4 w-4" />;
      case 'arrive':
        return <MapPin className="h-4 w-4" />;
      case 'livre':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.preparation;
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
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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

  // Export functions
  const handleExportSelected = async () => {
    if (selectedExpeditions.size === 0) {
      alert('Aucune expédition sélectionnée pour l\'export');
      return;
    }

    try {
      setLoading(true);
      
      // Créer un filtre temporaire avec les IDs sélectionnés
      const selectedData = expeditions.filter(exp => exp.id && selectedExpeditions.has(exp.id));
      const csvContent = generateLocalCSV(selectedData);
      downloadCSV(csvContent, `expeditions_selection_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (err) {
      console.error('Error exporting selected expeditions:', err);
      alert('Erreur lors de l\'export des expéditions sélectionnées');
    } finally {
      setLoading(false);
    }
  };

  const handleExportAll = async () => {
    try {
      setLoading(true);
      
      // Créer les filtres Firestore pour l'export
      const firestoreFilters: ExpeditionFilters = {};
      
      if (filters.status) {
        firestoreFilters.status = filters.status as any;
      }
      if (filters.transporteur) {
        firestoreFilters.transporteur = filters.transporteur;
      }
      if (filters.priorite) {
        firestoreFilters.priorite = filters.priorite as any;
      }
      if (searchTerm) {
        firestoreFilters.search = searchTerm;
      }
      if (filters.destination) {
        firestoreFilters.destination = filters.destination;
      }
      
      const csvContent = await ExpeditionService.exportToCSV(firestoreFilters);
      downloadCSV(csvContent, `expeditions_toutes_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (err) {
      console.error('Error exporting expeditions:', err);
      alert('Erreur lors de l\'export des expéditions');
    } finally {
      setLoading(false);
    }
  };

  // Fonction locale pour générer CSV (pour les exports sélectionnés et individuels)
  const generateLocalCSV = (data: Expedition[]) => {
    const headers = [
      'Référence',
      'Destination',
      'Pays', 
      'Transporteur',
      'Contact',
      'Date départ',
      'Date arrivée prévue',
      'Statut',
      'Nb colis',
      'Poids',
      'Valeur',
      'Priorité',
      'Responsable',
      'Tracking',
      'Notes'
    ];

    const csvRows = [
      headers.join(','),
      ...data.map(exp => [
        exp.reference,
        `"${exp.destination.ville}"`,
        `"${exp.destination.pays}"`,
        `"${exp.transporteur.nom}"`,
        `"${exp.transporteur.contact}"`,
        exp.dateDepart,
        exp.dateArriveePrevu,
        statusConfig[exp.status as keyof typeof statusConfig].label,
        exp.nbColis,
        exp.poids,
        exp.valeur,
        prioriteConfig[exp.priorite as keyof typeof prioriteConfig].label,
        `"${exp.responsable}"`,
        exp.tracking,
        `"${exp.notes || ''}"`
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

  const handleDeleteSelected = async () => {
    if (selectedExpeditions.size === 0) {
      alert('Aucune expédition sélectionnée pour suppression');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedExpeditions.size} expédition(s) ?`)) {
      try {
        setLoading(true);
        
        // Supprimer chaque expédition sélectionnée
        const deletePromises = Array.from(selectedExpeditions).map(expeditionId =>
          ExpeditionService.delete(expeditionId)
        );
        
        await Promise.all(deletePromises);
        
        // Recharger les données
        await fetchExpeditions();
        setSelectedExpeditions(new Set());
        alert(`${selectedExpeditions.size} expédition(s) supprimée(s)`);
      } catch (err) {
        console.error('Error deleting expeditions:', err);
        alert('Erreur lors de la suppression des expéditions');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteExpedition = async (expeditionId: string) => {
    const expedition = expeditions.find(exp => exp.id === expeditionId);
    if (!expedition) return;

    if (confirm(`Êtes-vous sûr de vouloir supprimer l'expédition ${expedition.reference} ?`)) {
      // Suppression locale pour l'instant
      setExpeditions(prev => prev.filter(exp => exp.id !== expeditionId));
      alert(`Expédition ${expedition.reference} supprimée`);
    }
  };

  const router = useRouter();

  const handleNewExpedition = () => {
    router.push('/logistic/expeditions/create');
  };

  const handleViewExpedition = (expeditionId: string) => {
    router.push(`/logistic/expeditions/detail?id=${expeditionId}`);
  };

  const handleEditExpedition = (expeditionId: string) => {
    router.push(`/logistic/expeditions/edit?id=${expeditionId}`);
  };

  const handleExportExpedition = async (expeditionId: string) => {
    const expedition = expeditions.find(exp => exp.id === expeditionId);
    if (!expedition) return;

    try {
      setLoading(true);
      const csvContent = generateLocalCSV([expedition]);
      downloadCSV(csvContent, `expedition_${expedition.reference}_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (err) {
      console.error('Error exporting expedition:', err);
      alert('Erreur lors de l\'export de l\'expédition');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expéditions</h1>
            <p className="text-gray-600">Gestion des expéditions et suivi des livraisons</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedExpeditions.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedExpeditions.size} sélectionné(s)
                </span>
                <Button variant="outline" size="sm" onClick={handleExportSelected} disabled={loading}>
                  <Download className="h-4 w-4 mr-1" />
                  Exporter
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeleteSelected} disabled={loading}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchExpeditions}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportAll} disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button size="sm" onClick={handleNewExpedition}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle expédition
            </Button>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Package className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">En préparation</p>
                  <p className="text-2xl font-bold">
                    {expeditions.filter(e => e.status === 'preparation').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Truck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">En cours</p>
                  <p className="text-2xl font-bold">
                    {expeditions.filter(e => e.status === 'en_cours').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Livrés</p>
                  <p className="text-2xl font-bold">
                    {expeditions.filter(e => e.status === 'livre').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total colis</p>
                  <p className="text-2xl font-bold">
                    {expeditions.reduce((sum, e) => sum + e.nbColis, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barre de recherche et filtres */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Recherche */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher par référence, destination, transporteur, responsable..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Boutons d'action */}
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  variant={showFilters ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                      {Object.values(filters).filter(v => v !== '').length + (searchTerm ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
                
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Effacer
                  </Button>
                )}

                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Panneau de filtres avancés */}
            {showFilters && (
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Statut</Label>
                    <Select value={filters.status} onValueChange={(value) => {
                      setFilters(prev => ({ ...prev, status: value }));
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les statuts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tous les statuts</SelectItem>
                        <SelectItem value="preparation">En préparation</SelectItem>
                        <SelectItem value="en_cours">En cours</SelectItem>
                        <SelectItem value="arrive">Arrivé</SelectItem>
                        <SelectItem value="livre">Livré</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Priorité</Label>
                    <Select value={filters.priorite} onValueChange={(value) => {
                      setFilters(prev => ({ ...prev, priorite: value }));
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les priorités" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Toutes les priorités</SelectItem>
                        <SelectItem value="normale">Normale</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                        <SelectItem value="express">Express</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Transporteur</Label>
                    <Input
                      placeholder="Filtrer par transporteur"
                      value={filters.transporteur}
                      onChange={(e) => {
                        setFilters(prev => ({ ...prev, transporteur: e.target.value }));
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Destination</Label>
                    <Input
                      placeholder="Filtrer par ville"
                      value={filters.destination}
                      onChange={(e) => {
                        setFilters(prev => ({ ...prev, destination: e.target.value }));
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Résultats et informations */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-gray-600">
          <div>
            Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredExpeditions.length)} 
            sur {filteredExpeditions.length} expéditions
            {hasActiveFilters && (
              <span className="ml-2">
                ({expeditions.length} au total)
              </span>
            )}
          </div>
          {selectedExpeditions.size > 0 && (
            <div className="text-green-600">
              {selectedExpeditions.size} expédition(s) sélectionnée(s)
            </div>
          )}
        </div>

        {/* Table Desktop */}
        <Card className="hidden lg:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={paginatedExpeditions.length > 0 && selectedExpeditions.size === paginatedExpeditions.length}
                      onCheckedChange={handleSelectAll}
                      aria-label="Sélectionner tout"
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('reference')}
                  >
                    <div className="flex items-center gap-1">
                      Référence
                      {getSortIcon('reference')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('destination.ville')}
                  >
                    <div className="flex items-center gap-1">
                      Destination
                      {getSortIcon('destination.ville')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('transporteur.nom')}
                  >
                    <div className="flex items-center gap-1">
                      Transporteur
                      {getSortIcon('transporteur.nom')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('dateDepart')}
                  >
                    <div className="flex items-center gap-1">
                      Départ
                      {getSortIcon('dateDepart')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Statut
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('nbColis')}
                  >
                    <div className="flex items-center gap-1">
                      Colis
                      {getSortIcon('nbColis')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('priorite')}
                  >
                    <div className="flex items-center gap-1">
                      Priorité
                      {getSortIcon('priorite')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedExpeditions.filter(exp => exp.id).map((expedition) => (
                  <TableRow key={expedition.id!} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox
                        checked={selectedExpeditions.has(expedition.id!)}
                        onCheckedChange={(checked) => handleSelectExpedition(expedition.id!, checked as boolean)}
                        aria-label={`Sélectionner ${expedition.reference}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{expedition.reference}</div>
                        <div className="text-sm text-gray-500 font-mono">{expedition.tracking}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{expedition.destination.ville}</div>
                        <div className="text-sm text-gray-500">{expedition.destination.pays}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{expedition.transporteur.nom}</div>
                        <div className="text-sm text-gray-500">{expedition.transporteur.contact}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{formatDate(expedition.dateDepart)}</div>
                        <div className="text-xs text-gray-500">Arr. prév.: {formatDate(expedition.dateArriveePrevu)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(expedition.status)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{expedition.nbColis}</div>
                        <div className="text-sm text-gray-500">{formatWeight(expedition.poids)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPrioriteBadge(expedition.priorite)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewExpedition(expedition.id!)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditExpedition(expedition.id!)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportExpedition(expedition.id!)}>
                            <Download className="mr-2 h-4 w-4" />
                            Exporter
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteExpedition(expedition.id!)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Chargement des expéditions...</p>
              </div>
            ) : paginatedExpeditions.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Aucune expédition trouvée</p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Effacer les filtres
                  </Button>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Table Tablet */}
        <Card className="hidden md:block lg:hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={paginatedExpeditions.length > 0 && selectedExpeditions.size === paginatedExpeditions.length}
                      onCheckedChange={handleSelectAll}
                      aria-label="Sélectionner tout"
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('reference')}
                  >
                    <div className="flex items-center gap-1">
                      Référence
                      {getSortIcon('reference')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('destination.ville')}
                  >
                    <div className="flex items-center gap-1">
                      Destination
                      {getSortIcon('destination.ville')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('dateDepart')}
                  >
                    <div className="flex items-center gap-1">
                      Départ
                      {getSortIcon('dateDepart')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Statut
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedExpeditions.filter(exp => exp.id).map((expedition) => (
                  <TableRow key={expedition.id!} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox
                        checked={selectedExpeditions.has(expedition.id!)}
                        onCheckedChange={(checked) => handleSelectExpedition(expedition.id!, checked as boolean)}
                        aria-label={`Sélectionner ${expedition.reference}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-semibold">{expedition.reference}</div>
                        <div className="text-sm text-gray-500">{expedition.transporteur.nom}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{expedition.destination.ville}</div>
                        <div className="text-sm text-gray-500">{expedition.nbColis} colis</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDate(expedition.dateDepart)}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {getStatusBadge(expedition.status)}
                        <div className="mt-1">
                          {getPrioriteBadge(expedition.priorite)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewExpedition(expedition.id!)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditExpedition(expedition.id!)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteExpedition(expedition.id!)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Chargement des expéditions...</p>
              </div>
            ) : paginatedExpeditions.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Aucune expédition trouvée</p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Effacer les filtres
                  </Button>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Cards Mobile */}
        <div className="md:hidden space-y-4">
          {paginatedExpeditions.filter(exp => exp.id).map((expedition) => (
            <Card key={expedition.id!} className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedExpeditions.has(expedition.id!)}
                      onCheckedChange={(checked) => handleSelectExpedition(expedition.id!, checked as boolean)}
                      aria-label={`Sélectionner ${expedition.reference}`}
                    />
                    <div>
                      <h3 className="font-semibold">{expedition.reference}</h3>
                      <p className="text-sm text-gray-500 font-mono">{expedition.tracking}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewExpedition(expedition.id!)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Voir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditExpedition(expedition.id!)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteExpedition(expedition.id!)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Status and Priority */}
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(expedition.status)}
                  {getPrioriteBadge(expedition.priorite)}
                </div>

                {/* Main Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-xs text-gray-500">Destination</Label>
                    <p className="font-medium">{expedition.destination.ville}</p>
                    <p className="text-gray-600">{expedition.destination.pays}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Transporteur</Label>
                    <p className="font-medium">{expedition.transporteur.nom}</p>
                    <p className="text-gray-600">{expedition.transporteur.contact}</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-xs text-gray-500">Départ</Label>
                    <p className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(expedition.dateDepart)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Arrivée prévue</Label>
                    <p className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(expedition.dateArriveePrevu)}
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-xs text-gray-500">Colis</Label>
                    <p className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {expedition.nbColis} ({formatWeight(expedition.poids)})
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Responsable</Label>
                    <p className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {expedition.responsable}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          {loading ? (
            <Card className="p-8 text-center">
              <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Chargement des expéditions...</p>
            </Card>
          ) : paginatedExpeditions.length === 0 ? (
            <Card className="p-8 text-center">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Aucune expédition trouvée</p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Effacer les filtres
                </Button>
              )}
            </Card>
          ) : null}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Page {currentPage} sur {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <ChevronLeft className="h-4 w-4 -ml-2" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Pages numérotées */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNumber <= totalPages) {
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                }
                return null;
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <ChevronRight className="h-4 w-4 -ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}