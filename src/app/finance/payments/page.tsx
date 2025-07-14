'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Plus,
  Download,
  Eye,
  Calendar,
  Euro,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ArrowUpDown,
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

interface Payment {
  id: string;
  reference: string;
  factureId: string;
  factureNumero: string;
  client: {
    nom: string;
    email: string;
    entreprise?: string;
  };
  montant: number;
  devise: string;
  methodePaiement: 'virement' | 'carte' | 'especes' | 'cheque' | 'paypal';
  status: 'en_attente' | 'valide' | 'echec' | 'rembourse';
  dateTransaction: string;
  dateValidation?: string;
  frais: number;
  reference_externe?: string;
  notes?: string;
  operateur?: string;
}

type SortField = 'reference' | 'client.nom' | 'dateTransaction' | 'montant' | 'status' | 'methodePaiement';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  status: string;
  method: string;
  client: string;
  dateRange: string;
  amountRange: string;
}

const statusConfig = {
  en_attente: { label: '⏳ Paiement en attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  valide: { label: '✅ Paiement validé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  echec: { label: '❌ Paiement échoué', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  rembourse: { label: '🔄 Paiement remboursé', color: 'bg-gray-100 text-gray-800', icon: ArrowUpDown }
};

const methodePaiementConfig = {
  virement: { label: '🏦 Virement bancaire', color: 'bg-green-100 text-green-800' },
  carte: { label: '💳 Carte bancaire', color: 'bg-purple-100 text-purple-800' },
  especes: { label: '💵 Paiement espèces', color: 'bg-green-100 text-green-800' },
  cheque: { label: '📄 Chèque bancaire', color: 'bg-orange-100 text-orange-800' },
  paypal: { label: '🌐 PayPal en ligne', color: 'bg-green-100 text-green-800' }
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Professional filtering state
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    method: '',
    client: '',
    dateRange: '',
    amountRange: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('dateTransaction');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selection state
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Sample data for professional demonstration
  const generateSamplePayments = (): Payment[] => {
    return [
      {
        id: '1',
        reference: 'PAY-2024-001',
        factureId: '1',
        factureNumero: 'FAC-2024-001',
        client: {
          nom: 'Pierre Dubois',
          email: 'pierre.dubois@entreprise.fr',
          entreprise: 'TechCorp SARL'
        },
        montant: 1500.00,
        devise: 'EUR',
        methodePaiement: 'virement',
        status: 'valide',
        dateTransaction: '2024-02-10T09:30:00Z',
        dateValidation: '2024-02-10T14:15:00Z',
        frais: 5.50,
        reference_externe: 'VIR240210-001',
        operateur: 'Sarah Martin',
        notes: 'Paiement rapide - client privilégié'
      },
      {
        id: '2',
        reference: 'PAY-2024-002',
        factureId: '2',
        factureNumero: 'FAC-2024-002',
        client: {
          nom: 'Marie Lambert',
          email: 'marie.lambert@boutique.com',
          entreprise: 'Boutique Élégance'
        },
        montant: 1020.00,
        devise: 'EUR',
        methodePaiement: 'carte',
        status: 'en_attente',
        dateTransaction: '2024-02-25T16:45:00Z',
        frais: 25.50,
        reference_externe: 'CB240225-789',
        operateur: 'Thomas Petit'
      },
      {
        id: '3',
        reference: 'PAY-2024-003',
        factureId: '3',
        factureNumero: 'FAC-2024-003',
        client: {
          nom: 'Jean Martin',
          email: 'j.martin@global-trade.fr',
          entreprise: 'Global Trade International'
        },
        montant: 2520.00,
        devise: 'EUR',
        methodePaiement: 'virement',
        status: 'valide',
        dateTransaction: '2024-02-20T11:20:00Z',
        dateValidation: '2024-02-20T15:30:00Z',
        frais: 8.75,
        reference_externe: 'VIR240220-003',
        operateur: 'Emma Rousseau',
        notes: 'Gros client - tarif préférentiel sur les frais'
      },
      {
        id: '4',
        reference: 'PAY-2024-004',
        factureId: '4',
        factureNumero: 'FAC-2024-004',
        client: {
          nom: 'Sophie Chen',
          email: 'sophie.chen@import-asia.com',
          entreprise: 'Import Asia'
        },
        montant: 2160.00,
        devise: 'EUR',
        methodePaiement: 'cheque',
        status: 'en_attente',
        dateTransaction: '2024-02-28T08:15:00Z',
        frais: 15.00,
        reference_externe: 'CHQ-45678912',
        operateur: 'Lucas Bernard',
        notes: 'Chèque en cours de vérification bancaire'
      },
      {
        id: '5',
        reference: 'PAY-2024-005',
        factureId: '6',
        factureNumero: 'FAC-2024-006',
        client: {
          nom: 'Emma Rousseau',
          email: 'emma.rousseau@artisan.fr',
          entreprise: 'Artisanat Traditionnel'
        },
        montant: 900.00,
        devise: 'EUR',
        methodePaiement: 'especes',
        status: 'valide',
        dateTransaction: '2024-03-08T14:30:00Z',
        dateValidation: '2024-03-08T14:30:00Z',
        frais: 0.00,
        operateur: 'Camille Durand',
        notes: 'Paiement en espèces - pas de frais'
      },
      {
        id: '6',
        reference: 'PAY-2024-006',
        factureId: '8',
        factureNumero: 'FAC-2024-008',
        client: {
          nom: 'Camille Durand',
          email: 'camille.durand@e-commerce.fr',
          entreprise: 'E-Commerce Solutions'
        },
        montant: 1380.00,
        devise: 'EUR',
        methodePaiement: 'paypal',
        status: 'echec',
        dateTransaction: '2024-03-15T10:45:00Z',
        frais: 41.40,
        reference_externe: 'PP-TXN-987654321',
        operateur: 'Pierre Dubois',
        notes: 'Erreur PayPal - fonds insuffisants'
      },
      {
        id: '7',
        reference: 'PAY-2024-007',
        factureId: '7',
        factureNumero: 'FAC-2024-007',
        client: {
          nom: 'Thomas Petit',
          email: 'thomas.petit@logistics.com',
          entreprise: 'Logistics Pro'
        },
        montant: 3840.00,
        devise: 'EUR',
        methodePaiement: 'virement',
        status: 'valide',
        dateTransaction: '2024-03-10T13:20:00Z',
        dateValidation: '2024-03-10T16:45:00Z',
        frais: 12.50,
        reference_externe: 'VIR240310-007',
        operateur: 'Marie Lambert',
        notes: 'Partenaire logistique - paiement mensuel'
      },
      {
        id: '8',
        reference: 'PAY-2024-008',
        factureId: '2',
        factureNumero: 'FAC-2024-002-REMB',
        client: {
          nom: 'Marie Lambert',
          email: 'marie.lambert@boutique.com',
          entreprise: 'Boutique Élégance'
        },
        montant: -510.00,
        devise: 'EUR',
        methodePaiement: 'virement',
        status: 'rembourse',
        dateTransaction: '2024-03-18T09:15:00Z',
        dateValidation: '2024-03-18T11:30:00Z',
        frais: 8.50,
        reference_externe: 'REMB240318-002',
        operateur: 'Sophie Chen',
        notes: 'Remboursement partiel suite à réclamation client'
      }
    ];
  };

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use sample data for now
      const sampleData = generateSamplePayments();
      setPayments(sampleData);
    } catch (error) {
      console.error('Erreur lors du chargement des paiements:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

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
      setSelectedPayments([]);
    } else {
      setSelectedPayments(paginatedPayments.map(payment => payment.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectPayment = (paymentId: string) => {
    setSelectedPayments(prev => 
      prev.includes(paymentId) 
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      method: '',
      client: '',
      dateRange: '',
      amountRange: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Advanced filtering and sorting logic
  const filteredAndSortedPayments = payments
    .filter(payment => {
      // Tab filtering
      const matchesTab = activeTab === 'all' || 
                        (activeTab === 'valides' && payment.status === 'valide') ||
                        (activeTab === 'en_attente' && payment.status === 'en_attente') ||
                        (activeTab === 'problemes' && ['echec', 'rembourse'].includes(payment.status));
      
      if (!matchesTab) return false;

      // Search filtering
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          payment.reference.toLowerCase().includes(searchLower) ||
          payment.factureNumero.toLowerCase().includes(searchLower) ||
          payment.client.nom.toLowerCase().includes(searchLower) ||
          payment.client.email.toLowerCase().includes(searchLower) ||
          (payment.client.entreprise && payment.client.entreprise.toLowerCase().includes(searchLower)) ||
          (payment.reference_externe && payment.reference_externe.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Advanced filtering
      if (filters.status && payment.status !== filters.status) return false;
      if (filters.method && payment.methodePaiement !== filters.method) return false;
      if (filters.client && !payment.client.nom.toLowerCase().includes(filters.client.toLowerCase())) return false;

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
        case 'dateTransaction':
          aValue = new Date(a.dateTransaction);
          bValue = new Date(b.dateTransaction);
          break;
        case 'montant':
          aValue = a.montant;
          bValue = b.montant;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'methodePaiement':
          aValue = a.methodePaiement;
          bValue = b.methodePaiement;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPayments = filteredAndSortedPayments.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedPayments([]); // Clear selection when changing pages
    setSelectAll(false);
  };

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.en_attente;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {getStatusIcon(status)}
        {config.label}
      </Badge>
    );
  };

  const getMethodeBadge = (methode: string) => {
    const config = methodePaiementConfig[methode as keyof typeof methodePaiementConfig] || methodePaiementConfig.virement;
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalStats = () => {
    return {
      total: filteredAndSortedPayments.reduce((sum, payment) => sum + payment.montant, 0),
      valides: filteredAndSortedPayments.filter(p => p.status === 'valide').reduce((sum, payment) => sum + payment.montant, 0),
      en_attente: filteredAndSortedPayments.filter(p => p.status === 'en_attente').reduce((sum, payment) => sum + payment.montant, 0),
      frais_total: filteredAndSortedPayments.reduce((sum, payment) => sum + payment.frais, 0),
      count: filteredAndSortedPayments.length
    };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des paiements...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Paiements</h1>
            <p className="text-gray-600 mt-2">Suivi des paiements et encaissements</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchPayments} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Paiement
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reçu</p>
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
                  <p className="text-sm font-medium text-gray-600">Validés</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.valides)}</p>
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
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.en_attente)}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Frais Totaux</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.frais_total)}</p>
                </div>
                <CreditCard className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="valides">Validés</TabsTrigger>
            <TabsTrigger value="en_attente">En attente</TabsTrigger>
            <TabsTrigger value="problemes">Problèmes</TabsTrigger>
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
                        placeholder="Rechercher par référence, facture, client..."
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
                      {(filters.status || filters.method || filters.client) && (
                        <Badge variant="secondary" className="ml-1">
                          {[filters.status, filters.method, filters.client].filter(Boolean).length}
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
                          <SelectItem value="en_attente">En attente</SelectItem>
                          <SelectItem value="valide">Validé</SelectItem>
                          <SelectItem value="echec">Échec</SelectItem>
                          <SelectItem value="rembourse">Remboursé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Méthode</Label>
                      <Select 
                        value={filters.method} 
                        onValueChange={(value) => setFilters(prev => ({ ...prev, method: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes les méthodes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Toutes les méthodes</SelectItem>
                          <SelectItem value="virement">Virement</SelectItem>
                          <SelectItem value="carte">Carte bancaire</SelectItem>
                          <SelectItem value="especes">Espèces</SelectItem>
                          <SelectItem value="cheque">Chèque</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
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
                    <CardTitle>Paiements ({stats.count})</CardTitle>
                    <CardDescription>
                      {selectedPayments.length > 0 && `${selectedPayments.length} paiement(s) sélectionné(s) • `}
                      Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredAndSortedPayments.length)} sur {filteredAndSortedPayments.length}
                    </CardDescription>
                  </div>
                  {selectedPayments.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          Actions ({selectedPayments.length})
                          <MoreHorizontal className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Valider les paiements
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Exporter la sélection
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
                        <TableHead>Facture</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('dateTransaction')}
                        >
                          <div className="flex items-center gap-2">
                            Transaction
                            {getSortIcon('dateTransaction')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 text-right"
                          onClick={() => handleSort('montant')}
                        >
                          <div className="flex items-center gap-2 justify-end">
                            Montant
                            {getSortIcon('montant')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('methodePaiement')}
                        >
                          <div className="flex items-center gap-2">
                            Méthode
                            {getSortIcon('methodePaiement')}
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
                      {paginatedPayments.map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-gray-50">
                          <TableCell>
                            <Checkbox
                              checked={selectedPayments.includes(payment.id)}
                              onCheckedChange={() => handleSelectPayment(payment.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm">{payment.reference}</div>
                            {payment.reference_externe && (
                              <div className="text-xs text-gray-500">{payment.reference_externe}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{payment.client.nom}</div>
                              <div className="text-sm text-gray-500">{payment.client.email}</div>
                              {payment.client.entreprise && (
                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {payment.client.entreprise}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm">{payment.factureNumero}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{formatDateTime(payment.dateTransaction)}</div>
                            {payment.dateValidation && (
                              <div className="text-xs text-green-600 mt-1">
                                Validé: {formatDateTime(payment.dateValidation)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className={`font-semibold ${payment.montant < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(payment.montant, payment.devise)}
                            </div>
                            {payment.frais > 0 && (
                              <div className="text-sm text-gray-500">Frais: {formatCurrency(payment.frais, payment.devise)}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {getMethodeBadge(payment.methodePaiement)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(payment.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
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
                                {payment.status === 'en_attente' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Valider
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
                        <TableHead>Paiement</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPayments.map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-gray-50">
                          <TableCell>
                            <Checkbox
                              checked={selectedPayments.includes(payment.id)}
                              onCheckedChange={() => handleSelectPayment(payment.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm">{payment.reference}</div>
                            <div className="text-xs text-gray-500">
                              {formatDateTime(payment.dateTransaction)}
                            </div>
                            <div className="text-xs text-gray-500">{payment.factureNumero}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{payment.client.nom}</div>
                            <div className="text-sm text-gray-500">{payment.client.email}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className={`font-semibold ${payment.montant < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(payment.montant, payment.devise)}
                            </div>
                            {getMethodeBadge(payment.methodePaiement)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(payment.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
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
                  {paginatedPayments.map((payment) => (
                    <Card key={payment.id} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedPayments.includes(payment.id)}
                              onCheckedChange={() => handleSelectPayment(payment.id)}
                            />
                            <span className="font-mono text-sm text-gray-600">{payment.reference}</span>
                          </div>
                          {getStatusBadge(payment.status)}
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <div className="font-semibold">{payment.client.nom}</div>
                            <div className="text-sm text-gray-600">{payment.client.email}</div>
                            {payment.client.entreprise && (
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {payment.client.entreprise}
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Facture:</span>
                              <div className="font-medium">{payment.factureNumero}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Transaction:</span>
                              <div className="font-medium">{formatDateTime(payment.dateTransaction)}</div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center pt-2">
                            <div>
                              <div className={`font-bold text-lg ${payment.montant < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(payment.montant, payment.devise)}
                              </div>
                              {getMethodeBadge(payment.methodePaiement)}
                              {payment.frais > 0 && (
                                <div className="text-sm text-gray-500">Frais: {formatCurrency(payment.frais, payment.devise)}</div>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
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
                {filteredAndSortedPayments.length === 0 && (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun paiement trouvé</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || filters.status || filters.method || filters.client
                        ? 'Aucun paiement ne correspond à vos critères de recherche.'
                        : 'Commencez par enregistrer votre premier paiement.'}
                    </p>
                    {(searchTerm || filters.status || filters.method || filters.client) && (
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
                      Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredAndSortedPayments.length)} sur {filteredAndSortedPayments.length} paiement(s)
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
    </MainLayout>
  );
}