'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/main-layout';
import { collection, query, orderBy, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-config';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  AlertCircle, 
  Clock, 
  CheckCircle,
  XCircle,
  User,
  Package,
  Calendar,
  MessageCircle,
  Filter,
  Eye
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Complaint {
  id: string;
  title: string;
  description: string;
  trackingId?: string;
  customerName: string;
  customerEmail: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  category: 'delivery' | 'damage' | 'lost' | 'delay' | 'billing' | 'other';
  createdAt: string;
  assignedTo?: string;
  lastUpdate: string;
  responseCount: number;
}

// Récupération des plaintes depuis Firebase Firestore
const fetchComplaints = async (): Promise<Complaint[]> => {
  try {
    console.log('Fetching complaints from Firestore...');
    
    const complaintsRef = collection(db, 'complaints');
    const q = query(complaintsRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const complaintsList: Complaint[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      complaintsList.push({
        id: docSnapshot.id,
        title: data.title || '',
        description: data.description || '',
        trackingId: data.trackingId,
        customerName: data.customerName || '',
        customerEmail: data.customerEmail || '',
        priority: data.priority || 'medium',
        status: data.status || 'new',
        category: data.category || 'other',
        createdAt: data.createdAt || new Date().toISOString(),
        assignedTo: data.assignedTo,
        lastUpdate: data.lastUpdate || data.createdAt || new Date().toISOString(),
        responseCount: data.responseCount || 0
      });
    });

    console.log(`Found ${complaintsList.length} complaints`);
    return complaintsList;
  } catch (error) {
    console.error('Error fetching complaints from Firestore:', error);
    
    // Fallback avec quelques plaintes d'exemple pour démonstration
    const fallbackComplaints: Complaint[] = [
      {
        id: '1',
        title: 'Colis endommagé à la livraison',
        description: 'Le colis BF-2024-001234 est arrivé avec l\'emballage déchiré et certains articles sont cassés.',
        trackingId: 'BF-2024-001234',
        customerName: 'Marie Dupont',
        customerEmail: 'marie.dupont@email.com',
        priority: 'high',
        status: 'new',
        category: 'damage',
        createdAt: '2024-06-28T14:30:00Z',
        lastUpdate: '2024-06-28T14:30:00Z',
        responseCount: 0
      },
      {
        id: '2',
        title: 'Retard de livraison important',
        description: 'Mon colis devait arriver il y a une semaine mais je n\'ai toujours aucune nouvelle.',
        trackingId: 'BF-2024-001189',
        customerName: 'Jean Martin',
        customerEmail: 'jean.martin@email.com',
        priority: 'medium',
        status: 'in_progress',
        category: 'delay',
        createdAt: '2024-06-25T09:15:00Z',
        assignedTo: 'Agent Support',
        lastUpdate: '2024-06-27T11:20:00Z',
        responseCount: 2
      },
      {
        id: '3',
        title: 'Erreur de facturation',
        description: 'J\'ai été facturé deux fois pour le même envoi. Merci de corriger.',
        customerName: 'Sophie Laurent',
        customerEmail: 'sophie.laurent@email.com',
        priority: 'low',
        status: 'resolved',
        category: 'billing',
        createdAt: '2024-06-20T16:45:00Z',
        assignedTo: 'Manager Finance',
        lastUpdate: '2024-06-22T10:30:00Z',
        responseCount: 3
      }
    ];
    
    return fallbackComplaints;
  }
};

const priorityLabels: { [key: string]: string } = {
  'low': '📋 Priorité faible',
  'medium': '📌 Priorité moyenne',
  'high': '⚡ Priorité élevée',
  'urgent': '🚨 Priorité urgente'
};

const statusLabels: { [key: string]: string } = {
  'new': '🆕 Nouvelle plainte',
  'in_progress': '🔵 Plainte en cours',
  'resolved': '✅ Plainte résolue',
  'closed': '📁 Plainte fermée'
};

const categoryLabels: { [key: string]: string } = {
  'delivery': '🚚 Problème de livraison',
  'damage': '📦 Colis endommagé',
  'lost': '🔍 Colis perdu',
  'delay': '⏰ Retard de livraison',
  'billing': '💰 Erreur de facturation',
  'other': '📝 Autre demande'
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'resolved':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-green-100 text-green-800';
    case 'closed':
      return 'bg-gray-100 text-gray-800';
    case 'new':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'resolved':
      return CheckCircle;
    case 'in_progress':
      return Clock;
    case 'closed':
      return XCircle;
    case 'new':
      return AlertCircle;
    default:
      return MessageSquare;
  }
};

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadComplaints = async () => {
      setLoading(true);
      const data = await fetchComplaints();
      setComplaints(data);
      setLoading(false);
    };
    loadComplaints();
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    title: '',
    description: '',
    trackingId: '',
    customerName: '',
    customerEmail: '',
    priority: 'medium' as const,
    category: 'other' as const
  });

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = 
      complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.trackingId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || complaint.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreateComplaint = async () => {
    if (!newComplaint.title || !newComplaint.description || !newComplaint.customerName || !newComplaint.customerEmail) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const now = new Date().toISOString();
      const complaintData = {
        title: newComplaint.title,
        description: newComplaint.description,
        trackingId: newComplaint.trackingId || undefined,
        customerName: newComplaint.customerName,
        customerEmail: newComplaint.customerEmail,
        priority: newComplaint.priority,
        status: 'new' as const,
        category: newComplaint.category,
        createdAt: now,
        lastUpdate: now,
        responseCount: 0
      };

      // Ajouter à Firestore
      const complaintsRef = collection(db, 'complaints');
      const docRef = await addDoc(complaintsRef, complaintData);
      
      const newComplaintObj: Complaint = {
        id: docRef.id,
        ...complaintData
      };

      setComplaints([newComplaintObj, ...complaints]);
      setNewComplaint({
        title: '',
        description: '',
        trackingId: '',
        customerName: '',
        customerEmail: '',
        priority: 'medium',
        category: 'other'
      });
      setIsCreateDialogOpen(false);
      
      console.log('Complaint created successfully:', docRef.id);
    } catch (error) {
      console.error('Error creating complaint:', error);
      alert('Erreur lors de la création de la plainte');
    }
  };

  const updateComplaintStatus = async (id: string, status: Complaint['status']) => {
    try {
      const now = new Date().toISOString();
      
      // Mettre à jour dans Firestore
      const complaintRef = doc(db, 'complaints', id);
      await updateDoc(complaintRef, {
        status,
        lastUpdate: now,
        ...(status === 'in_progress' && { assignedTo: 'Agent Support' })
      });
      
      // Mettre à jour l'état local
      setComplaints(complaints.map(complaint =>
        complaint.id === id
          ? { 
              ...complaint, 
              status, 
              lastUpdate: now,
              ...(status === 'in_progress' && { assignedTo: 'Agent Support' })
            }
          : complaint
      ));
      
      console.log(`Complaint ${id} status updated to ${status}`);
    } catch (error) {
      console.error('Error updating complaint status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
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
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Gestion des Plaintes</h1>
              <p className="mt-2 text-slate-600">
                Gérez et suivez les plaintes et réclamations clients
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-10 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-md transition-all duration-200">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Plainte
                </Button>
              </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle plainte</DialogTitle>
              <DialogDescription>
                Enregistrez une nouvelle plainte ou réclamation client
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Titre *
                </Label>
                <Input
                  id="title"
                  placeholder="Résumé de la plainte"
                  value={newComplaint.title}
                  onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Description détaillée du problème..."
                  value={newComplaint.description}
                  onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                  className="col-span-3"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="trackingId" className="text-right">
                  N° Tracking
                </Label>
                <Input
                  id="trackingId"
                  placeholder="BF-2025-123456"
                  value={newComplaint.trackingId}
                  onChange={(e) => setNewComplaint({ ...newComplaint, trackingId: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customerName" className="text-right">
                  Client *
                </Label>
                <Input
                  id="customerName"
                  placeholder="Nom du client"
                  value={newComplaint.customerName}
                  onChange={(e) => setNewComplaint({ ...newComplaint, customerName: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customerEmail" className="text-right">
                  Email *
                </Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="email@example.com"
                  value={newComplaint.customerEmail}
                  onChange={(e) => setNewComplaint({ ...newComplaint, customerEmail: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">
                  Priorité
                </Label>
                <Select value={newComplaint.priority} onValueChange={(value: any) => setNewComplaint({ ...newComplaint, priority: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Catégorie
                </Label>
                <Select value={newComplaint.category} onValueChange={(value: any) => setNewComplaint({ ...newComplaint, category: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delivery">Livraison</SelectItem>
                    <SelectItem value="damage">Dommage</SelectItem>
                    <SelectItem value="lost">Colis perdu</SelectItem>
                    <SelectItem value="delay">Retard</SelectItem>
                    <SelectItem value="billing">Facturation</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateComplaint}>
                Créer la plainte
              </Button>
            </DialogFooter>
          </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-sm border-slate-200 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">Total Plaintes</CardTitle>
              <div className="p-2 rounded-xl bg-green-600 shadow-lg">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{complaints.length}</div>
              <p className="text-xs text-slate-600 mt-1">Toutes catégories</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-slate-200 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">Nouvelles</CardTitle>
              <div className="p-2 rounded-xl bg-amber-600 shadow-lg">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-700">
                {complaints.filter(c => c.status === 'new').length}
              </div>
              <p className="text-xs text-slate-600 mt-1">Nécessitent attention</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-slate-200 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">En Cours</CardTitle>
              <div className="p-2 rounded-xl bg-indigo-600 shadow-lg">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-700">
                {complaints.filter(c => c.status === 'in_progress').length}
              </div>
              <p className="text-xs text-slate-600 mt-1">En traitement</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-slate-200 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">Résolues</CardTitle>
              <div className="p-2 rounded-xl bg-emerald-600 shadow-lg">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-700">
                {complaints.filter(c => c.status === 'resolved').length}
              </div>
              <p className="text-xs text-slate-600 mt-1">Satisfaction client</p>
            </CardContent>
          </Card>
      </div>

        {/* Filtres et recherche */}
        <Card className="shadow-sm border-slate-200 rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-slate-900">
              <Filter className="h-5 w-5 text-green-600" />
              <span>Filtres et Recherche</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par titre, client ou tracking..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80 h-12 border-slate-300 focus:border-green-500 focus:ring-green-500 rounded-xl"
                />
              </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="new">Nouveau</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="resolved">Résolu</SelectItem>
                <SelectItem value="closed">Fermé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </CardContent>
        </Card>

        {/* Liste des plaintes */}
        <Card className="shadow-sm border-slate-200 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-slate-900">Plaintes ({filteredComplaints.length})</CardTitle>
          </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredComplaints.map((complaint) => {
              const StatusIcon = getStatusIcon(complaint.status);
              return (
                <div
                  key={complaint.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <StatusIcon className="h-5 w-5 mt-1 text-green-600" />
                      <div>
                        <h3 className="font-semibold text-lg">{complaint.title}</h3>
                        <p className="text-gray-600 mt-1">{complaint.description}</p>
                        {complaint.trackingId && (
                          <div className="flex items-center space-x-2 mt-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-mono text-green-600">{complaint.trackingId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Badge className={getPriorityColor(complaint.priority)}>
                        {priorityLabels[complaint.priority]}
                      </Badge>
                      <Badge className={getStatusColor(complaint.status)}>
                        {statusLabels[complaint.status]}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Client</p>
                        <p className="font-medium">{complaint.customerName}</p>
                        <p className="text-gray-400">{complaint.customerEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Créée le</p>
                        <p className="font-medium">{formatDate(complaint.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Réponses</p>
                        <p className="font-medium">{complaint.responseCount}</p>
                        {complaint.assignedTo && (
                          <p className="text-gray-400">Assignée à {complaint.assignedTo}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-sm text-gray-500">
                      Catégorie: <span className="font-medium">{categoryLabels[complaint.category]}</span>
                      <span className="ml-4">Dernière mise à jour: {formatDate(complaint.lastUpdate)}</span>
                    </div>
                    <div className="flex space-x-2">
                      {complaint.status === 'new' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateComplaintStatus(complaint.id, 'in_progress')}
                        >
                          Prendre en charge
                        </Button>
                      )}
                      {complaint.status === 'in_progress' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateComplaintStatus(complaint.id, 'resolved')}
                        >
                          Marquer résolu
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => alert(`Détails de la plainte ${complaint.id}: ${complaint.title}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredComplaints.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune plainte trouvée</h3>
                <p className="text-gray-500">
                  Aucune plainte ne correspond à vos critères de recherche
                </p>
              </div>
            )}
          </div>
        </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}