'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Truck, 
  Package, 
  Search, 
  Filter, 
  Plus,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface ColisExpedition {
  id: string;
  reference: string;
  client: {
    nom: string;
    adresse: string;
  };
  destinataire: {
    nom: string;
    adresse: string;
    ville: string;
    pays: string;
  };
  poids: number;
  dimensions: {
    longueur: number;
    largeur: number;
    hauteur: number;
  };
  valeur: number;
  statut: 'pret' | 'en_cours' | 'expedie' | 'livre';
  transporteur?: string;
  numeroSuivi?: string;
  dateExpedition?: string;
  dateArriveePrevu?: string;
  priority: 'normale' | 'urgente' | 'express';
}

const statutConfig = {
  pret: { label: '📦 Prêt à expédier', color: 'bg-green-100 text-green-800', icon: Package },
  en_cours: { label: '🚛 En transit vers destination', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  expedie: { label: '✈️ Expédié vers la RD Congo', color: 'bg-purple-100 text-purple-800', icon: Truck },
  livre: { label: '✅ Livré au destinataire', color: 'bg-green-100 text-green-800', icon: CheckCircle }
};

const priorityConfig = {
  normale: { label: '📋 Priorité normale', color: 'bg-gray-100 text-gray-800' },
  urgente: { label: '⚡ Priorité urgente', color: 'bg-orange-100 text-orange-800' },
  express: { label: '🚀 Priorité express', color: 'bg-red-100 text-red-800' }
};

export default function ExpeditionPage() {
  const [colis, setColis] = useState<ColisExpedition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Génération de données d'exemple pour demonstration
  const generateSampleColis = useCallback((): ColisExpedition[] => {
    const sampleData: ColisExpedition[] = [
      {
        id: '1',
        reference: 'EXP-2024-001',
        client: {
          nom: 'Marie Dubois',
          adresse: '12 Avenue des Champs, 75008 Paris'
        },
        destinataire: {
          nom: 'Joseph Mukendi',
          adresse: 'Avenue Tombalbaye 45',
          ville: 'Kinshasa',
          pays: 'RD Congo'
        },
        poids: 25.5,
        dimensions: {
          longueur: 45,
          largeur: 30,
          hauteur: 20
        },
        valeur: 1250,
        statut: 'pret',
        transporteur: 'DHL Congo',
        numeroSuivi: 'DHL-CD-789012345',
        dateExpedition: '2024-01-20',
        dateArriveePrevu: '2024-01-27',
        priority: 'urgente'
      },
      {
        id: '2',
        reference: 'EXP-2024-002',
        client: {
          nom: 'Jean Martin',
          adresse: '45 Rue de la République, 69002 Lyon'
        },
        destinataire: {
          nom: 'Grace Ngandu',
          adresse: 'Boulevard Mobutu 123',
          ville: 'Lubumbashi',
          pays: 'RD Congo'
        },
        poids: 18.2,
        dimensions: {
          longueur: 35,
          largeur: 25,
          hauteur: 15
        },
        valeur: 890,
        statut: 'en_cours',
        transporteur: 'FedEx Africa',
        numeroSuivi: 'FDX-AF-567890123',
        dateExpedition: '2024-01-18',
        dateArriveePrevu: '2024-01-25',
        priority: 'normale'
      },
      {
        id: '3',
        reference: 'EXP-2024-003',
        client: {
          nom: 'Sophie Bernard',
          adresse: '78 Boulevard Saint-Germain, 75006 Paris'
        },
        destinataire: {
          nom: 'Paul Kabila',
          adresse: 'Avenue Patrice Lumumba 67',
          ville: 'Bukavu',
          pays: 'RD Congo'
        },
        poids: 32.1,
        dimensions: {
          longueur: 50,
          largeur: 35,
          hauteur: 25
        },
        valeur: 1580,
        statut: 'expedie',
        transporteur: 'UPS Congo',
        numeroSuivi: 'UPS-CG-345678901',
        dateExpedition: '2024-01-15',
        dateArriveePrevu: '2024-01-22',
        priority: 'express'
      },
      {
        id: '4',
        reference: 'EXP-2024-004',
        client: {
          nom: 'David Leroy',
          adresse: '23 Rue Victor Hugo, 13001 Marseille'
        },
        destinataire: {
          nom: 'Marie Tshombe',
          adresse: 'Rue de la Paix 89',
          ville: 'Goma',
          pays: 'RD Congo'
        },
        poids: 42.8,
        dimensions: {
          longueur: 60,
          largeur: 40,
          hauteur: 30
        },
        valeur: 2340,
        statut: 'livre',
        transporteur: 'TNT Express',
        numeroSuivi: 'TNT-EX-234567890',
        dateExpedition: '2024-01-10',
        dateArriveePrevu: '2024-01-17',
        priority: 'normale'
      },
      {
        id: '5',
        reference: 'EXP-2024-005',
        client: {
          nom: 'Amélie Dubois',
          adresse: '156 Avenue de la Liberté, 59000 Lille'
        },
        destinataire: {
          nom: 'André Kasongo',
          adresse: 'Avenue des Diamantaires 34',
          ville: 'Mbuji-Mayi',
          pays: 'RD Congo'
        },
        poids: 28.7,
        dimensions: {
          longueur: 40,
          largeur: 28,
          hauteur: 18
        },
        valeur: 1120,
        statut: 'pret',
        transporteur: 'Chronopost Africa',
        numeroSuivi: 'CHR-AF-456789012',
        priority: 'urgente'
      },
      {
        id: '6',
        reference: 'EXP-2024-006',
        client: {
          nom: 'Thomas Garcia',
          adresse: '67 Cours Mirabeau, 13100 Aix-en-Provence'
        },
        destinataire: {
          nom: 'Claudine Mwamba',
          adresse: 'Boulevard du 30 Juin 156',
          ville: 'Kisangani',
          pays: 'RD Congo'
        },
        poids: 35.4,
        dimensions: {
          longueur: 48,
          largeur: 32,
          hauteur: 22
        },
        valeur: 1750,
        statut: 'en_cours',
        transporteur: 'SCAC Congo',
        numeroSuivi: 'SCAC-CG-567890123',
        dateExpedition: '2024-01-12',
        dateArriveePrevu: '2024-01-19',
        priority: 'normale'
      }
    ];
    
    return sampleData;
  }, []);

  const fetchColis = useCallback(async () => {
    try {
      setLoading(true);
      
      // Utiliser les données d'exemple
      const allColis = generateSampleColis();
      
      // Appliquer les filtres côté client pour la demonstration
      let filteredData = allColis;
      
      if (statutFilter !== 'all') {
        filteredData = filteredData.filter(coli => coli.statut === statutFilter);
      }
      
      if (priorityFilter !== 'all') {
        filteredData = filteredData.filter(coli => coli.priority === priorityFilter);
      }
      
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredData = filteredData.filter(coli => 
          coli.reference.toLowerCase().includes(term) ||
          coli.client.nom.toLowerCase().includes(term) ||
          coli.destinataire.nom.toLowerCase().includes(term)
        );
      }
      
      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setColis(filteredData);
    } catch (error) {
      console.error('Erreur lors du chargement des colis:', error);
      setColis([]);
    } finally {
      setLoading(false);
    }
  }, [statutFilter, priorityFilter, searchTerm, generateSampleColis]);

  useEffect(() => {
    fetchColis();
  }, [fetchColis]);

  const filteredColis = colis.filter(coli => {
    const matchesSearch = coli.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coli.client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coli.destinataire.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatut = statutFilter === 'all' || coli.statut === statutFilter;
    const matchesPriority = priorityFilter === 'all' || coli.priority === priorityFilter;
    
    return matchesSearch && matchesStatut && matchesPriority;
  });

  const getStatutIcon = (statut: string) => {
    const config = statutConfig[statut as keyof typeof statutConfig];
    const Icon = config?.icon || Package;
    return <Icon className="h-4 w-4" />;
  };

  const getStatutBadge = (statut: string) => {
    const config = statutConfig[statut as keyof typeof statutConfig] || statutConfig.pret;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {getStatutIcon(statut)}
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normale;
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
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getTotalStats = () => {
    return {
      total: filteredColis.length,
      prets: filteredColis.filter(c => c.statut === 'pret').length,
      en_cours: filteredColis.filter(c => c.statut === 'en_cours').length,
      expedies: filteredColis.filter(c => c.statut === 'expedie').length,
      valeur_totale: filteredColis.reduce((sum, coli) => sum + coli.valeur, 0)
    };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des colis...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Expédition de Colis</h1>
            <p className="text-gray-600 mt-2">Gestion des envois vers le Congo</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchColis} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Envoi
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Colis</p>
                  <p className="text-2xl font-bold text-green-600">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Prêts</p>
                  <p className="text-2xl font-bold text-green-600">{stats.prets}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Cours</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.en_cours}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expédiés</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.expedies}</p>
                </div>
                <Truck className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valeur Totale</p>
                  <p className="text-xl font-bold text-indigo-600">{formatCurrency(stats.valeur_totale)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Recherche</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Référence, client, destinataire..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="statut">Statut</Label>
                <Select value={statutFilter} onValueChange={setStatutFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pret">Prêt à expédier</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="expedie">Expédié</SelectItem>
                    <SelectItem value="livre">Livré</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priorité</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les priorités" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les priorités</SelectItem>
                    <SelectItem value="express">Express</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                    <SelectItem value="normale">Normale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" className="w-full">
                  Exporter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des colis */}
        <Card>
          <CardHeader>
            <CardTitle>Colis à Expédier ({filteredColis.length})</CardTitle>
            <CardDescription>
              Gestion des colis prêts pour l&apos;expédition
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredColis.map((coli) => (
                <Card key={coli.id} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-sm text-gray-600">{coli.reference}</span>
                          {getStatutBadge(coli.statut)}
                          {getPriorityBadge(coli.priority)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <h3 className="font-semibold text-lg mb-1">Expéditeur</h3>
                            <p className="text-gray-900">{coli.client.nom}</p>
                            <p className="text-gray-600 text-sm">{coli.client.adresse}</p>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg mb-1">Destinataire</h3>
                            <p className="text-gray-900">{coli.destinataire.nom}</p>
                            <p className="text-gray-600 text-sm">{coli.destinataire.adresse}</p>
                            <p className="text-gray-600 text-sm flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {coli.destinataire.ville}, {coli.destinataire.pays}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Poids:</span>
                            <p className="font-medium">{coli.poids} kg</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Dimensions:</span>
                            <p className="font-medium">{coli.dimensions.longueur}×{coli.dimensions.largeur}×{coli.dimensions.hauteur} cm</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Valeur:</span>
                            <p className="font-medium text-green-600">{formatCurrency(coli.valeur)}</p>
                          </div>
                          {coli.transporteur && (
                            <div>
                              <span className="text-gray-500">Transporteur:</span>
                              <p className="font-medium">{coli.transporteur}</p>
                            </div>
                          )}
                          {coli.numeroSuivi && (
                            <div>
                              <span className="text-gray-500">Suivi:</span>
                              <p className="font-mono text-xs">{coli.numeroSuivi}</p>
                            </div>
                          )}
                        </div>

                        {coli.dateExpedition && (
                          <div className="mt-2 text-sm">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-500">Expédié le:</span>
                                <span>{formatDate(coli.dateExpedition)}</span>
                              </div>
                              {coli.dateArriveePrevu && (
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-500">Arrivée prévue:</span>
                                  <span>{formatDate(coli.dateArriveePrevu)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        {coli.statut === 'pret' && (
                          <Button size="sm">
                            <Truck className="h-4 w-4 mr-1" />
                            Expédier
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          Détails
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredColis.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun colis à expédier</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}