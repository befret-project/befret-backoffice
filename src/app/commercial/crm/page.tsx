'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Search, 
  Filter, 
  Plus,
  Phone,
  Mail,
  MapPin,
  Eye,
  Edit,
  Star,
  Building,
  User,
  RefreshCw,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Download,
  XCircle,
  Trash2,
  UserPlus
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

interface Client {
  id: string;
  nom: string;
  email: string;
  telephone?: string;
  entreprise?: string;
  secteur: string;
  statut: 'prospect' | 'client' | 'inactif';
  source: 'web' | 'referral' | 'publicite' | 'cold_call' | 'salon';
  valeurVie: number;
  nombreCommandes: number;
  derniereCommande?: string;
  dateCreation: string;
  adresse: {
    rue: string;
    ville: string;
    codePostal: string;
    pays: string;
  };
  notes?: string;
  commercial?: string;
}

type SortField = 'nom' | 'email' | 'entreprise' | 'secteur' | 'statut' | 'valeurVie' | 'dateCreation';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  statut: string;
  secteur: string;
  source: string;
  commercial: string;
}

const statutConfig = {
  prospect: { label: 'Prospect', color: 'bg-yellow-100 text-yellow-800' },
  client: { label: 'Client', color: 'bg-green-100 text-green-800' },
  inactif: { label: 'Inactif', color: 'bg-gray-100 text-gray-800' }
};

const sourceConfig = {
  web: { label: 'Site Web', color: 'bg-green-100 text-green-800' },
  referral: { label: 'Recommandation', color: 'bg-purple-100 text-purple-800' },
  publicite: { label: 'Publicité', color: 'bg-orange-100 text-orange-800' },
  cold_call: { label: 'Démarchage', color: 'bg-red-100 text-red-800' },
  salon: { label: 'Salon/Événement', color: 'bg-green-100 text-green-800' }
};

const secteurLabels: { [key: string]: string } = {
  'e-commerce': 'E-commerce',
  'logistics': 'Logistique',
  'retail': 'Commerce de détail',
  'manufacturing': 'Industrie',
  'services': 'Services',
  'healthcare': 'Santé',
  'technology': 'Technologie',
  'education': 'Éducation'
};

const commercialLabels: { [key: string]: string } = {
  'marie.martin': 'Marie Martin',
  'jean.dupont': 'Jean Dupont',
  'sophie.bernard': 'Sophie Bernard',
  'pierre.moreau': 'Pierre Moreau'
};

// Données d'exemple réalistes pour le CRM
const generateSampleClients = (): Client[] => {
  return [
    {
      id: '1',
      nom: 'Jean Durand',
      email: 'jean.durand@techcorp.fr',
      telephone: '+33 1 42 86 75 90',
      entreprise: 'TechCorp France',
      secteur: 'technology',
      statut: 'client',
      source: 'web',
      valeurVie: 15750,
      nombreCommandes: 12,
      derniereCommande: '2024-06-15T10:30:00Z',
      dateCreation: '2023-03-15T09:00:00Z',
      adresse: {
        rue: '15 Avenue des Champs-Élysées',
        ville: 'Paris',
        codePostal: '75008',
        pays: 'France'
      },
      notes: 'Client VIP - très satisfait du service, commandes régulières',
      commercial: 'marie.martin'
    },
    {
      id: '2',
      nom: 'Marie Leroy',
      email: 'marie.leroy@logismart.com',
      telephone: '+33 4 78 94 32 15',
      entreprise: 'LogiSmart Solutions',
      secteur: 'logistics',
      statut: 'client',
      source: 'referral',
      valeurVie: 28900,
      nombreCommandes: 35,
      derniereCommande: '2024-06-28T14:20:00Z',
      dateCreation: '2022-11-10T11:15:00Z',
      adresse: {
        rue: '78 Rue de la République',
        ville: 'Lyon',
        codePostal: '69002',
        pays: 'France'
      },
      notes: 'Partenaire stratégique - volume important, négociation tarifaire en cours',
      commercial: 'jean.dupont'
    },
    {
      id: '3',
      nom: 'Sophie Moreau',
      email: 'sophie.m@boutiquenligne.fr',
      telephone: '+33 5 56 23 89 47',
      entreprise: 'Boutique en Ligne',
      secteur: 'e-commerce',
      statut: 'prospect',
      source: 'publicite',
      valeurVie: 0,
      nombreCommandes: 0,
      dateCreation: '2024-06-20T16:45:00Z',
      adresse: {
        rue: '23 Cours de l\'Intendance',
        ville: 'Bordeaux',
        codePostal: '33000',
        pays: 'France'
      },
      notes: 'Intéressée par nos services, devis en cours',
      commercial: 'sophie.bernard'
    },
    {
      id: '4',
      nom: 'Pierre Dubois',
      email: 'p.dubois@industrieplus.com',
      telephone: '+33 3 20 45 67 83',
      entreprise: 'Industrie Plus',
      secteur: 'manufacturing',
      statut: 'client',
      source: 'salon',
      valeurVie: 45200,
      nombreCommandes: 67,
      derniereCommande: '2024-06-25T09:15:00Z',
      dateCreation: '2021-09-05T13:30:00Z',
      adresse: {
        rue: '45 Zone Industrielle Nord',
        ville: 'Lille',
        codePostal: '59000',
        pays: 'France'
      },
      commercial: 'pierre.moreau'
    },
    {
      id: '5',
      nom: 'Amélie Rousseau',
      email: 'amelie.rousseau@sante-connect.fr',
      telephone: '+33 4 91 52 38 76',
      entreprise: 'Santé Connect',
      secteur: 'healthcare',
      statut: 'client',
      source: 'referral',
      valeurVie: 12400,
      nombreCommandes: 8,
      derniereCommande: '2024-06-10T11:45:00Z',
      dateCreation: '2023-08-20T10:00:00Z',
      adresse: {
        rue: '12 Boulevard de la Médecine',
        ville: 'Marseille',
        codePostal: '13001',
        pays: 'France'
      },
      notes: 'Secteur sensible - respect strict des délais requis',
      commercial: 'marie.martin'
    },
    {
      id: '6',
      nom: 'Thomas Martin',
      email: 'thomas@educatech.org',
      entreprise: 'EducaTech',
      secteur: 'education',
      statut: 'prospect',
      source: 'cold_call',
      valeurVie: 0,
      nombreCommandes: 0,
      dateCreation: '2024-06-18T14:20:00Z',
      adresse: {
        rue: '33 Rue de l\'Université',
        ville: 'Toulouse',
        codePostal: '31000',
        pays: 'France'
      },
      notes: 'Premier contact établi, en phase de découverte des besoins',
      commercial: 'sophie.bernard'
    },
    {
      id: '7',
      nom: 'Isabelle Bernard',
      email: 'i.bernard@retailmax.fr',
      telephone: '+33 2 40 87 65 21',
      entreprise: 'RetailMax',
      secteur: 'retail',
      statut: 'inactif',
      source: 'web',
      valeurVie: 8900,
      nombreCommandes: 15,
      derniereCommande: '2023-12-15T15:30:00Z',
      dateCreation: '2022-05-12T08:45:00Z',
      adresse: {
        rue: '67 Rue du Commerce',
        ville: 'Nantes',
        codePostal: '44000',
        pays: 'France'
      },
      notes: 'Client inactif depuis 6 mois - relance prévue',
      commercial: 'jean.dupont'
    },
    {
      id: '8',
      nom: 'Nicolas Petit',
      email: 'n.petit@serviceplus.com',
      telephone: '+33 1 45 23 67 89',
      entreprise: 'Service Plus',
      secteur: 'services',
      statut: 'client',
      source: 'referral',
      valeurVie: 19600,
      nombreCommandes: 23,
      derniereCommande: '2024-06-22T13:10:00Z',
      dateCreation: '2023-01-08T14:20:00Z',
      adresse: {
        rue: '89 Avenue de la Grande Armée',
        ville: 'Paris',
        codePostal: '75017',
        pays: 'France'
      },
      commercial: 'pierre.moreau'
    }
  ];
};

export default function CRMPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États pour la recherche et filtrage
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // États pour pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // États pour tri
  const [sortField, setSortField] = useState<SortField>('dateCreation');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // États pour filtres
  const [filters, setFilters] = useState<FilterState>({
    statut: 'all',
    secteur: 'all',
    source: 'all',
    commercial: 'all'
  });
  
  // États pour sélection
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  
  // États pour dialogue
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    nom: '',
    email: '',
    telephone: '',
    entreprise: '',
    secteur: '',
    statut: 'prospect' as const,
    source: 'web' as const
  });

  useEffect(() => {
    const loadClients = async () => {
      setLoading(true);
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setClients(generateSampleClients());
      setLoading(false);
    };
    loadClients();
  }, []);

  // Logique de filtrage et tri
  const filteredAndSortedClients = clients
    .filter(client => {
      // Filtrage par recherche textuelle
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matches = 
          client.nom.toLowerCase().includes(searchLower) ||
          client.email.toLowerCase().includes(searchLower) ||
          (client.entreprise && client.entreprise.toLowerCase().includes(searchLower));
        if (!matches) return false;
      }
      
      // Filtrage par critères
      if (filters.statut !== 'all' && client.statut !== filters.statut) return false;
      if (filters.secteur !== 'all' && client.secteur !== filters.secteur) return false;
      if (filters.source !== 'all' && client.source !== filters.source) return false;
      if (filters.commercial !== 'all' && client.commercial !== filters.commercial) return false;
      
      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'nom':
          aValue = a.nom || '';
          bValue = b.nom || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'entreprise':
          aValue = a.entreprise || '';
          bValue = b.entreprise || '';
          break;
        case 'secteur':
          aValue = a.secteur || '';
          bValue = b.secteur || '';
          break;
        case 'statut':
          aValue = a.statut || '';
          bValue = b.statut || '';
          break;
        case 'valeurVie':
          aValue = a.valeurVie || 0;
          bValue = b.valeurVie || 0;
          break;
        case 'dateCreation':
        default:
          aValue = new Date(a.dateCreation || 0).getTime();
          bValue = new Date(b.dateCreation || 0).getTime();
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
  
  // Pagination
  const totalItems = filteredAndSortedClients.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredAndSortedClients.slice(startIndex, startIndex + itemsPerPage);
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

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

  const clearFilters = () => {
    setFilters({
      statut: 'all',
      secteur: 'all',
      source: 'all',
      commercial: 'all'
    });
    setSearchTerm('');
  };

  const handleSelectAll = () => {
    if (selectedClients.size === paginatedClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(paginatedClients.map(c => c.id)));
    }
  };

  const handleSelectClient = (id: string) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedClients(newSelected);
  };

  const getStatutBadge = (statut: string) => {
    const config = statutConfig[statut as keyof typeof statutConfig] || statutConfig.prospect;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    const config = sourceConfig[source as keyof typeof sourceConfig] || sourceConfig.web;
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleCreateClient = () => {
    if (!newClient.nom || !newClient.email) {
      alert('Veuillez remplir au moins le nom et l\'email');
      return;
    }

    const client: Client = {
      id: Date.now().toString(),
      nom: newClient.nom,
      email: newClient.email,
      telephone: newClient.telephone,
      entreprise: newClient.entreprise,
      secteur: newClient.secteur,
      statut: newClient.statut,
      source: newClient.source,
      valeurVie: 0,
      nombreCommandes: 0,
      dateCreation: new Date().toISOString(),
      adresse: {
        rue: '',
        ville: '',
        codePostal: '',
        pays: 'France'
      }
    };

    setClients([client, ...clients]);
    setNewClient({
      nom: '',
      email: '',
      telephone: '',
      entreprise: '',
      secteur: '',
      statut: 'prospect',
      source: 'web'
    });
    setIsCreateDialogOpen(false);
  };

  const deleteClient = (clientId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      setClients(clients.filter(client => client.id !== clientId));
    }
  };

  // Statistiques
  const stats = {
    total: clients.length,
    prospects: clients.filter(c => c.statut === 'prospect').length,
    clients_actifs: clients.filter(c => c.statut === 'client').length,
    inactifs: clients.filter(c => c.statut === 'inactif').length,
    valeur_totale: clients.reduce((sum, client) => sum + client.valeurVie, 0),
    vip: clients.filter(c => c.valeurVie > 20000).length
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-96"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </CardContent>
              </Card>
            ))}
          </div>
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
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">CRM Clients</h1>
              <p className="mt-2 text-slate-600">
                Gestion de la relation client et des prospects
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-10 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-md transition-all duration-200">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nouveau Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Créer un nouveau client</DialogTitle>
                  <DialogDescription>
                    Ajoutez un nouveau client ou prospect dans votre CRM.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nom" className="text-right">
                      Nom *
                    </Label>
                    <Input
                      id="nom"
                      placeholder="Jean Dupont"
                      value={newClient.nom}
                      onChange={(e) => setNewClient({ ...newClient, nom: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="jean@entreprise.com"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="entreprise" className="text-right">
                      Entreprise
                    </Label>
                    <Input
                      id="entreprise"
                      placeholder="Mon Entreprise"
                      value={newClient.entreprise}
                      onChange={(e) => setNewClient({ ...newClient, entreprise: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="secteur" className="text-right">
                      Secteur
                    </Label>
                    <Select value={newClient.secteur} onValueChange={(value) => setNewClient({ ...newClient, secteur: value })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Sélectionner un secteur" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(secteurLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateClient}>
                    Créer le client
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="shadow-sm border-slate-200 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">Total Contacts</CardTitle>
              <div className="p-2 rounded-xl bg-green-600 shadow-lg">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
              <p className="text-xs text-slate-600 mt-1">Tous les contacts</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-slate-200 rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100 border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">Prospects</CardTitle>
              <div className="p-2 rounded-xl bg-yellow-600 shadow-lg">
                <Star className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-700">{stats.prospects}</div>
              <p className="text-xs text-slate-600 mt-1">En prospection</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-slate-200 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">Clients Actifs</CardTitle>
              <div className="p-2 rounded-xl bg-green-600 shadow-lg">
                <User className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{stats.clients_actifs}</div>
              <p className="text-xs text-slate-600 mt-1">Clients fidèles</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">Inactifs</CardTitle>
              <div className="p-2 rounded-xl bg-red-600 shadow-lg">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-700">{stats.inactifs}</div>
              <p className="text-xs text-slate-600 mt-1">À réactiver</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">Clients VIP</CardTitle>
              <div className="p-2 rounded-xl bg-purple-600 shadow-lg">
                <Star className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">{stats.vip}</div>
              <p className="text-xs text-slate-600 mt-1">Valeur &gt; 20k€</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-slate-200 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">Valeur Totale</CardTitle>
              <div className="p-2 rounded-xl bg-emerald-600 shadow-lg">
                <Building className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">{formatCurrency(stats.valeur_totale)}</div>
              <p className="text-xs text-slate-600 mt-1">Lifetime value</p>
            </CardContent>
          </Card>
        </div>

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
                  <Select value={filters.statut} onValueChange={(value) => handleFilterChange('statut', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="inactif">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Secteur</label>
                  <Select value={filters.secteur} onValueChange={(value) => handleFilterChange('secteur', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les secteurs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les secteurs</SelectItem>
                      {Object.entries(secteurLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Source</label>
                  <Select value={filters.source} onValueChange={(value) => handleFilterChange('source', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les sources</SelectItem>
                      {Object.entries(sourceConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Commercial</label>
                  <Select value={filters.commercial} onValueChange={(value) => handleFilterChange('commercial', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les commerciaux" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les commerciaux</SelectItem>
                      {Object.entries(commercialLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

        {/* Recherche */}
        <Card className="shadow-sm border-slate-200 rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-slate-900">
              <Search className="h-5 w-5 text-green-600" />
              <span>Rechercher des clients</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, email ou entreprise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 border-slate-300 focus:border-green-500 focus:ring-green-500 rounded-xl"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table des clients */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-slate-900">
                  Clients & Prospects
                </CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  {totalItems} contact{totalItems > 1 ? 's' : ''} {searchTerm || Object.values(filters).some(f => f !== 'all') ? 'trouvé' : 'au total'}{totalItems > 1 ? 's' : ''}
                </p>
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
                  onClick={() => window.location.reload()}
                  className="h-9"
                >
                  <RefreshCw className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Actualiser</span>
                </Button>
                {selectedClients.size > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9">
                        <span className="sm:hidden">({selectedClients.size})</span>
                        <span className="hidden sm:inline">Actions ({selectedClients.size})</span>
                        <MoreHorizontal className="h-4 w-4 ml-1 sm:ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Exporter sélection
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        Marquer comme clients
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {paginatedClients.length > 0 ? (
              <div>
                {/* Table desktop */}
                <div className="hidden lg:block overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedClients.size === paginatedClients.length && paginatedClients.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('nom')}>
                          <div className="flex items-center space-x-1">
                            <span>Nom</span>
                            {sortField === 'nom' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('email')}>
                          <div className="flex items-center space-x-1">
                            <span>Email</span>
                            {sortField === 'email' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('entreprise')}>
                          <div className="flex items-center space-x-1">
                            <span>Entreprise</span>
                            {sortField === 'entreprise' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('secteur')}>
                          <div className="flex items-center space-x-1">
                            <span>Secteur</span>
                            {sortField === 'secteur' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('statut')}>
                          <div className="flex items-center space-x-1">
                            <span>Statut</span>
                            {sortField === 'statut' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('valeurVie')}>
                          <div className="flex items-center space-x-1">
                            <span>Valeur vie</span>
                            {sortField === 'valeurVie' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('dateCreation')}>
                          <div className="flex items-center space-x-1">
                            <span>Créé le</span>
                            {sortField === 'dateCreation' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedClients.map((client) => (
                        <TableRow 
                          key={client.id} 
                          className="hover:bg-slate-50 transition-colors"
                          data-state={selectedClients.has(client.id) ? 'selected' : ''}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedClients.has(client.id)}
                              onCheckedChange={() => handleSelectClient(client.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                                <User className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <span className="font-medium">{client.nom}</span>
                                {client.valeurVie > 20000 && (
                                  <Star className="h-3 w-3 text-yellow-500 inline ml-1" />
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Mail className="h-3 w-3 text-slate-500" />
                              <span className="text-sm">{client.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-600">{client.entreprise || '-'}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                              {secteurLabels[client.secteur] || client.secteur}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatutBadge(client.statut)}
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-green-600">{formatCurrency(client.valeurVie)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-600">
                              {formatDate(client.dateCreation)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Voir les détails
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => deleteClient(client.id)}
                                >
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
                </div>

                {/* Table tablette */}
                <div className="hidden md:block lg:hidden overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedClients.size === paginatedClients.length && paginatedClients.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors min-w-[150px]" onClick={() => handleSort('nom')}>
                          <div className="flex items-center space-x-1">
                            <span>Nom</span>
                            {sortField === 'nom' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors min-w-[120px]" onClick={() => handleSort('entreprise')}>
                          <div className="flex items-center space-x-1">
                            <span>Entreprise</span>
                            {sortField === 'entreprise' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('statut')}>
                          <div className="flex items-center space-x-1">
                            <span>Statut</span>
                            {sortField === 'statut' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedClients.map((client) => (
                        <TableRow 
                          key={client.id} 
                          className="hover:bg-slate-50 transition-colors"
                          data-state={selectedClients.has(client.id) ? 'selected' : ''}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedClients.has(client.id)}
                              onCheckedChange={() => handleSelectClient(client.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                                <User className="h-3 w-3 text-green-600" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">{client.nom}</div>
                                <div className="text-xs text-slate-500 max-w-[120px] truncate">{client.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-600">{client.entreprise || '-'}</span>
                          </TableCell>
                          <TableCell>
                            {getStatutBadge(client.statut)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteClient(client.id)}>
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
                </div>

                {/* Vue mobile en cartes */}
                <div className="block md:hidden space-y-4 p-4">
                  {paginatedClients.map((client) => (
                    <div key={client.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedClients.has(client.id)}
                            onCheckedChange={() => handleSelectClient(client.id)}
                          />
                          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                            <User className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm flex items-center">
                              {client.nom}
                              {client.valeurVie > 20000 && (
                                <Star className="h-3 w-3 text-yellow-500 ml-1" />
                              )}
                            </h3>
                            <p className="text-xs text-slate-500 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {client.email}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteClient(client.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                        <div>
                          <p className="text-slate-500 text-xs">Entreprise</p>
                          <p className="font-medium text-xs">{client.entreprise || '-'}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Statut</p>
                          {getStatutBadge(client.statut)}
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Secteur</p>
                          <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 text-xs mt-1">
                            {secteurLabels[client.secteur] || client.secteur}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Valeur vie</p>
                          <p className="font-semibold text-xs text-green-600">{formatCurrency(client.valeurVie)}</p>
                        </div>
                      </div>
                      
                      {client.telephone && (
                        <div className="flex items-center text-xs text-slate-600 mb-2">
                          <Phone className="h-3 w-3 mr-2" />
                          {client.telephone}
                        </div>
                      )}
                    </div>
                  ))}
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
                      disabled={currentPage === 1}
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
                      disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
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
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun client trouvé</h3>
                <p className="text-gray-500">
                  Essayez de modifier vos critères de recherche ou créez un nouveau client
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}