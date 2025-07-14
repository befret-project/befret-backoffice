'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft,
  Save,
  User,
  MapPin,
  Package,
  Calendar,
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CollecteService } from '@/services/collecte';
import { Collecte } from '@/types/collecte';


const statusOptions = [
  { value: 'programmee', label: '📅 Programmée' },
  { value: 'en_cours', label: '🚚 En cours' },
  { value: 'terminee', label: '✅ Terminée' },
  { value: 'annulee', label: '❌ Annulée' }
];

const prioriteOptions = [
  { value: 'normale', label: '📋 Normale' },
  { value: 'urgente', label: '⚡ Urgente' },
  { value: 'express', label: '🚀 Express' }
];

const typeOptions = [
  { value: 'domicile', label: '🏠 Domicile' },
  { value: 'entreprise', label: '🏢 Entreprise' },
  { value: 'point_relais', label: '📍 Point relais' }
];

const chauffeurOptions = [
  'Pierre Martin',
  'Thomas Petit',
  'Lucas Bernard',
  'Camille Durand',
  'Emma Rousseau',
  'Sophie Chen'
];


export default function CollecteEditClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const collecteId = searchParams.get('id');
  
  const [formData, setFormData] = useState<Collecte | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollecte = async () => {
      if (!collecteId) {
        setError('ID de collecte manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const collecteData = await CollecteService.getById(collecteId);
        if (!collecteData) {
          setError('Collecte non trouvée');
          return;
        }
        
        setFormData(collecteData);
      } catch (err) {
        setError('Erreur lors du chargement de la collecte');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCollecte();
  }, [collecteId]);

  const handleInputChange = (field: string, value: string | number) => {
    if (!formData) return;

    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => {
        if (!prev) return prev;
        
        const parentValue = prev[parent as keyof Collecte];
        if (typeof parentValue === 'object' && parentValue !== null) {
          return {
            ...prev,
            [parent]: {
              ...parentValue,
              [child]: value
            }
          };
        }
        return prev;
      });
    } else {
      setFormData(prev => ({
        ...prev!,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    if (!formData || !collecteId) return;

    try {
      setSaving(true);
      
      // Préparer les données de mise à jour en excluant les champs non modifiables
      const { id, reference, createdAt, createdBy, ...updateData } = formData;
      
      await CollecteService.update(collecteId, updateData);
      
      alert('Collecte modifiée avec succès !');
      router.push(`/logistic/collectes/detail?id=${collecteId}`);
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" disabled>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !formData) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
          <Card className="shadow-sm border-slate-200 rounded-2xl">
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {error || 'Collecte non trouvée'}
                </h3>
                <p className="text-gray-500">
                  Vérifiez l'ID de la collecte et réessayez.
                </p>
              </div>
            </CardContent>
          </Card>
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
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button 
                variant="outline" 
                onClick={() => router.back()} 
                className="self-start sm:self-auto h-10 px-4 rounded-xl border-slate-300 hover:border-green-500 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Modifier la Collecte
                </h1>
                <p className="text-slate-600 font-mono text-lg">
                  {formData.reference}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="h-10 px-6 rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-md transition-all duration-200"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informations client */}
          <Card className="shadow-sm border-slate-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Informations Client</span>
              </CardTitle>
              <CardDescription>
                Coordonnées et informations de contact du client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="client-nom">Nom du client *</Label>
                <Input
                  id="client-nom"
                  value={formData.client.nom}
                  onChange={(e) => handleInputChange('client.nom', e.target.value)}
                  placeholder="Nom complet du client"
                />
              </div>
              
              <div>
                <Label htmlFor="client-email">Email *</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={formData.client.email}
                  onChange={(e) => handleInputChange('client.email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="client-telephone">Téléphone *</Label>
                <Input
                  id="client-telephone"
                  value={formData.client.telephone}
                  onChange={(e) => handleInputChange('client.telephone', e.target.value)}
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
              
              <div>
                <Label htmlFor="client-entreprise">Entreprise</Label>
                <Input
                  id="client-entreprise"
                  value={formData.client.entreprise || ''}
                  onChange={(e) => handleInputChange('client.entreprise', e.target.value)}
                  placeholder="Nom de l'entreprise (optionnel)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Adresse */}
          <Card className="shadow-sm border-slate-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Adresse de Collecte</span>
              </CardTitle>
              <CardDescription>
                Lieu où effectuer la collecte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="adresse-rue">Rue *</Label>
                <Input
                  id="adresse-rue"
                  value={formData.adresse.rue}
                  onChange={(e) => handleInputChange('adresse.rue', e.target.value)}
                  placeholder="Numéro et nom de rue"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adresse-codePostal">Code postal *</Label>
                  <Input
                    id="adresse-codePostal"
                    value={formData.adresse.codePostal}
                    onChange={(e) => handleInputChange('adresse.codePostal', e.target.value)}
                    placeholder="75001"
                  />
                </div>
                <div>
                  <Label htmlFor="adresse-ville">Ville *</Label>
                  <Input
                    id="adresse-ville"
                    value={formData.adresse.ville}
                    onChange={(e) => handleInputChange('adresse.ville', e.target.value)}
                    placeholder="Paris"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="adresse-pays">Pays *</Label>
                <Input
                  id="adresse-pays"
                  value={formData.adresse.pays}
                  onChange={(e) => handleInputChange('adresse.pays', e.target.value)}
                  placeholder="France"
                />
              </div>
            </CardContent>
          </Card>

          {/* Planification */}
          <Card className="shadow-sm border-slate-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Planification</span>
              </CardTitle>
              <CardDescription>
                Date, heure et assignation de la collecte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="datePrevue">Date prévue</Label>
                <Input
                  id="datePrevue"
                  type="date"
                  value={formData.datePrevue || ''}
                  onChange={(e) => handleInputChange('datePrevue', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="heureCollecte">Heure prévue</Label>
                <Input
                  id="heureCollecte"
                  type="time"
                  value={formData.heureCollecte || ''}
                  onChange={(e) => handleInputChange('heureCollecte', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="chauffeur">Chauffeur assigné</Label>
                <Select 
                  value={formData.chauffeur || ''} 
                  onValueChange={(value) => handleInputChange('chauffeur', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un chauffeur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Non assigné</SelectItem>
                    {chauffeurOptions.map(chauffeur => (
                      <SelectItem key={chauffeur} value={chauffeur}>
                        {chauffeur}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="operateur">Opérateur</Label>
                <Input
                  id="operateur"
                  value={formData.operateur || ''}
                  onChange={(e) => handleInputChange('operateur', e.target.value)}
                  placeholder="Nom de l'opérateur"
                />
              </div>
            </CardContent>
          </Card>

          {/* Détails de la collecte */}
          <Card className="shadow-sm border-slate-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Détails de la Collecte</span>
              </CardTitle>
              <CardDescription>
                Type, statut et informations sur les colis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="typeCollecte">Type de collecte</Label>
                <Select 
                  value={formData.typeCollecte} 
                  onValueChange={(value) => handleInputChange('typeCollecte', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priorite">Priorité</Label>
                <Select 
                  value={formData.priorite} 
                  onValueChange={(value) => handleInputChange('priorite', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {prioriteOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nbColis">Nombre de colis</Label>
                  <Input
                    id="nbColis"
                    type="number"
                    min="0"
                    value={formData.nbColis}
                    onChange={(e) => handleInputChange('nbColis', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="poidsTotal">Poids total (kg)</Label>
                  <Input
                    id="poidsTotal"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.poidsTotal}
                    onChange={(e) => handleInputChange('poidsTotal', parseFloat(e.target.value) || 0)}
                    placeholder="0.0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        <Card className="shadow-sm border-slate-200 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Notes et Instructions</span>
            </CardTitle>
            <CardDescription>
              Instructions spéciales pour la collecte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Instructions spéciales, accès, horaires particuliers..."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}