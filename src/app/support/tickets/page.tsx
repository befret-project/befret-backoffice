'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Plus,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  RefreshCw,
  Download,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Building,
  FileText
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

interface Ticket {
  id: string;
  numero: string;
  sujet: string;
  description: string;
  status: 'ouvert' | 'en_cours' | 'resolu' | 'ferme';
  priorite: 'basse' | 'normale' | 'haute' | 'critique';
  categorie: 'technique' | 'commercial' | 'livraison' | 'facturation' | 'autre';
  client: {
    nom: string;
    email: string;
    telephone?: string;
    entreprise?: string;
  };
  agent?: {
    nom: string;
    email: string;
  };
  dateCreation: string;
  dateMiseAJour: string;
  dateResolution?: string;
  tempsResolution?: number; // en heures
  satisfaction?: number; // note de 1 à 5
  canal: 'email' | 'telephone' | 'chat' | 'formulaire';
  pieces_jointes?: string[];
  commentaires_internes?: string;
}

type SortField = 'numero' | 'sujet' | 'client.nom' | 'status' | 'priorite' | 'dateCreation' | 'dateMiseAJour' | 'categorie';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  status: string;
  priorite: string;
  categorie: string;
  agent: string;
  canal: string;
  dateRange: string;
}

const statusConfig = {
  ouvert: { label: '🔴 Nouveau ticket ouvert', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  en_cours: { label: '🔵 En cours de traitement', color: 'bg-green-100 text-green-800', icon: Clock },
  resolu: { label: '✅ Problème résolu', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  ferme: { label: '📁 Ticket fermé', color: 'bg-gray-100 text-gray-800', icon: XCircle }
};

const prioriteConfig = {
  basse: { label: '📋 Priorité basse', color: 'bg-gray-100 text-gray-800' },
  normale: { label: '📌 Priorité normale', color: 'bg-green-100 text-green-800' },
  haute: { label: '⚡ Priorité haute', color: 'bg-orange-100 text-orange-800' },
  critique: { label: '🚨 Priorité critique', color: 'bg-red-100 text-red-800' }
};

const categorieConfig = {
  technique: { label: '⚙️ Problème technique', color: 'bg-purple-100 text-purple-800' },
  commercial: { label: '💼 Question commerciale', color: 'bg-green-100 text-green-800' },
  livraison: { label: '🚚 Problème de livraison', color: 'bg-green-100 text-green-800' },
  facturation: { label: '💰 Question de facturation', color: 'bg-yellow-100 text-yellow-800' },
  autre: { label: '📝 Autre demande', color: 'bg-gray-100 text-gray-800' }
};

const canalConfig = {
  email: { label: '📧 Reçu par email', color: 'bg-green-100 text-green-800', icon: Mail },
  telephone: { label: '📞 Appel téléphonique', color: 'bg-green-100 text-green-800', icon: Phone },
  chat: { label: '💬 Chat en ligne', color: 'bg-purple-100 text-purple-800', icon: MessageSquare },
  formulaire: { label: '📝 Formulaire web', color: 'bg-orange-100 text-orange-800', icon: Edit }
};

// Données d'exemple pour demonstration
const generateSampleTickets = (): Ticket[] => {
  return [
    {
      id: '1',
      numero: 'TIC-2024-001',
      sujet: 'Problème de livraison retardée',
      description: 'Mon colis devait arriver le 15 janvier mais n\'est toujours pas livré. Le tracking indique qu\'il est bloqué à l\'entrepôt.',
      status: 'en_cours',
      priorite: 'haute',
      categorie: 'livraison',
      client: {
        nom: 'Marie Dubois',
        email: 'marie.dubois@example.fr',
        telephone: '+33 1 23 45 67 89',
        entreprise: 'Boutique Mode'
      },
      agent: {
        nom: 'Sophie Martin',
        email: 'sophie.martin@befret.com'
      },
      dateCreation: '2024-01-16T08:30:00Z',
      dateMiseAJour: '2024-01-16T14:15:00Z',
      tempsResolution: 2.5,
      canal: 'email',
      pieces_jointes: ['tracking.pdf'],
      commentaires_internes: 'Vérifier avec l\'équipe logistique'
    },
    {
      id: '2',
      numero: 'TIC-2024-002',
      sujet: 'Erreur de facturation',
      description: 'Je constate une erreur sur ma facture F-2024-0156. Le montant de la TVA semble incorrect.',
      status: 'ouvert',
      priorite: 'normale',
      categorie: 'facturation',
      client: {
        nom: 'Jean Martineau',
        email: 'j.martineau@entreprise.com',
        telephone: '+33 2 34 56 78 90',
        entreprise: 'Import Export SA'
      },
      dateCreation: '2024-01-15T14:22:00Z',
      dateMiseAJour: '2024-01-15T14:22:00Z',
      canal: 'formulaire',
      pieces_jointes: ['facture_F-2024-0156.pdf']
    },
    {
      id: '3',
      numero: 'TIC-2024-003',
      sujet: 'Demande de devis pour expédition express',
      description: 'J\'aimerais obtenir un devis pour l\'expédition express de 25 colis vers Kinshasa avec livraison en 48h.',
      status: 'resolu',
      priorite: 'normale',
      categorie: 'commercial',
      client: {
        nom: 'Paul Konan',
        email: 'paul.konan@tradingco.ci',
        telephone: '+225 07 89 12 34',
        entreprise: 'Trading Co'
      },
      agent: {
        nom: 'Marc Dubois',
        email: 'marc.dubois@befret.com'
      },
      dateCreation: '2024-01-12T10:15:00Z',
      dateMiseAJour: '2024-01-14T16:30:00Z',
      dateResolution: '2024-01-14T16:30:00Z',
      tempsResolution: 54.25,
      satisfaction: 5,
      canal: 'telephone',
      commentaires_internes: 'Devis envoyé et accepté par le client'
    },
    {
      id: '4',
      numero: 'TIC-2024-004',
      sujet: 'Impossible de se connecter au portail client',
      description: 'Je n\'arrive plus à me connecter à mon compte depuis hier. J\'obtiens une erreur "mot de passe incorrect" mais je suis sûr qu\'il est correct.',
      status: 'ferme',
      priorite: 'critique',
      categorie: 'technique',
      client: {
        nom: 'Aminata Traoré',
        email: 'a.traore@logistics-bf.com',
        telephone: '+226 70 12 34 56',
        entreprise: 'Logistics BF'
      },
      agent: {
        nom: 'David Leroy',
        email: 'david.leroy@befret.com'
      },
      dateCreation: '2024-01-10T09:45:00Z',
      dateMiseAJour: '2024-01-10T11:20:00Z',
      dateResolution: '2024-01-10T11:20:00Z',
      tempsResolution: 1.58,
      satisfaction: 4,
      canal: 'chat',
      commentaires_internes: 'Problème résolu par reset du mot de passe'
    },
    {
      id: '5',
      numero: 'TIC-2024-005',
      sujet: 'Colis endommagé à la réception',
      description: 'Le colis TRK-789456123 est arrivé avec l\'emballage déchiré et certains articles sont cassés. Photos en pièce jointe.',
      status: 'en_cours',
      priorite: 'haute',
      categorie: 'livraison',
      client: {
        nom: 'Fatou Diallo',
        email: 'fatou.diallo@artisanat.sn',
        telephone: '+221 77 123 45 67',
        entreprise: 'Artisanat Sénégal'
      },
      agent: {
        nom: 'Julie Martin',
        email: 'julie.martin@befret.com'
      },
      dateCreation: '2024-01-14T16:10:00Z',
      dateMiseAJour: '2024-01-15T09:30:00Z',
      canal: 'email',
      pieces_jointes: ['damage1.jpg', 'damage2.jpg', 'damage3.jpg'],
      commentaires_internes: 'Déclaration sinistre en cours auprès de l\'assurance'
    },
    {
      id: '6',
      numero: 'TIC-2024-006',
      sujet: 'Modification d\'adresse de livraison',
      description: 'Je souhaite modifier l\'adresse de livraison pour mon envoi TRK-456789012 qui est encore en transit.',
      status: 'ouvert',
      priorite: 'basse',
      categorie: 'livraison',
      client: {
        nom: 'Ibrahim Touré',
        email: 'ibrahim.toure@gmail.com',
        telephone: '+223 79 56 78 90'
      },
      dateCreation: '2024-01-16T11:25:00Z',
      dateMiseAJour: '2024-01-16T11:25:00Z',
      canal: 'telephone',
      commentaires_internes: 'Vérifier si modification possible selon l\'état d\'avancement'
    },
    {
      id: '7',
      numero: 'TIC-2024-007',
      sujet: 'Réclamation délai de livraison',
      description: 'La livraison promise en 7 jours a pris 14 jours. Je demande un geste commercial pour ce retard.',
      status: 'resolu',
      priorite: 'normale',
      categorie: 'commercial',
      client: {
        nom: 'Adjoa Mensah',
        email: 'adjoa.mensah@trade-gh.com',
        telephone: '+233 24 567 890',
        entreprise: 'Trade Ghana'
      },
      agent: {
        nom: 'Thomas Garcia',
        email: 'thomas.garcia@befret.com'
      },
      dateCreation: '2024-01-08T13:40:00Z',
      dateMiseAJour: '2024-01-12T15:10:00Z',
      dateResolution: '2024-01-12T15:10:00Z',
      tempsResolution: 97.5,
      satisfaction: 3,
      canal: 'formulaire',
      commentaires_internes: 'Réduction accordée sur prochaine expédition'
    },
    {
      id: '8',
      numero: 'TIC-2024-008',
      sujet: 'Demande de certificat d\'origine',
      description: 'J\'ai besoin d\'un certificat d\'origine pour mon envoi TRK-234567890 afin de passer les douanes.',
      status: 'ferme',
      priorite: 'haute',
      categorie: 'autre',
      client: {
        nom: 'Mohamed Ben Ali',
        email: 'm.benali@import-tn.com',
        telephone: '+216 22 345 678',
        entreprise: 'Import Tunisia'
      },
      agent: {
        nom: 'Amélie Dubois',
        email: 'amelie.dubois@befret.com'
      },
      dateCreation: '2024-01-05T08:20:00Z',
      dateMiseAJour: '2024-01-06T14:45:00Z',
      dateResolution: '2024-01-06T14:45:00Z',
      tempsResolution: 30.42,
      satisfaction: 5,
      canal: 'email',
      pieces_jointes: ['certificat_origine.pdf'],
      commentaires_internes: 'Document transmis par email'
    }
  ];
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('dateCreation');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    priorite: '',
    categorie: '',
    agent: '',
    canal: '',
    dateRange: ''
  });

  // Modal state for ticket details
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Générer les données d'exemple au chargement
  useEffect(() => {
    const sampleData = generateSampleTickets();
    setTickets(sampleData);
  }, []);

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
  const getFilteredAndSortedTickets = useCallback(() => {
    let filtered = tickets.filter(ticket => {
      const matchesSearch = !searchTerm || 
        ticket.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.sujet.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.agent?.nom && ticket.agent.nom.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = !filters.status || ticket.status === filters.status;
      const matchesPriorite = !filters.priorite || ticket.priorite === filters.priorite;
      const matchesCategorie = !filters.categorie || ticket.categorie === filters.categorie;
      const matchesAgent = !filters.agent || (ticket.agent?.nom && ticket.agent.nom.toLowerCase().includes(filters.agent.toLowerCase()));
      const matchesCanal = !filters.canal || ticket.canal === filters.canal;
      
      return matchesSearch && matchesStatus && matchesPriorite && matchesCategorie && matchesAgent && matchesCanal;
    });

    // Tri
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'client.nom':
          aValue = a.client.nom;
          bValue = b.client.nom;
          break;
        default:
          aValue = a[sortField as keyof Ticket];
          bValue = b[sortField as keyof Ticket];
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
  }, [tickets, searchTerm, sortField, sortDirection, filters]);

  const filteredTickets = getFilteredAndSortedTickets();
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Gestion de la sélection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickets(new Set(paginatedTickets.map(ticket => ticket.id)));
    } else {
      setSelectedTickets(new Set());
    }
  };

  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    const newSelected = new Set(selectedTickets);
    if (checked) {
      newSelected.add(ticketId);
    } else {
      newSelected.delete(ticketId);
    }
    setSelectedTickets(newSelected);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priorite: '',
      categorie: '',
      agent: '',
      canal: '',
      dateRange: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '') || searchTerm !== '';

  const handleViewDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowDetailsModal(true);
  };

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || AlertCircle;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ouvert;
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

  const getCategorieBadge = (categorie: string) => {
    const config = categorieConfig[categorie as keyof typeof categorieConfig] || categorieConfig.autre;
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getCanalBadge = (canal: string) => {
    const config = canalConfig[canal as keyof typeof canalConfig];
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTempsResolution = (heures?: number) => {
    if (!heures) return 'Non résolu';
    if (heures < 1) return `${Math.round(heures * 60)}min`;
    if (heures < 24) return `${heures.toFixed(1)}h`;
    return `${Math.round(heures / 24)}j`;
  };

  const getSatisfactionStars = (note?: number) => {
    if (!note) return null;
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={`text-xs ${i < note ? 'text-yellow-400' : 'text-gray-300'}`}>
            ★
          </span>
        ))}
        <span className="text-xs text-gray-500 ml-1">({note}/5)</span>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tickets Support</h1>
            <p className="text-gray-600">Gestion des demandes et incidents clients</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedTickets.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedTickets.size} sélectionné(s)
                </span>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Exporter
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            )}
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau ticket
            </Button>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ouverts</p>
                  <p className="text-2xl font-bold">
                    {tickets.filter(t => t.status === 'ouvert').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">En cours</p>
                  <p className="text-2xl font-bold">
                    {tickets.filter(t => t.status === 'en_cours').length}
                  </p>
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
                  <p className="text-sm text-gray-600">Résolus</p>
                  <p className="text-2xl font-bold">
                    {tickets.filter(t => t.status === 'resolu').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Critiques</p>
                  <p className="text-2xl font-bold">
                    {tickets.filter(t => t.priorite === 'critique').length}
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
                    placeholder="Rechercher par numéro, sujet, client, agent..."
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <SelectItem value="ouvert">Ouvert</SelectItem>
                        <SelectItem value="en_cours">En cours</SelectItem>
                        <SelectItem value="resolu">Résolu</SelectItem>
                        <SelectItem value="ferme">Fermé</SelectItem>
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
                        <SelectItem value="critique">Critique</SelectItem>
                        <SelectItem value="haute">Haute</SelectItem>
                        <SelectItem value="normale">Normale</SelectItem>
                        <SelectItem value="basse">Basse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Catégorie</Label>
                    <Select value={filters.categorie} onValueChange={(value) => {
                      setFilters(prev => ({ ...prev, categorie: value }));
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les catégories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Toutes les catégories</SelectItem>
                        <SelectItem value="technique">Technique</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="livraison">Livraison</SelectItem>
                        <SelectItem value="facturation">Facturation</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Canal</Label>
                    <Select value={filters.canal} onValueChange={(value) => {
                      setFilters(prev => ({ ...prev, canal: value }));
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les canaux" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tous les canaux</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="telephone">Téléphone</SelectItem>
                        <SelectItem value="chat">Chat</SelectItem>
                        <SelectItem value="formulaire">Formulaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Agent</Label>
                    <Input
                      placeholder="Filtrer par agent"
                      value={filters.agent}
                      onChange={(e) => {
                        setFilters(prev => ({ ...prev, agent: e.target.value }));
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
            Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredTickets.length)} 
            sur {filteredTickets.length} tickets
            {hasActiveFilters && (
              <span className="ml-2">
                ({tickets.length} au total)
              </span>
            )}
          </div>
          {selectedTickets.size > 0 && (
            <div className="text-green-600">
              {selectedTickets.size} ticket(s) sélectionné(s)
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
                      checked={paginatedTickets.length > 0 && selectedTickets.size === paginatedTickets.length}
                      onCheckedChange={handleSelectAll}
                      aria-label="Sélectionner tout"
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('numero')}
                  >
                    <div className="flex items-center gap-1">
                      Numéro
                      {getSortIcon('numero')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('sujet')}
                  >
                    <div className="flex items-center gap-1">
                      Sujet
                      {getSortIcon('sujet')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('client.nom')}
                  >
                    <div className="flex items-center gap-1">
                      Client
                      {getSortIcon('client.nom')}
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
                    onClick={() => handleSort('priorite')}
                  >
                    <div className="flex items-center gap-1">
                      Priorité
                      {getSortIcon('priorite')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('dateCreation')}
                  >
                    <div className="flex items-center gap-1">
                      Créé le
                      {getSortIcon('dateCreation')}
                    </div>
                  </TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTickets.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox
                        checked={selectedTickets.has(ticket.id)}
                        onCheckedChange={(checked) => handleSelectTicket(ticket.id, checked as boolean)}
                        aria-label={`Sélectionner ${ticket.numero}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-mono text-sm">{ticket.numero}</div>
                        <div className="flex items-center gap-1 mt-1">
                          {getCategorieBadge(ticket.categorie)}
                          {getCanalBadge(ticket.canal)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium truncate">{ticket.sujet}</div>
                        <div className="text-sm text-gray-500 truncate">{ticket.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.client.nom}</div>
                        <div className="text-sm text-gray-500">{ticket.client.email}</div>
                        {ticket.client.entreprise && (
                          <div className="text-xs text-gray-400">{ticket.client.entreprise}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {getStatusBadge(ticket.status)}
                        {ticket.dateResolution && (
                          <div className="text-xs text-gray-500 mt-1">
                            Résolu: {formatTempsResolution(ticket.tempsResolution)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {getPrioriteBadge(ticket.priorite)}
                        {ticket.satisfaction && (
                          <div className="mt-1">
                            {getSatisfactionStars(ticket.satisfaction)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{formatDate(ticket.dateCreation)}</div>
                        <div className="text-xs text-gray-500">Maj: {formatDate(ticket.dateMiseAJour)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ticket.agent ? (
                        <div>
                          <div className="text-sm font-medium">{ticket.agent.nom}</div>
                          <div className="text-xs text-gray-500">{ticket.agent.email}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Non assigné</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(ticket)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Répondre
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
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
            
            {paginatedTickets.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Aucun ticket trouvé</p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Effacer les filtres
                  </Button>
                )}
              </div>
            )}
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
                      checked={paginatedTickets.length > 0 && selectedTickets.size === paginatedTickets.length}
                      onCheckedChange={handleSelectAll}
                      aria-label="Sélectionner tout"
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('numero')}
                  >
                    <div className="flex items-center gap-1">
                      Numéro
                      {getSortIcon('numero')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('sujet')}
                  >
                    <div className="flex items-center gap-1">
                      Sujet
                      {getSortIcon('sujet')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('client.nom')}
                  >
                    <div className="flex items-center gap-1">
                      Client
                      {getSortIcon('client.nom')}
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
                {paginatedTickets.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox
                        checked={selectedTickets.has(ticket.id)}
                        onCheckedChange={(checked) => handleSelectTicket(ticket.id, checked as boolean)}
                        aria-label={`Sélectionner ${ticket.numero}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-mono text-sm">{ticket.numero}</div>
                        <div className="flex gap-1 mt-1">
                          {getPrioriteBadge(ticket.priorite)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium truncate">{ticket.sujet}</div>
                        <div className="text-sm text-gray-500">{getCategorieBadge(ticket.categorie)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.client.nom}</div>
                        <div className="text-sm text-gray-500 truncate">{ticket.client.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {getStatusBadge(ticket.status)}
                        <div className="text-xs text-gray-500 mt-1">{formatDate(ticket.dateCreation)}</div>
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
                          <DropdownMenuItem onClick={() => handleViewDetails(ticket)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
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
            
            {paginatedTickets.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Aucun ticket trouvé</p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Effacer les filtres
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cards Mobile */}
        <div className="md:hidden space-y-4">
          {paginatedTickets.map((ticket) => (
            <Card key={ticket.id} className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedTickets.has(ticket.id)}
                      onCheckedChange={(checked) => handleSelectTicket(ticket.id, checked as boolean)}
                      aria-label={`Sélectionner ${ticket.numero}`}
                    />
                    <div>
                      <h3 className="font-mono text-sm">{ticket.numero}</h3>
                      <p className="font-medium text-sm truncate">{ticket.sujet}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(ticket)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Voir
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Status and Priority */}
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(ticket.status)}
                  {getPrioriteBadge(ticket.priorite)}
                  {getCategorieBadge(ticket.categorie)}
                  {getCanalBadge(ticket.canal)}
                </div>

                {/* Description */}
                <div>
                  <Label className="text-xs text-gray-500">Description</Label>
                  <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                </div>

                {/* Client Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-xs text-gray-500">Client</Label>
                    <p className="font-medium">{ticket.client.nom}</p>
                    <p className="text-gray-600 truncate">{ticket.client.email}</p>
                    {ticket.client.entreprise && (
                      <p className="text-xs text-gray-400">{ticket.client.entreprise}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Agent</Label>
                    {ticket.agent ? (
                      <div>
                        <p className="font-medium">{ticket.agent.nom}</p>
                        <p className="text-gray-600 truncate text-xs">{ticket.agent.email}</p>
                      </div>
                    ) : (
                      <p className="text-gray-400">Non assigné</p>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-xs text-gray-500">Créé le</Label>
                    <p className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(ticket.dateCreation)}
                    </p>
                  </div>
                  {ticket.dateResolution ? (
                    <div>
                      <Label className="text-xs text-gray-500">Résolu en</Label>
                      <p className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {formatTempsResolution(ticket.tempsResolution)}
                      </p>
                      {ticket.satisfaction && (
                        <div className="mt-1">
                          {getSatisfactionStars(ticket.satisfaction)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Label className="text-xs text-gray-500">Mis à jour le</Label>
                      <p className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(ticket.dateMiseAJour)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                {(ticket.pieces_jointes?.length || ticket.commentaires_internes) && (
                  <div className="text-sm">
                    {ticket.pieces_jointes?.length && (
                      <div>
                        <Label className="text-xs text-gray-500">Pièces jointes</Label>
                        <p className="text-green-600">{ticket.pieces_jointes.length} fichier(s)</p>
                      </div>
                    )}
                    {ticket.commentaires_internes && (
                      <div className="mt-2">
                        <Label className="text-xs text-gray-500">Notes internes</Label>
                        <p className="text-gray-600 text-xs italic">{ticket.commentaires_internes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
          
          {paginatedTickets.length === 0 && (
            <Card className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Aucun ticket trouvé</p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Effacer les filtres
                </Button>
              )}
            </Card>
          )}
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

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du Ticket</DialogTitle>
            <DialogDescription>
              Informations complètes du ticket {selectedTicket?.numero}
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Numéro de ticket</Label>
                  <p className="font-mono font-medium">{selectedTicket.numero}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Statut</Label>
                  <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                </div>
              </div>

              {/* Subject and Description */}
              <div>
                <Label className="text-sm font-medium text-gray-600">Sujet</Label>
                <p className="font-medium text-lg">{selectedTicket.sujet}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Description</Label>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{selectedTicket.description}</p>
              </div>

              {/* Priority and Category */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Priorité</Label>
                  <Badge className={`mt-1 ${prioriteConfig[selectedTicket.priorite as keyof typeof prioriteConfig]?.color}`}>
                    {prioriteConfig[selectedTicket.priorite as keyof typeof prioriteConfig]?.label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Catégorie</Label>
                  <Badge variant="outline" className={`mt-1 ${categorieConfig[selectedTicket.categorie as keyof typeof categorieConfig]?.color}`}>
                    {categorieConfig[selectedTicket.categorie as keyof typeof categorieConfig]?.label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Canal</Label>
                  <div className="flex items-center gap-1 mt-1">
                    {canalConfig[selectedTicket.canal as keyof typeof canalConfig]?.icon && (
                      <span className="h-4 w-4">
                        {React.createElement(canalConfig[selectedTicket.canal as keyof typeof canalConfig].icon)}
                      </span>
                    )}
                    <span className="text-sm">{canalConfig[selectedTicket.canal as keyof typeof canalConfig]?.label}</span>
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div>
                <Label className="text-sm font-medium text-gray-600">Informations Client</Label>
                <div className="mt-2 bg-green-50 p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">{selectedTicket.client.nom}</p>
                      <p className="text-sm text-gray-600">{selectedTicket.client.email}</p>
                      {selectedTicket.client.telephone && (
                        <p className="text-sm text-gray-600">{selectedTicket.client.telephone}</p>
                      )}
                    </div>
                    {selectedTicket.client.entreprise && (
                      <div>
                        <Label className="text-xs text-gray-500">Entreprise</Label>
                        <p className="text-sm font-medium">{selectedTicket.client.entreprise}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Agent Information */}
              {selectedTicket.agent && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Agent Assigné</Label>
                  <div className="mt-2 bg-green-50 p-4 rounded-md">
                    <p className="font-medium">{selectedTicket.agent.nom}</p>
                    <p className="text-sm text-gray-600">{selectedTicket.agent.email}</p>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date de création</Label>
                  <p className="text-sm">{formatDate(selectedTicket.dateCreation)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Dernière mise à jour</Label>
                  <p className="text-sm">{formatDate(selectedTicket.dateMiseAJour)}</p>
                </div>
              </div>

              {/* Resolution Info */}
              {selectedTicket.dateResolution && (
                <div className="bg-green-50 p-4 rounded-md">
                  <Label className="text-sm font-medium text-green-800">Ticket Résolu</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-sm text-green-700">Résolu le: {formatDate(selectedTicket.dateResolution)}</p>
                      {selectedTicket.tempsResolution && (
                        <p className="text-sm text-green-700">
                          Temps de résolution: {formatTempsResolution(selectedTicket.tempsResolution)}
                        </p>
                      )}
                    </div>
                    {selectedTicket.satisfaction && (
                      <div>
                        <Label className="text-xs text-green-600">Satisfaction client</Label>
                        <div className="mt-1">{getSatisfactionStars(selectedTicket.satisfaction)}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Attachments and Internal Comments */}
              {(selectedTicket.pieces_jointes?.length || selectedTicket.commentaires_internes) && (
                <div className="space-y-3">
                  {selectedTicket.pieces_jointes?.length && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Pièces jointes</Label>
                      <div className="mt-2 space-y-1">
                        {selectedTicket.pieces_jointes.map((piece, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                            <FileText className="h-4 w-4" />
                            {piece}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTicket.commentaires_internes && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Commentaires internes</Label>
                      <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-md mt-2">
                        {selectedTicket.commentaires_internes}
                      </p>
                    </div>
                  )}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}