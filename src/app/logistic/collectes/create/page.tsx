'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { CollecteService } from '@/services/collecte';
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
  AlertCircle,
  Plus
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CollecteFormData {
  reference: string;
  client: {
    nom: string;
    telephone: string;
    email: string;
    entreprise?: string;
  };
  adresse: {
    rue: string;
    ville: string;
    codePostal: string;
    pays: string;
  };
  status: 'programmee' | 'en_cours' | 'terminee' | 'annulee';
  datePrevue?: string;
  heureCollecte?: string;
  nbColis?: number;
  poidsTotal?: number;
  typeCollecte: 'domicile' | 'entreprise' | 'point_relais';
  chauffeur?: string;
  notes?: string;
  priorite: 'normale' | 'urgente' | 'express';
  operateur?: string;
}

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

const operateurOptions = [
  'Sophie Chen',
  'Marc Dubois',
  'Pierre Martin',
  'Emma Rousseau',
  'Thomas Petit',
  'Camille Durand'
];

const generateReference = () => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `COL-${year}-${month}-${random}`;
};

export default function CollecteCreatePage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState<CollecteFormData>({
    reference: generateReference(),
    client: {
      nom: '',
      telephone: '',
      email: '',
      entreprise: ''
    },
    adresse: {
      rue: '',
      ville: '',
      codePostal: '',
      pays: 'France'
    },
    status: 'programmee',
    datePrevue: '',
    heureCollecte: '',
    nbColis: 1,
    poidsTotal: 0,
    typeCollecte: 'domicile',
    chauffeur: '',
    priorite: 'normale',
    operateur: '',
    notes: ''
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | number) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => {
        if (!prev) return prev;
        
        const parentValue = prev[parent as keyof CollecteFormData];
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

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validation client
    if (!formData.client.nom.trim()) newErrors['client.nom'] = 'Nom du client obligatoire';
    if (!formData.client.email.trim()) newErrors['client.email'] = 'Email obligatoire';
    if (!formData.client.telephone.trim()) newErrors['client.telephone'] = 'Téléphone obligatoire';

    // Validation email format
    if (formData.client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client.email)) {
      newErrors['client.email'] = 'Format email invalide';
    }

    // Validation adresse
    if (!formData.adresse.rue.trim()) newErrors['adresse.rue'] = 'Rue obligatoire';
    if (!formData.adresse.ville.trim()) newErrors['adresse.ville'] = 'Ville obligatoire';
    if (!formData.adresse.codePostal.trim()) newErrors['adresse.codePostal'] = 'Code postal obligatoire';
    if (!formData.adresse.pays.trim()) newErrors['adresse.pays'] = 'Pays obligatoire';

    // Validation dates
    if (formData.datePrevue && formData.datePrevue < new Date().toISOString().split('T')[0]) {
      newErrors.datePrevue = 'La date ne peut pas être dans le passé';
    }

    // Validation poids et colis
    if (formData.nbColis && formData.nbColis < 1) newErrors.nbColis = 'Au moins 1 colis requis';
    if (formData.poidsTotal && formData.poidsTotal < 0) newErrors.poidsTotal = 'Le poids ne peut pas être négatif';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      // Préparer les données pour la création
      const collecteData = {
        client: formData.client,
        adresse: formData.adresse,
        status: formData.status,
        datePrevue: formData.datePrevue || '',
        heureCollecte: formData.heureCollecte || '',
        nbColis: formData.nbColis || 0,
        poidsTotal: formData.poidsTotal || 0,
        typeCollecte: formData.typeCollecte,
        priorite: formData.priorite,
        operateur: formData.operateur || '',
        createdBy: 'current-user' // TODO: récupérer l'utilisateur actuel
      };
      
      // Créer la collecte via le service Firebase
      const collecteId = await CollecteService.schedule(collecteData);
      
      // Rediriger vers la liste des collectes avec un message de succès
      router.push('/logistic/collectes');
    } catch (err) {
      console.error('Error creating collecte:', err);
      alert('Erreur lors de la programmation de la collecte');
    } finally {
      setSaving(false);
    }
  };

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
                  Programmer une Collecte
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
                  Programmation...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Programmer la collecte
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
                  className={errors['client.nom'] ? 'border-red-500' : ''}
                />
                {errors['client.nom'] && <p className="text-sm text-red-500 mt-1">{errors['client.nom']}</p>}
              </div>
              
              <div>
                <Label htmlFor="client-email">Email *</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={formData.client.email}
                  onChange={(e) => handleInputChange('client.email', e.target.value)}
                  placeholder="email@example.com"
                  className={errors['client.email'] ? 'border-red-500' : ''}
                />
                {errors['client.email'] && <p className="text-sm text-red-500 mt-1">{errors['client.email']}</p>}
              </div>
              
              <div>
                <Label htmlFor="client-telephone">Téléphone *</Label>
                <Input
                  id="client-telephone"
                  value={formData.client.telephone}
                  onChange={(e) => handleInputChange('client.telephone', e.target.value)}
                  placeholder="+33 1 23 45 67 89"
                  className={errors['client.telephone'] ? 'border-red-500' : ''}
                />
                {errors['client.telephone'] && <p className="text-sm text-red-500 mt-1">{errors['client.telephone']}</p>}
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
                  className={errors['adresse.rue'] ? 'border-red-500' : ''}
                />
                {errors['adresse.rue'] && <p className="text-sm text-red-500 mt-1">{errors['adresse.rue']}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adresse-codePostal">Code postal *</Label>
                  <Input
                    id="adresse-codePostal"
                    value={formData.adresse.codePostal}
                    onChange={(e) => handleInputChange('adresse.codePostal', e.target.value)}
                    placeholder="75001"
                    className={errors['adresse.codePostal'] ? 'border-red-500' : ''}
                  />
                  {errors['adresse.codePostal'] && <p className="text-sm text-red-500 mt-1">{errors['adresse.codePostal']}</p>}
                </div>
                <div>
                  <Label htmlFor="adresse-ville">Ville *</Label>
                  <Input
                    id="adresse-ville"
                    value={formData.adresse.ville}
                    onChange={(e) => handleInputChange('adresse.ville', e.target.value)}
                    placeholder="Paris"
                    className={errors['adresse.ville'] ? 'border-red-500' : ''}
                  />
                  {errors['adresse.ville'] && <p className="text-sm text-red-500 mt-1">{errors['adresse.ville']}</p>}
                </div>
              </div>
              
              <div>
                <Label htmlFor="adresse-pays">Pays *</Label>
                <Input
                  id="adresse-pays"
                  value={formData.adresse.pays}
                  onChange={(e) => handleInputChange('adresse.pays', e.target.value)}
                  placeholder="France"
                  className={errors['adresse.pays'] ? 'border-red-500' : ''}
                />
                {errors['adresse.pays'] && <p className="text-sm text-red-500 mt-1">{errors['adresse.pays']}</p>}
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
                  min={new Date().toISOString().split('T')[0]}
                  className={errors.datePrevue ? 'border-red-500' : ''}
                />
                {errors.datePrevue && <p className="text-sm text-red-500 mt-1">{errors.datePrevue}</p>}
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
                <Select 
                  value={formData.operateur || ''} 
                  onValueChange={(value) => handleInputChange('operateur', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un opérateur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Non assigné</SelectItem>
                    {operateurOptions.map(operateur => (
                      <SelectItem key={operateur} value={operateur}>
                        {operateur}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Label htmlFor="nbColis">Nombre de colis (estimé)</Label>
                  <Input
                    id="nbColis"
                    type="number"
                    min="0"
                    value={formData.nbColis || ''}
                    onChange={(e) => handleInputChange('nbColis', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className={errors.nbColis ? 'border-red-500' : ''}
                  />
                  {errors.nbColis && <p className="text-sm text-red-500 mt-1">{errors.nbColis}</p>}
                </div>
                <div>
                  <Label htmlFor="poidsTotal">Poids total estimé (kg)</Label>
                  <Input
                    id="poidsTotal"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.poidsTotal || ''}
                    onChange={(e) => handleInputChange('poidsTotal', parseFloat(e.target.value) || 0)}
                    placeholder="0.0"
                    className={errors.poidsTotal ? 'border-red-500' : ''}
                  />
                  {errors.poidsTotal && <p className="text-sm text-red-500 mt-1">{errors.poidsTotal}</p>}
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