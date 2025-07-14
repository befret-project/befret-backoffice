'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Search, 
  Plus,
  Edit,
  Eye,
  Tag,
  Calendar,
  User,
  Star,
  ThumbsUp
} from 'lucide-react';

interface Article {
  id: string;
  titre: string;
  contenu: string;
  resume: string;
  categorie: string;
  tags: string[];
  auteur: string;
  dateCreation: string;
  dateMiseAJour: string;
  vues: number;
  likes: number;
  statut: 'brouillon' | 'publie' | 'archive';
}

interface Categorie {
  id: string;
  nom: string;
  description: string;
  couleur: string;
  nombreArticles: number;
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategorie, setSelectedCategorie] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Simulation de données - remplacer par vraie API
      const mockCategories: Categorie[] = [
        {
          id: '1',
          nom: 'Expédition',
          description: 'Tout sur les envois et la logistique',
          couleur: 'bg-green-100 text-green-800',
          nombreArticles: 12
        },
        {
          id: '2',
          nom: 'Facturation',
          description: 'Questions sur les prix et factures',
          couleur: 'bg-green-100 text-green-800',
          nombreArticles: 8
        },
        {
          id: '3',
          nom: 'Suivi',
          description: 'Tracking et statut des colis',
          couleur: 'bg-purple-100 text-purple-800',
          nombreArticles: 15
        },
        {
          id: '4',
          nom: 'Problèmes',
          description: 'Résolution des incidents',
          couleur: 'bg-red-100 text-red-800',
          nombreArticles: 6
        }
      ];

      const mockArticles: Article[] = [
        {
          id: '1',
          titre: 'Comment suivre mon colis ?',
          contenu: 'Pour suivre votre colis, vous pouvez utiliser le numéro de tracking...',
          resume: 'Guide complet pour le suivi des colis avec Befret',
          categorie: 'Suivi',
          tags: ['tracking', 'colis', 'suivi'],
          auteur: 'Marie Nzuzi',
          dateCreation: '2024-01-10T10:00:00Z',
          dateMiseAJour: '2024-01-12T14:30:00Z',
          vues: 156,
          likes: 23,
          statut: 'publie'
        },
        {
          id: '2',
          titre: 'Délais de livraison vers le Congo',
          contenu: 'Les délais de livraison varient selon la destination...',
          resume: 'Informations sur les temps de transit vers différentes villes',
          categorie: 'Expédition',
          tags: ['délais', 'congo', 'livraison'],
          auteur: 'Jean Kalala',
          dateCreation: '2024-01-08T15:20:00Z',
          dateMiseAJour: '2024-01-08T15:20:00Z',
          vues: 89,
          likes: 15,
          statut: 'publie'
        },
        {
          id: '3',
          titre: 'Tarifs d\'expédition 2024',
          contenu: 'Nos nouveaux tarifs pour l\'année 2024...',
          resume: 'Grille tarifaire mise à jour pour tous les services',
          categorie: 'Facturation',
          tags: ['tarifs', 'prix', '2024'],
          auteur: 'Pierre Mukeba',
          dateCreation: '2024-01-05T09:15:00Z',
          dateMiseAJour: '2024-01-10T11:45:00Z',
          vues: 234,
          likes: 31,
          statut: 'publie'
        },
        {
          id: '4',
          titre: 'Que faire si mon colis est endommagé ?',
          contenu: 'En cas de dommage, voici la procédure à suivre...',
          resume: 'Procédure de réclamation pour les colis endommagés',
          categorie: 'Problèmes',
          tags: ['dommage', 'réclamation', 'assurance'],
          auteur: 'Sophie Martin',
          dateCreation: '2024-01-03T16:30:00Z',
          dateMiseAJour: '2024-01-03T16:30:00Z',
          vues: 67,
          likes: 8,
          statut: 'publie'
        }
      ];

      setCategories(mockCategories);
      setArticles(mockArticles);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.resume.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategorie = selectedCategorie === 'all' || article.categorie === selectedCategorie;
    return matchesSearch && matchesCategorie && article.statut === 'publie';
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCategorieColor = (categorieName: string) => {
    const categorie = categories.find(c => c.nom === categorieName);
    return categorie?.couleur || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement de la base de connaissances...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Base de Connaissances</h1>
            <p className="text-gray-600 mt-2">Articles et guides d'aide pour l'équipe support</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel Article
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Articles</p>
                  <p className="text-2xl font-bold text-green-600">{articles.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Catégories</p>
                  <p className="text-2xl font-bold text-green-600">{categories.length}</p>
                </div>
                <Tag className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vues Totales</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {articles.reduce((sum, article) => sum + article.vues, 0)}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Likes Totaux</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {articles.reduce((sum, article) => sum + article.likes, 0)}
                  </p>
                </div>
                <ThumbsUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Catégories */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Catégories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant={selectedCategorie === 'all' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategorie('all')}
                >
                  Toutes les catégories
                </Button>
                {categories.map((categorie) => (
                  <Button
                    key={categorie.id}
                    variant={selectedCategorie === categorie.nom ? 'default' : 'ghost'}
                    className="w-full justify-between"
                    onClick={() => setSelectedCategorie(categorie.nom)}
                  >
                    <span>{categorie.nom}</span>
                    <Badge variant="secondary">{categorie.nombreArticles}</Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Articles */}
          <div className="lg:col-span-3 space-y-6">
            {/* Recherche */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher dans les articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Liste des articles */}
            <Card>
              <CardHeader>
                <CardTitle>Articles ({filteredArticles.length})</CardTitle>
                <CardDescription>
                  {selectedCategorie === 'all' 
                    ? 'Tous les articles publiés' 
                    : `Articles de la catégorie "${selectedCategorie}"`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredArticles.map((article) => (
                    <Card key={article.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getCategorieColor(article.categorie)}>
                                {article.categorie}
                              </Badge>
                              {article.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            
                            <h3 className="font-semibold text-lg mb-2 hover:text-green-600 cursor-pointer">
                              {article.titre}
                            </h3>
                            <p className="text-gray-600 mb-3">{article.resume}</p>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {article.auteur}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(article.dateMiseAJour)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {article.vues} vues
                              </div>
                              <div className="flex items-center gap-1">
                                <ThumbsUp className="h-4 w-4" />
                                {article.likes}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredArticles.length === 0 && (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Aucun article trouvé</p>
                      <p className="text-gray-500 text-sm">Essayez de modifier vos critères de recherche</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}