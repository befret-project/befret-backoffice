'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ExpeditionService } from '@/services/expedition';
import { 
  ArrowLeft,
  Save,
  Truck,
  MapPin,
  Package,
  Calendar,
  AlertCircle,
  User,
  Building,
  Phone,
  Euro,
  Plus
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExpeditionFormData {
  reference: string;
  destination: {
    ville: string;
    pays: string;
    adresse: string;
  };
  status: 'preparation' | 'en_cours' | 'arrive' | 'livre';
  nbColis: number;
  transporteur: {
    nom: string;
    contact: string;
    telephone: string;
  };
  dateDepart: string;
  dateArriveePrevu: string;
  tracking: string;
  responsable: string;
  conteneur?: string;
  poids: number;
  valeur: number;
  priorite: 'normale' | 'urgente' | 'express';
  notes?: string;
}

const statusOptions = [
  { value: 'preparation', label: '📋 En préparation à l\'entrepôt' },
  { value: 'en_cours', label: '🚢 En transit vers destination' },
  { value: 'arrive', label: '🛬 Arrivé à destination' },
  { value: 'livre', label: '✅ Livré aux destinataires' }
];

const prioriteOptions = [
  { value: 'normale', label: '📋 Normale' },
  { value: 'urgente', label: '⚡ Urgente' },
  { value: 'express', label: '🚀 Express' }
];

const transporteurOptions = [
  'DHL Congo',
  'FedEx International',
  'UPS Worldwide',
  'TNT Express',
  'Bollore Logistics',
  'SCAC Transport'
];

const responsableOptions = [
  'Marc Dubois',
  'Sophie Chen',
  'Pierre Martin',
  'Emma Rousseau',
  'Thomas Petit',
  'Camille Durand'
];

const paysOptions = [
  'RD Congo',
  'Cameroun',
  'Côte d\'Ivoire',
  'Sénégal',
  'Mali',
  'Burkina Faso',
  'Niger',
  'Madagascar'
];

const generateReference = () => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `EXP-${year}-${month}-${random}`;
};

const generateTracking = (transporteur: string) => {
  if (!transporteur) return '';
  const prefix = transporteur.split(' ')[0].toUpperCase().substring(0, 3);
  const random = Math.floor(Math.random() * 1000000000).toString();
  return `${prefix}-${random}`;
};

export default function ExpeditionCreatePage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState<ExpeditionFormData>({
    reference: generateReference(),
    destination: {
      ville: '',
      pays: '',
      adresse: ''
    },
    status: 'preparation',
    nbColis: 1,
    transporteur: {
      nom: '',
      contact: '',
      telephone: ''
    },
    dateDepart: '',
    dateArriveePrevu: '',
    tracking: '',
    responsable: '',
    conteneur: '',
    poids: 0,
    valeur: 0,
    priorite: 'normale',
    notes: ''
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | number) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => {
        if (!prev) return prev;
        
        const parentValue = prev[parent as keyof ExpeditionFormData];
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

    // Auto-generate tracking when transporteur changes
    if (field === 'transporteur.nom' && typeof value === 'string') {
      const newTracking = generateTracking(value);
      setFormData(prev => ({
        ...prev,
        tracking: newTracking
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

    if (!formData.reference.trim()) newErrors.reference = 'Référence obligatoire';
    if (!formData.destination.ville.trim()) newErrors['destination.ville'] = 'Ville obligatoire';
    if (!formData.destination.pays.trim()) newErrors['destination.pays'] = 'Pays obligatoire';
    if (!formData.destination.adresse.trim()) newErrors['destination.adresse'] = 'Adresse obligatoire';
    if (!formData.transporteur.nom.trim()) newErrors['transporteur.nom'] = 'Transporteur obligatoire';
    if (!formData.transporteur.contact.trim()) newErrors['transporteur.contact'] = 'Contact obligatoire';
    if (!formData.transporteur.telephone.trim()) newErrors['transporteur.telephone'] = 'Téléphone obligatoire';
    if (!formData.dateDepart) newErrors.dateDepart = 'Date de départ obligatoire';
    if (!formData.dateArriveePrevu) newErrors.dateArriveePrevu = 'Date d\'arrivée prévue obligatoire';
    if (!formData.responsable.trim()) newErrors.responsable = 'Responsable obligatoire';
    if (formData.nbColis < 1) newErrors.nbColis = 'Au moins 1 colis requis';
    if (formData.poids <= 0) newErrors.poids = 'Poids doit être supérieur à 0';
    if (formData.valeur < 0) newErrors.valeur = 'Valeur ne peut pas être négative';

    // Validate date logic
    if (formData.dateDepart && formData.dateArriveePrevu) {
      const dateDepart = new Date(formData.dateDepart);
      const dateArrivee = new Date(formData.dateArriveePrevu);
      if (dateArrivee <= dateDepart) {
        newErrors.dateArriveePrevu = 'Date d\'arrivée doit être après le départ';
      }
    }

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
      const expeditionData = {
        destination: formData.destination,
        status: formData.status,
        nbColis: formData.nbColis,
        transporteur: formData.transporteur,
        dateDepart: formData.dateDepart,
        dateArriveePrevu: formData.dateArriveePrevu,
        tracking: formData.tracking,
        responsable: formData.responsable,
        conteneur: formData.conteneur || undefined,
        poids: formData.poids,
        valeur: formData.valeur,
        priorite: formData.priorite,
        notes: formData.notes || undefined,
        createdBy: 'current-user' // TODO: récupérer l'utilisateur actuel
      };
      
      // Créer l'expédition via le service Firebase
      const expeditionId = await ExpeditionService.create(expeditionData);
      
      alert('Expédition créée avec succès !');
      router.push(`/logistic/expeditions/detail?id=${expeditionId}`);
    } catch (err) {
      console.error('Error creating expedition:', err);
      alert('Erreur lors de la création de l\'expédition');
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
                  Nouvelle Expédition
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
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer l'expédition
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informations générales */}
          <Card className="shadow-sm border-slate-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Informations Générales</span>
              </CardTitle>
              <CardDescription>
                Référence, tracking et responsable de l'expédition
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reference">Référence *</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => handleInputChange('reference', e.target.value)}
                  placeholder="EXP-2024-XXX"
                  className={errors.reference ? 'border-red-500' : ''}
                />
                {errors.reference && <p className="text-sm text-red-500 mt-1">{errors.reference}</p>}
              </div>
              
              <div>
                <Label htmlFor="tracking">Numéro de tracking</Label>
                <Input
                  id="tracking"
                  value={formData.tracking}
                  onChange={(e) => handleInputChange('tracking', e.target.value)}
                  placeholder="Auto-généré selon transporteur"
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-généré lors de la sélection du transporteur</p>
              </div>
              
              <div>
                <Label htmlFor="responsable">Responsable *</Label>
                <Select 
                  value={formData.responsable} 
                  onValueChange={(value) => handleInputChange('responsable', value)}
                >
                  <SelectTrigger className={errors.responsable ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Sélectionner un responsable" />
                  </SelectTrigger>
                  <SelectContent>
                    {responsableOptions.map(responsable => (
                      <SelectItem key={responsable} value={responsable}>
                        {responsable}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.responsable && <p className="text-sm text-red-500 mt-1">{errors.responsable}</p>}
              </div>

              <div>
                <Label htmlFor="conteneur">Conteneur</Label>
                <Input
                  id="conteneur"
                  value={formData.conteneur || ''}
                  onChange={(e) => handleInputChange('conteneur', e.target.value)}
                  placeholder="CONT-001 (optionnel)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Destination */}
          <Card className="shadow-sm border-slate-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Destination</span>
              </CardTitle>
              <CardDescription>
                Lieu de livraison final
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="destination-ville">Ville *</Label>
                <Input
                  id="destination-ville"
                  value={formData.destination.ville}
                  onChange={(e) => handleInputChange('destination.ville', e.target.value)}
                  placeholder="Kinshasa"
                  className={errors['destination.ville'] ? 'border-red-500' : ''}
                />
                {errors['destination.ville'] && <p className="text-sm text-red-500 mt-1">{errors['destination.ville']}</p>}
              </div>
              
              <div>
                <Label htmlFor="destination-pays">Pays *</Label>
                <Select 
                  value={formData.destination.pays} 
                  onValueChange={(value) => handleInputChange('destination.pays', value)}
                >
                  <SelectTrigger className={errors['destination.pays'] ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Sélectionner un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {paysOptions.map(pays => (
                      <SelectItem key={pays} value={pays}>
                        {pays}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors['destination.pays'] && <p className="text-sm text-red-500 mt-1">{errors['destination.pays']}</p>}
              </div>
              
              <div>
                <Label htmlFor="destination-adresse">Adresse complète *</Label>
                <Textarea
                  id="destination-adresse"
                  value={formData.destination.adresse}
                  onChange={(e) => handleInputChange('destination.adresse', e.target.value)}
                  placeholder="Avenue Tombalbaye, Gombe"
                  className={`min-h-[80px] ${errors['destination.adresse'] ? 'border-red-500' : ''}`}
                />
                {errors['destination.adresse'] && <p className="text-sm text-red-500 mt-1">{errors['destination.adresse']}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Transporteur */}
          <Card className="shadow-sm border-slate-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Transporteur</span>
              </CardTitle>
              <CardDescription>
                Compagnie et contact transporteur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="transporteur-nom">Compagnie *</Label>
                <Select 
                  value={formData.transporteur.nom} 
                  onValueChange={(value) => handleInputChange('transporteur.nom', value)}
                >
                  <SelectTrigger className={errors['transporteur.nom'] ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Sélectionner un transporteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {transporteurOptions.map(transporteur => (
                      <SelectItem key={transporteur} value={transporteur}>
                        {transporteur}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors['transporteur.nom'] && <p className="text-sm text-red-500 mt-1">{errors['transporteur.nom']}</p>}
              </div>
              
              <div>
                <Label htmlFor="transporteur-contact">Contact *</Label>
                <Input
                  id="transporteur-contact"
                  value={formData.transporteur.contact}
                  onChange={(e) => handleInputChange('transporteur.contact', e.target.value)}
                  placeholder="Nom du contact"
                  className={errors['transporteur.contact'] ? 'border-red-500' : ''}
                />
                {errors['transporteur.contact'] && <p className="text-sm text-red-500 mt-1">{errors['transporteur.contact']}</p>}
              </div>
              
              <div>
                <Label htmlFor="transporteur-telephone">Téléphone *</Label>
                <Input
                  id="transporteur-telephone"
                  value={formData.transporteur.telephone}
                  onChange={(e) => handleInputChange('transporteur.telephone', e.target.value)}
                  placeholder="+243 81 234 5678"
                  className={errors['transporteur.telephone'] ? 'border-red-500' : ''}
                />
                {errors['transporteur.telephone'] && <p className="text-sm text-red-500 mt-1">{errors['transporteur.telephone']}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Planning et statut */}
          <Card className="shadow-sm border-slate-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Planning et Statut</span>
              </CardTitle>
              <CardDescription>
                Dates, statut et priorité de l'expédition
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

              <div>
                <Label htmlFor="dateDepart">Date de départ *</Label>
                <Input
                  id="dateDepart"
                  type="date"
                  value={formData.dateDepart}
                  onChange={(e) => handleInputChange('dateDepart', e.target.value)}
                  className={errors.dateDepart ? 'border-red-500' : ''}
                />
                {errors.dateDepart && <p className="text-sm text-red-500 mt-1">{errors.dateDepart}</p>}
              </div>
              
              <div>
                <Label htmlFor="dateArriveePrevu">Arrivée prévue *</Label>
                <Input
                  id="dateArriveePrevu"
                  type="date"
                  value={formData.dateArriveePrevu}
                  onChange={(e) => handleInputChange('dateArriveePrevu', e.target.value)}
                  className={errors.dateArriveePrevu ? 'border-red-500' : ''}
                />
                {errors.dateArriveePrevu && <p className="text-sm text-red-500 mt-1">{errors.dateArriveePrevu}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Détails colis et valeur */}
        <Card className="shadow-sm border-slate-200 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Détails Colis et Valeur</span>
            </CardTitle>
            <CardDescription>
              Quantité, poids et valeur de l'expédition
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="nbColis">Nombre de colis *</Label>
                <Input
                  id="nbColis"
                  type="number"
                  min="1"
                  value={formData.nbColis}
                  onChange={(e) => handleInputChange('nbColis', parseInt(e.target.value) || 1)}
                  placeholder="1"
                  className={errors.nbColis ? 'border-red-500' : ''}
                />
                {errors.nbColis && <p className="text-sm text-red-500 mt-1">{errors.nbColis}</p>}
              </div>
              <div>
                <Label htmlFor="poids">Poids total (kg) *</Label>
                <Input
                  id="poids"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.poids}
                  onChange={(e) => handleInputChange('poids', parseFloat(e.target.value) || 0)}
                  placeholder="0.0"
                  className={errors.poids ? 'border-red-500' : ''}
                />
                {errors.poids && <p className="text-sm text-red-500 mt-1">{errors.poids}</p>}
              </div>
              <div>
                <Label htmlFor="valeur">Valeur déclarée (€) *</Label>
                <Input
                  id="valeur"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.valeur}
                  onChange={(e) => handleInputChange('valeur', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={errors.valeur ? 'border-red-500' : ''}
                />
                {errors.valeur && <p className="text-sm text-red-500 mt-1">{errors.valeur}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="shadow-sm border-slate-200 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Notes et Instructions</span>
            </CardTitle>
            <CardDescription>
              Instructions spéciales pour l'expédition
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Instructions spéciales, précautions, remarques..."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}