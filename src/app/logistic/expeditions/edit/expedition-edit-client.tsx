'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ExpeditionService } from '@/services/expedition';
import { Expedition } from '@/types/expedition';
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
  Euro
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
  dateArriveeReelle?: string;
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


export default function ExpeditionEditClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const expeditionId = searchParams.get('id');
  
  const [formData, setFormData] = useState<ExpeditionFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpedition = async () => {
      if (!expeditionId) {
        setError('ID d\'expédition manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Utiliser le service Firebase
        const expeditionData = await ExpeditionService.getById(expeditionId);
        
        if (!expeditionData) {
          setError('Expédition non trouvée');
          return;
        }
        
        // Convertir les données Expedition vers ExpeditionFormData
        const formData: ExpeditionFormData = {
          reference: expeditionData.reference,
          destination: expeditionData.destination,
          status: expeditionData.status,
          nbColis: expeditionData.nbColis,
          transporteur: expeditionData.transporteur,
          dateDepart: expeditionData.dateDepart,
          dateArriveePrevu: expeditionData.dateArriveePrevu,
          dateArriveeReelle: expeditionData.dateArriveeReelle || '',
          tracking: expeditionData.tracking,
          responsable: expeditionData.responsable,
          conteneur: expeditionData.conteneur || '',
          poids: expeditionData.poids,
          valeur: expeditionData.valeur,
          priorite: expeditionData.priorite,
          notes: expeditionData.notes || ''
        };
        
        setFormData(formData);
      } catch (err) {
        setError('Erreur lors du chargement de l\'expédition');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchExpedition();
  }, [expeditionId]);

  const handleInputChange = (field: string, value: string | number) => {
    if (!formData) return;

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
  };

  const handleSave = async () => {
    if (!formData || !expeditionId) return;

    try {
      setSaving(true);
      setError(null);
      
      // Préparer les données pour la mise à jour
      const updateData = {
        destination: formData.destination,
        status: formData.status,
        nbColis: formData.nbColis,
        transporteur: formData.transporteur,
        dateDepart: formData.dateDepart,
        dateArriveePrevu: formData.dateArriveePrevu,
        dateArriveeReelle: formData.dateArriveeReelle || undefined,
        tracking: formData.tracking,
        responsable: formData.responsable,
        conteneur: formData.conteneur || undefined,
        poids: formData.poids,
        valeur: formData.valeur,
        priorite: formData.priorite,
        notes: formData.notes || undefined
      };
      
      // Sauvegarder via le service Firebase
      await ExpeditionService.update(expeditionId, updateData);
      
      alert('Expédition modifiée avec succès !');
      router.push(`/logistic/expeditions/detail?id=${expeditionId}`);
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
                  {error || 'Expédition non trouvée'}
                </h3>
                <p className="text-gray-500">
                  Vérifiez l'ID de l'expédition et réessayez.
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
                  Modifier l'Expédition
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
                />
              </div>
              
              <div>
                <Label htmlFor="tracking">Numéro de tracking *</Label>
                <Input
                  id="tracking"
                  value={formData.tracking}
                  onChange={(e) => handleInputChange('tracking', e.target.value)}
                  placeholder="DHL-CD-789012345"
                />
              </div>
              
              <div>
                <Label htmlFor="responsable">Responsable *</Label>
                <Select 
                  value={formData.responsable} 
                  onValueChange={(value) => handleInputChange('responsable', value)}
                >
                  <SelectTrigger>
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
                />
              </div>
              
              <div>
                <Label htmlFor="destination-pays">Pays *</Label>
                <Select 
                  value={formData.destination.pays} 
                  onValueChange={(value) => handleInputChange('destination.pays', value)}
                >
                  <SelectTrigger>
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
              </div>
              
              <div>
                <Label htmlFor="destination-adresse">Adresse complète *</Label>
                <Textarea
                  id="destination-adresse"
                  value={formData.destination.adresse}
                  onChange={(e) => handleInputChange('destination.adresse', e.target.value)}
                  placeholder="Avenue Tombalbaye, Gombe"
                  className="min-h-[80px]"
                />
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
                  <SelectTrigger>
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
              </div>
              
              <div>
                <Label htmlFor="transporteur-contact">Contact *</Label>
                <Input
                  id="transporteur-contact"
                  value={formData.transporteur.contact}
                  onChange={(e) => handleInputChange('transporteur.contact', e.target.value)}
                  placeholder="Nom du contact"
                />
              </div>
              
              <div>
                <Label htmlFor="transporteur-telephone">Téléphone *</Label>
                <Input
                  id="transporteur-telephone"
                  value={formData.transporteur.telephone}
                  onChange={(e) => handleInputChange('transporteur.telephone', e.target.value)}
                  placeholder="+243 81 234 5678"
                />
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
                <Label htmlFor="dateDepart">Date de départ</Label>
                <Input
                  id="dateDepart"
                  type="date"
                  value={formData.dateDepart}
                  onChange={(e) => handleInputChange('dateDepart', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="dateArriveePrevu">Arrivée prévue</Label>
                <Input
                  id="dateArriveePrevu"
                  type="date"
                  value={formData.dateArriveePrevu}
                  onChange={(e) => handleInputChange('dateArriveePrevu', e.target.value)}
                />
              </div>

              {formData.status === 'livre' && (
                <div>
                  <Label htmlFor="dateArriveeReelle">Arrivée réelle</Label>
                  <Input
                    id="dateArriveeReelle"
                    type="date"
                    value={formData.dateArriveeReelle || ''}
                    onChange={(e) => handleInputChange('dateArriveeReelle', e.target.value)}
                  />
                </div>
              )}
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
                <Label htmlFor="nbColis">Nombre de colis</Label>
                <Input
                  id="nbColis"
                  type="number"
                  min="1"
                  value={formData.nbColis}
                  onChange={(e) => handleInputChange('nbColis', parseInt(e.target.value) || 1)}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="poids">Poids total (kg)</Label>
                <Input
                  id="poids"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.poids}
                  onChange={(e) => handleInputChange('poids', parseFloat(e.target.value) || 0)}
                  placeholder="0.0"
                />
              </div>
              <div>
                <Label htmlFor="valeur">Valeur déclarée (€)</Label>
                <Input
                  id="valeur"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.valeur}
                  onChange={(e) => handleInputChange('valeur', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
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