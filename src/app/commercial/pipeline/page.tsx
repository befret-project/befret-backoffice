'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  DollarSign,
  Calendar,
  User,
  Building,
  Phone,
  Mail,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  BarChart3
} from 'lucide-react';

interface Opportunity {
  id: string;
  titre: string;
  client: {
    nom: string;
    entreprise?: string;
    email: string;
    telephone?: string;
  };
  valeur: number;
  probabilite: number;
  etape: 'qualification' | 'proposition' | 'negociation' | 'signature' | 'gagne' | 'perdu';
  source: string;
  commercial: string;
  dateCreation: string;
  dateCloture?: string;
  prochaineSuivi: string;
  description: string;
  notes?: string;
}

const etapeConfig = {
  qualification: { label: 'Qualification', color: 'bg-yellow-100 text-yellow-800', order: 1 },
  proposition: { label: 'Proposition', color: 'bg-green-100 text-green-800', order: 2 },
  negociation: { label: 'Négociation', color: 'bg-orange-100 text-orange-800', order: 3 },
  signature: { label: 'Signature', color: 'bg-purple-100 text-purple-800', order: 4 },
  gagne: { label: 'Gagné', color: 'bg-green-100 text-green-800', order: 5 },
  perdu: { label: 'Perdu', color: 'bg-red-100 text-red-800', order: 6 }
};

export default function PipelinePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEtape, setSelectedEtape] = useState<string>('all');

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      
      // Simulation de données - remplacer par vraie API
      const mockOpportunities: Opportunity[] = [
        {
          id: '1',
          titre: 'Contrat expédition mensuelle TechCorp',
          client: {
            nom: 'Pierre Mukeba',
            entreprise: 'TechCorp Congo',
            email: 'pierre.mukeba@techcorp.cd',
            telephone: '+243 987 654 321'
          },
          valeur: 15000,
          probabilite: 75,
          etape: 'negociation',
          source: 'Site web',
          commercial: 'Jean Kalala',
          dateCreation: '2024-01-10',
          prochaineSuivi: '2024-01-18',
          description: 'Contrat mensuel pour expéditions d\'équipements électroniques vers Lubumbashi',
          notes: 'Client très intéressé, négociation sur les tarifs de volume'
        },
        {
          id: '2',
          titre: 'Expédition équipements miniers',
          client: {
            nom: 'André Kasongo',
            entreprise: 'Mining Solutions Ltd',
            email: 'andre.kasongo@mining.cd',
            telephone: '+243 555 111 222'
          },
          valeur: 8500,
          probabilite: 90,
          etape: 'signature',
          source: 'Salon professionnel',
          commercial: 'Marie Nzuzi',
          dateCreation: '2024-01-05',
          prochaineSuivi: '2024-01-17',
          description: 'Transport d\'équipements lourds vers Kolwezi',
          notes: 'Contrat presque signé, attente validation juridique'
        },
        {
          id: '3',
          titre: 'Partenariat logistique Import/Export',
          client: {
            nom: 'Marie Tshiswaka',
            entreprise: 'Import Export SARL',
            email: 'marie.tshiswaka@email.com',
            telephone: '+243 123 456 789'
          },
          valeur: 25000,
          probabilite: 60,
          etape: 'proposition',
          source: 'Recommandation',
          commercial: 'Jean Kalala',
          dateCreation: '2024-01-08',
          prochaineSuivi: '2024-01-20',
          description: 'Accord de partenariat pour la logistique d\'import/export',
          notes: 'Proposition envoyée, attente retour client'
        },
        {
          id: '4',
          titre: 'Expédition personnelle familiale',
          client: {
            nom: 'Sophie Martin',
            email: 'sophie.martin@personal.com',
            telephone: '+32 476 123 456'
          },
          valeur: 450,
          probabilite: 40,
          etape: 'qualification',
          source: 'Publicité Facebook',
          commercial: 'Marie Nzuzi',
          dateCreation: '2024-01-12',
          prochaineSuivi: '2024-01-19',
          description: 'Envoi de colis familiaux vers Kinshasa',
          notes: 'Premier contact, évaluation des besoins en cours'
        },
        {
          id: '5',
          titre: 'Contrat annuel Pharma Plus',
          client: {
            nom: 'Dr. Joseph Mbala',
            entreprise: 'Pharma Plus SARL',
            email: 'j.mbala@pharmaplus.cd',
            telephone: '+243 444 333 222'
          },
          valeur: 45000,
          probabilite: 100,
          etape: 'gagne',
          source: 'Démarchage direct',
          commercial: 'Jean Kalala',
          dateCreation: '2023-12-15',
          dateCloture: '2024-01-10',
          prochaineSuivi: '2024-02-01',
          description: 'Transport de produits pharmaceutiques - contrat annuel',
          notes: 'Contrat signé, mise en place opérationnelle en cours'
        }
      ];

      setOpportunities(mockOpportunities);
    } catch (error) {
      console.error('Erreur lors du chargement des opportunités:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOpportunities = opportunities.filter(opp => {
    if (selectedEtape === 'all') return true;
    if (selectedEtape === 'actives') return !['gagne', 'perdu'].includes(opp.etape);
    return opp.etape === selectedEtape;
  });

  const groupedOpportunities = filteredOpportunities.reduce((acc, opp) => {
    if (!acc[opp.etape]) {
      acc[opp.etape] = [];
    }
    acc[opp.etape].push(opp);
    return acc;
  }, {} as Record<string, Opportunity[]>);

  const getEtapeBadge = (etape: string) => {
    const config = etapeConfig[etape as keyof typeof etapeConfig] || etapeConfig.qualification;
    return (
      <Badge className={config.color}>
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

  const getProbabiliteColor = (probabilite: number) => {
    if (probabilite >= 80) return 'text-green-600';
    if (probabilite >= 60) return 'text-orange-600';
    if (probabilite >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTotalStats = () => {
    const actives = opportunities.filter(opp => !['gagne', 'perdu'].includes(opp.etape));
    return {
      total_opportunities: opportunities.length,
      valeur_pipeline: actives.reduce((sum, opp) => sum + opp.valeur, 0),
      valeur_ponderee: actives.reduce((sum, opp) => sum + (opp.valeur * opp.probabilite / 100), 0),
      gagnes_ce_mois: opportunities.filter(opp => 
        opp.etape === 'gagne' && 
        opp.dateCloture && 
        new Date(opp.dateCloture).getMonth() === new Date().getMonth()
      ).reduce((sum, opp) => sum + opp.valeur, 0)
    };
  };

  const stats = getTotalStats();

  const etapesOrdonnees = Object.keys(etapeConfig)
    .sort((a, b) => etapeConfig[a as keyof typeof etapeConfig].order - etapeConfig[b as keyof typeof etapeConfig].order);

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement du pipeline...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Pipeline Commercial</h1>
            <p className="text-gray-600 mt-2">Suivi des opportunités de vente</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Rapports
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Opportunité
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Opportunités</p>
                  <p className="text-2xl font-bold text-green-600">{stats.total_opportunities}</p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valeur Pipeline</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.valeur_pipeline)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valeur Pondérée</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.valeur_ponderee)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gagnés ce Mois</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.gagnes_ce_mois)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres par étape */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedEtape === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedEtape('all')}
              >
                Toutes
              </Button>
              <Button
                variant={selectedEtape === 'actives' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedEtape('actives')}
              >
                Actives
              </Button>
              {etapesOrdonnees.map((etape) => (
                <Button
                  key={etape}
                  variant={selectedEtape === etape ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedEtape(etape)}
                >
                  {etapeConfig[etape as keyof typeof etapeConfig].label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Kanban */}
        <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {etapesOrdonnees.map((etape) => {
            const etapeOpportunities = groupedOpportunities[etape] || [];
            const etapeValeur = etapeOpportunities.reduce((sum, opp) => sum + opp.valeur, 0);
            
            return (
              <Card key={etape} className="min-h-[600px]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>{etapeConfig[etape as keyof typeof etapeConfig].label}</span>
                    <Badge variant="secondary">{etapeOpportunities.length}</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {formatCurrency(etapeValeur)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {etapeOpportunities.map((opportunity) => (
                    <Card key={opportunity.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm line-clamp-2">{opportunity.titre}</h4>
                        
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-green-600 text-sm">
                            {formatCurrency(opportunity.valeur)}
                          </span>
                          <span className={`text-xs font-medium ${getProbabiliteColor(opportunity.probabilite)}`}>
                            {opportunity.probabilite}%
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="truncate">{opportunity.client.nom}</span>
                          </div>
                          {opportunity.client.entreprise && (
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              <span className="truncate">{opportunity.client.entreprise}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Suivi: {formatDate(opportunity.prochaineSuivi)}</span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500">
                          Commercial: {opportunity.commercial}
                        </div>

                        {opportunity.notes && (
                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            {opportunity.notes}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Liste détaillée si aucune étape spécifique sélectionnée */}
        {selectedEtape === 'all' && (
          <Card>
            <CardHeader>
              <CardTitle>Toutes les Opportunités</CardTitle>
              <CardDescription>
                Vue détaillée de toutes les opportunités du pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {opportunities.map((opportunity) => (
                  <Card key={opportunity.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getEtapeBadge(opportunity.etape)}
                          <Badge variant="outline">{opportunity.source}</Badge>
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-2">{opportunity.titre}</h3>
                        <p className="text-gray-600 mb-3">{opportunity.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{opportunity.client.nom}</span>
                            </div>
                            {opportunity.client.entreprise && (
                              <div className="flex items-center gap-2 mb-1">
                                <Building className="h-4 w-4 text-gray-400" />
                                <span>{opportunity.client.entreprise}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span>{opportunity.client.email}</span>
                            </div>
                          </div>
                          
                          <div>
                            <div className="mb-1">
                              <span className="text-gray-500">Valeur:</span>
                              <span className="font-bold text-green-600 ml-2">
                                {formatCurrency(opportunity.valeur)}
                              </span>
                            </div>
                            <div className="mb-1">
                              <span className="text-gray-500">Probabilité:</span>
                              <span className={`font-medium ml-2 ${getProbabiliteColor(opportunity.probabilite)}`}>
                                {opportunity.probabilite}%
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Commercial:</span>
                              <span className="font-medium ml-2">{opportunity.commercial}</span>
                            </div>
                          </div>
                          
                          <div>
                            <div className="mb-1">
                              <span className="text-gray-500">Créée:</span>
                              <span className="ml-2">{formatDate(opportunity.dateCreation)}</span>
                            </div>
                            <div className="mb-1">
                              <span className="text-gray-500">Prochain suivi:</span>
                              <span className="ml-2">{formatDate(opportunity.prochaineSuivi)}</span>
                            </div>
                            {opportunity.dateCloture && (
                              <div>
                                <span className="text-gray-500">Clôturée:</span>
                                <span className="ml-2">{formatDate(opportunity.dateCloture)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}