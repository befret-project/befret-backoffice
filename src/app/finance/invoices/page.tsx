'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus,
  Download,
  Eye,
  Send,
  Calendar,
  Euro,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  XCircle,
  Building,
  User
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

interface Invoice {
  id: string;
  numero: string;
  client: {
    nom: string;
    email: string;
    adresse: string;
    entreprise?: string;
  };
  dateEmission: string;
  dateEcheance: string;
  montantHT: number;
  montantTTC: number;
  tva: number;
  status: 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | 'annulee';
  services: Array<{
    description: string;
    quantite: number;
    prixUnitaire: number;
    total: number;
  }>;
  datePaiement?: string;
  paymentMethod?: 'virement' | 'carte' | 'especes' | 'cheque';
  currency: string;
  notes?: string;
}

type SortField = 'numero' | 'client.nom' | 'dateEmission' | 'dateEcheance' | 'montantTTC' | 'status';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  status: string;
  client: string;
  dateRange: string;
  amountRange: string;
}

const statusConfig = {
  brouillon: { label: '📝 Facture brouillon', color: 'bg-gray-100 text-gray-800', icon: FileText },
  envoyee: { label: '📤 Facture envoyée', color: 'bg-green-100 text-green-800', icon: Send },
  payee: { label: '✅ Facture payée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  en_retard: { label: '⚠️ Paiement en retard', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  annulee: { label: '❌ Facture annulée', color: 'bg-gray-100 text-gray-600', icon: AlertCircle }
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Professional filtering state
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    client: '',
    dateRange: '',
    amountRange: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('dateEmission');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selection state
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Modal state for invoice details
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Sample data for professional demonstration
  const generateSampleInvoices = (): Invoice[] => {
    return [
      {
        id: '1',
        numero: 'FAC-2024-001',
        client: {
          nom: 'Pierre Dubois',
          email: 'pierre.dubois@entreprise.fr',
          adresse: '123 Rue de la Paix, 75001 Paris',
          entreprise: 'TechCorp SARL'
        },
        dateEmission: '2024-01-15',
        dateEcheance: '2024-02-15',
        montantHT: 1250.00,
        montantTTC: 1500.00,
        tva: 250.00,
        status: 'payee',
        currency: 'EUR',
        paymentMethod: 'virement',
        datePaiement: '2024-02-10',
        services: [
          { description: 'Expédition colis prioritaire', quantite: 5, prixUnitaire: 250.00, total: 1250.00 }
        ],
        notes: 'Client privilégié - paiement rapide'
      },
      {
        id: '2',
        numero: 'FAC-2024-002',
        client: {
          nom: 'Marie Lambert',
          email: 'marie.lambert@boutique.com',
          adresse: '456 Avenue des Champs, 69001 Lyon',
          entreprise: 'Boutique Élégance'
        },
        dateEmission: '2024-01-20',
        dateEcheance: '2024-02-20',
        montantHT: 850.00,
        montantTTC: 1020.00,
        tva: 170.00,
        status: 'en_retard',
        currency: 'EUR',
        paymentMethod: 'carte',
        services: [
          { description: 'Transport express', quantite: 3, prixUnitaire: 283.33, total: 850.00 }
        ]
      },
      {
        id: '3',
        numero: 'FAC-2024-003',
        client: {
          nom: 'Jean Martin',
          email: 'j.martin@global-trade.fr',
          adresse: '789 Boulevard de la République, 13001 Marseille',
          entreprise: 'Global Trade International'
        },
        dateEmission: '2024-01-25',
        dateEcheance: '2024-02-25',
        montantHT: 2100.00,
        montantTTC: 2520.00,
        tva: 420.00,
        status: 'envoyee',
        currency: 'EUR',
        paymentMethod: 'virement',
        services: [
          { description: 'Expédition conteneur complet', quantite: 1, prixUnitaire: 2100.00, total: 2100.00 }
        ],
        notes: 'Gros client - négociation de tarifs préférentiels'
      },
      {
        id: '4',
        numero: 'FAC-2024-004',
        client: {
          nom: 'Sophie Chen',
          email: 'sophie.chen@import-asia.com',
          adresse: '321 Rue du Commerce, 33000 Bordeaux',
          entreprise: 'Import Asia'
        },
        dateEmission: '2024-02-01',
        dateEcheance: '2024-03-01',
        montantHT: 1800.00,
        montantTTC: 2160.00,
        tva: 360.00,
        status: 'envoyee',
        currency: 'EUR',
        paymentMethod: 'cheque',
        services: [
          { description: 'Transport aérien sécurisé', quantite: 2, prixUnitaire: 900.00, total: 1800.00 }
        ]
      },
      {
        id: '5',
        numero: 'DRAFT-2024-005',
        client: {
          nom: 'Lucas Bernard',
          email: 'lucas.bernard@startup.io',
          adresse: '654 Avenue de l\'Innovation, 59000 Lille',
          entreprise: 'Startup Innovation'
        },
        dateEmission: '2024-02-05',
        dateEcheance: '2024-03-05',
        montantHT: 450.00,
        montantTTC: 540.00,
        tva: 90.00,
        status: 'brouillon',
        currency: 'EUR',
        services: [
          { description: 'Expédition documents', quantite: 10, prixUnitaire: 45.00, total: 450.00 }
        ]
      },
      {
        id: '6',
        numero: 'FAC-2024-006',
        client: {
          nom: 'Emma Rousseau',
          email: 'emma.rousseau@artisan.fr',
          adresse: '987 Place du Marché, 44000 Nantes',
          entreprise: 'Artisanat Traditionnel'
        },
        dateEmission: '2024-02-10',
        dateEcheance: '2024-03-10',
        montantHT: 750.00,
        montantTTC: 900.00,
        tva: 150.00,
        status: 'payee',
        currency: 'EUR',
        paymentMethod: 'especes',
        datePaiement: '2024-03-08',
        services: [
          { description: 'Transport fragile sécurisé', quantite: 1, prixUnitaire: 750.00, total: 750.00 }
        ]
      },
      {
        id: '7',
        numero: 'FAC-2024-007',
        client: {
          nom: 'Thomas Petit',
          email: 'thomas.petit@logistics.com',
          adresse: '147 Zone Industrielle, 67000 Strasbourg',
          entreprise: 'Logistics Pro'
        },
        dateEmission: '2024-02-15',
        dateEcheance: '2024-03-15',
        montantHT: 3200.00,
        montantTTC: 3840.00,
        tva: 640.00,
        status: 'envoyee',
        currency: 'EUR',
        paymentMethod: 'virement',
        services: [
          { description: 'Transport palettisé volume', quantite: 8, prixUnitaire: 400.00, total: 3200.00 }
        ],
        notes: 'Partenaire logistique - facturation mensuelle'
      },
      {
        id: '8',
        numero: 'FAC-2024-008',
        client: {
          nom: 'Camille Durand',
          email: 'camille.durand@e-commerce.fr',
          adresse: '258 Rue de la Tech, 31000 Toulouse',
          entreprise: 'E-Commerce Solutions'
        },
        dateEmission: '2024-02-20',
        dateEcheance: '2024-03-20',
        montantHT: 1150.00,
        montantTTC: 1380.00,
        tva: 230.00,
        status: 'en_retard',
        currency: 'EUR',
        paymentMethod: 'carte',
        services: [
          { description: 'Livraisons express e-commerce', quantite: 15, prixUnitaire: 76.67, total: 1150.00 }
        ]
      }
    ];
  };

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use sample data for now
      const sampleData = generateSampleInvoices();
      setInvoices(sampleData);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

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
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(paginatedInvoices.map(invoice => invoice.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      client: '',
      dateRange: '',
      amountRange: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Advanced filtering and sorting logic
  const filteredAndSortedInvoices = invoices
    .filter(invoice => {
      // Tab filtering
      const matchesTab = activeTab === 'all' || 
                        (activeTab === 'impayees' && ['envoyee', 'en_retard'].includes(invoice.status)) ||
                        (activeTab === 'payees' && invoice.status === 'payee') ||
                        (activeTab === 'brouillons' && invoice.status === 'brouillon');
      
      if (!matchesTab) return false;

      // Search filtering
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          invoice.numero.toLowerCase().includes(searchLower) ||
          invoice.client.nom.toLowerCase().includes(searchLower) ||
          invoice.client.email.toLowerCase().includes(searchLower) ||
          (invoice.client.entreprise && invoice.client.entreprise.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Advanced filtering
      if (filters.status && invoice.status !== filters.status) return false;
      if (filters.client && !invoice.client.nom.toLowerCase().includes(filters.client.toLowerCase())) return false;

      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'numero':
          aValue = a.numero;
          bValue = b.numero;
          break;
        case 'client.nom':
          aValue = a.client.nom;
          bValue = b.client.nom;
          break;
        case 'dateEmission':
          aValue = new Date(a.dateEmission);
          bValue = new Date(b.dateEmission);
          break;
        case 'dateEcheance':
          aValue = new Date(a.dateEcheance);
          bValue = new Date(b.dateEcheance);
          break;
        case 'montantTTC':
          aValue = a.montantTTC;
          bValue = b.montantTTC;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredAndSortedInvoices.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedInvoices([]); // Clear selection when changing pages
    setSelectAll(false);
  };

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.brouillon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {getStatusIcon(status)}
        {config.label}
      </Badge>
    );
  };

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getTotalStats = () => {
    return {
      total: filteredAndSortedInvoices.reduce((sum, inv) => sum + inv.montantTTC, 0),
      paid: filteredAndSortedInvoices.filter(inv => inv.status === 'payee').reduce((sum, inv) => sum + inv.montantTTC, 0),
      pending: filteredAndSortedInvoices.filter(inv => ['envoyee', 'en_retard'].includes(inv.status)).reduce((sum, inv) => sum + inv.montantTTC, 0),
      overdue: filteredAndSortedInvoices.filter(inv => inv.status === 'en_retard').reduce((sum, inv) => sum + inv.montantTTC, 0),
      count: filteredAndSortedInvoices.length
    };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des factures...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Facturation</h1>
            <p className="text-gray-600 mt-2">Gestion des factures et devis</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchInvoices} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Facture
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Facturé</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.total)}</p>
                </div>
                <Euro className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Payé</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Attente</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.pending)}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Retard</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdue)}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="brouillons">Brouillons</TabsTrigger>
            <TabsTrigger value="impayees">Impayées</TabsTrigger>
            <TabsTrigger value="payees">Payées</TabsTrigger>
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
                        placeholder="Rechercher par numéro, client, entreprise..."
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
                      {(filters.status || filters.client) && (
                        <Badge variant="secondary" className="ml-1">
                          {[filters.status, filters.client].filter(Boolean).length}
                        </Badge>
                      )}
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Filtres avancés (repliables) */}
              {showFilters && (
                <CardContent className="border-t bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4">
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
                          <SelectItem value="brouillon">Brouillon</SelectItem>
                          <SelectItem value="envoyee">Envoyée</SelectItem>
                          <SelectItem value="payee">Payée</SelectItem>
                          <SelectItem value="en_retard">En retard</SelectItem>
                          <SelectItem value="annulee">Annulée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Client</Label>
                      <Input
                        placeholder="Nom du client..."
                        value={filters.client}
                        onChange={(e) => setFilters(prev => ({ ...prev, client: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label>Période</Label>
                      <Select 
                        value={filters.dateRange} 
                        onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes les dates" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Toutes les dates</SelectItem>
                          <SelectItem value="7d">7 derniers jours</SelectItem>
                          <SelectItem value="30d">30 derniers jours</SelectItem>
                          <SelectItem value="90d">3 derniers mois</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <CardTitle>Factures ({stats.count})</CardTitle>
                    <CardDescription>
                      {selectedInvoices.length > 0 && `${selectedInvoices.length} facture(s) sélectionnée(s) • `}
                      Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredAndSortedInvoices.length)} sur {filteredAndSortedInvoices.length}
                    </CardDescription>
                  </div>
                  {selectedInvoices.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          Actions ({selectedInvoices.length})
                          <MoreHorizontal className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer les factures
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
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
                          onClick={() => handleSort('numero')}
                        >
                          <div className="flex items-center gap-2">
                            Numéro
                            {getSortIcon('numero')}
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
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('dateEmission')}
                        >
                          <div className="flex items-center gap-2">
                            Émission
                            {getSortIcon('dateEmission')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('dateEcheance')}
                        >
                          <div className="flex items-center gap-2">
                            Échéance
                            {getSortIcon('dateEcheance')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 text-right"
                          onClick={() => handleSort('montantTTC')}
                        >
                          <div className="flex items-center gap-2 justify-end">
                            Montant TTC
                            {getSortIcon('montantTTC')}
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
                      {paginatedInvoices.map((invoice) => (
                        <TableRow key={invoice.id} className="hover:bg-gray-50">
                          <TableCell>
                            <Checkbox
                              checked={selectedInvoices.includes(invoice.id)}
                              onCheckedChange={() => handleSelectInvoice(invoice.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm">{invoice.numero}</div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{invoice.client.nom}</div>
                              <div className="text-sm text-gray-500">{invoice.client.email}</div>
                              {invoice.client.entreprise && (
                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {invoice.client.entreprise}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{formatDate(invoice.dateEmission)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{formatDate(invoice.dateEcheance)}</div>
                            {invoice.status === 'en_retard' && (
                              <div className="text-xs text-red-600 mt-1">En retard</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-semibold">{formatCurrency(invoice.montantTTC)}</div>
                            <div className="text-sm text-gray-500">HT: {formatCurrency(invoice.montantHT)}</div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(invoice.status)}
                            {invoice.datePaiement && (
                              <div className="text-xs text-green-600 mt-1">
                                Payé le {formatDate(invoice.datePaiement)}
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
                                <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Télécharger
                                </DropdownMenuItem>
                                {invoice.status === 'brouillon' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <Send className="h-4 w-4 mr-2" />
                                      Envoyer
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
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
                        <TableHead>Facture</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedInvoices.map((invoice) => (
                        <TableRow key={invoice.id} className="hover:bg-gray-50">
                          <TableCell>
                            <Checkbox
                              checked={selectedInvoices.includes(invoice.id)}
                              onCheckedChange={() => handleSelectInvoice(invoice.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm">{invoice.numero}</div>
                            <div className="text-xs text-gray-500">
                              {formatDate(invoice.dateEmission)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{invoice.client.nom}</div>
                            <div className="text-sm text-gray-500">{invoice.client.email}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-semibold">{formatCurrency(invoice.montantTTC)}</div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(invoice.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Télécharger
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
                  {paginatedInvoices.map((invoice) => (
                    <Card key={invoice.id} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedInvoices.includes(invoice.id)}
                              onCheckedChange={() => handleSelectInvoice(invoice.id)}
                            />
                            <span className="font-mono text-sm text-gray-600">{invoice.numero}</span>
                          </div>
                          {getStatusBadge(invoice.status)}
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <div className="font-semibold">{invoice.client.nom}</div>
                            <div className="text-sm text-gray-600">{invoice.client.email}</div>
                            {invoice.client.entreprise && (
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {invoice.client.entreprise}
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Émission:</span>
                              <div className="font-medium">{formatDate(invoice.dateEmission)}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Échéance:</span>
                              <div className="font-medium">{formatDate(invoice.dateEcheance)}</div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center pt-2">
                            <div>
                              <div className="font-bold text-lg">{formatCurrency(invoice.montantTTC)}</div>
                              <div className="text-sm text-gray-500">HT: {formatCurrency(invoice.montantHT)}</div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Télécharger
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
                {filteredAndSortedInvoices.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune facture trouvée</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || filters.status || filters.client
                        ? 'Aucune facture ne correspond à vos critères de recherche.'
                        : 'Commencez par créer votre première facture.'}
                    </p>
                    {(searchTerm || filters.status || filters.client) && (
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
                      Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredAndSortedInvoices.length)} sur {filteredAndSortedInvoices.length} facture(s)
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Invoice Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la Facture</DialogTitle>
            <DialogDescription>
              Informations complètes de la facture {selectedInvoice?.numero}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Numéro de facture</Label>
                  <p className="font-mono font-medium text-lg">{selectedInvoice.numero}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Statut</Label>
                  <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                </div>
              </div>

              {/* Client Information */}
              <div>
                <Label className="text-sm font-medium text-gray-600">Informations Client</Label>
                <div className="mt-2 bg-green-50 p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-lg">{selectedInvoice.client.nom}</p>
                      <p className="text-sm text-gray-600">{selectedInvoice.client.email}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedInvoice.client.adresse}</p>
                    </div>
                    {selectedInvoice.client.entreprise && (
                      <div>
                        <Label className="text-xs text-gray-500">Entreprise</Label>
                        <p className="text-sm font-medium">{selectedInvoice.client.entreprise}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dates and Amounts */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Date d'émission</Label>
                    <p className="text-sm">{formatDate(selectedInvoice.dateEmission)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Date d'échéance</Label>
                    <p className="text-sm">{formatDate(selectedInvoice.dateEcheance)}</p>
                  </div>
                  {selectedInvoice.paymentMethod && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Méthode de paiement</Label>
                      <p className="text-sm">{selectedInvoice.paymentMethod}</p>
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-3">Montants</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Montant HT:</span>
                      <span className="font-medium">{formatCurrency(selectedInvoice.montantHT)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">TVA:</span>
                      <span className="font-medium">{formatCurrency(selectedInvoice.tva)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium text-gray-900">Total TTC:</span>
                      <span className="font-bold text-lg text-green-600">{formatCurrency(selectedInvoice.montantTTC)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Services */}
              {selectedInvoice.services && selectedInvoice.services.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Services facturés</Label>
                  <div className="mt-2 rounded-md border">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Description</th>
                          <th className="px-4 py-2 text-center">Quantité</th>
                          <th className="px-4 py-2 text-right">Prix unitaire</th>
                          <th className="px-4 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.services.map((service, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">{service.description}</td>
                            <td className="px-4 py-2 text-center">{service.quantite}</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(service.prixUnitaire)}</td>
                            <td className="px-4 py-2 text-right font-medium">{formatCurrency(service.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payment Information */}
              {selectedInvoice.datePaiement && (
                <div className="bg-green-50 p-4 rounded-md">
                  <Label className="text-sm font-medium text-green-800">Facture Payée</Label>
                  <div className="mt-2">
                    <p className="text-sm text-green-700">Payée le: {formatDate(selectedInvoice.datePaiement)}</p>
                    {selectedInvoice.paymentMethod && (
                      <p className="text-sm text-green-700">Méthode: {selectedInvoice.paymentMethod}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedInvoice.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Notes</Label>
                  <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-md mt-2">
                    {selectedInvoice.notes}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Fermer
            </Button>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Télécharger PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}