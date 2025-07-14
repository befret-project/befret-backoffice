'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/main-layout';
import { 
  Users, 
  Plus, 
  Search, 
  UserPlus, 
  Mail, 
  Shield, 
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Filter,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  XCircle
} from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  lastLogin?: string;
  permissions: string[];
}

type SortField = 'displayName' | 'email' | 'role' | 'department' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  role: string;
  department: string;
  status: string;
}

// Récupération des utilisateurs depuis Firebase
const fetchUsers = async (): Promise<User[]> => {
  try {
    // Utiliser la même API Firebase que pour les stats
    const response = await fetch('https://api-rcai6nfrla-uc.a.run.app/api/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data.users || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    
    // Fallback: générer quelques utilisateurs d'exemple basés sur les données Firestore existantes
    const fallbackUsers: User[] = [
      {
        id: '1',
        email: 'admin@befret.com',
        displayName: 'Administrateur',
        role: 'admin',
        department: 'Direction',
        status: 'active',
        createdAt: '2024-01-15T09:00:00Z',
        lastLogin: '2024-07-01T08:30:00Z',
        permissions: ['admin.write', 'logistic.write', 'finance.write', 'support.write']
      },
      {
        id: '2',
        email: 'logistic@befret.com',
        displayName: 'Manager Logistique',
        role: 'logistic_manager',
        department: 'Logistique',
        status: 'active',
        createdAt: '2024-02-01T10:00:00Z',
        lastLogin: '2024-07-01T07:45:00Z',
        permissions: ['logistic.write', 'logistic.read']
      },
      {
        id: '3',
        email: 'warehouse@befret.com',
        displayName: 'Opérateur Entrepôt',
        role: 'warehouse_operator',
        department: 'Logistique',
        status: 'active',
        createdAt: '2024-02-15T11:00:00Z',
        lastLogin: '2024-06-30T16:20:00Z',
        permissions: ['logistic.read']
      },
      {
        id: '4',
        email: 'support@befret.com',
        displayName: 'Agent Support',
        role: 'support_agent',
        department: 'Support',
        status: 'active',
        createdAt: '2024-03-01T09:30:00Z',
        lastLogin: '2024-06-29T14:15:00Z',
        permissions: ['support.write', 'support.read']
      },
      {
        id: '5',
        email: 'finance@befret.com',
        displayName: 'Manager Finance',
        role: 'finance_manager',
        department: 'Finance',
        status: 'active',
        createdAt: '2024-03-15T08:00:00Z',
        lastLogin: '2024-06-28T13:45:00Z',
        permissions: ['finance.write', 'finance.read']
      },
      {
        id: '6',
        email: 'operator2@befret.com',
        displayName: 'Opérateur 2',
        role: 'warehouse_operator',
        department: 'Logistique',
        status: 'active',
        createdAt: '2024-04-01T12:00:00Z',
        lastLogin: '2024-06-27T10:30:00Z',
        permissions: ['logistic.read']
      },
      {
        id: '7',
        email: 'newuser@befret.com',
        displayName: 'Nouvel Utilisateur',
        role: 'support_agent',
        department: 'Support',
        status: 'pending',
        createdAt: '2024-06-25T15:00:00Z',
        permissions: ['support.write', 'support.read']
      }
    ];
    
    return fallbackUsers;
  }
};

const roleLabels: { [key: string]: string } = {
  'admin': '🔑 Administrateur',
  'logistic_manager': '📦 Manager Logistique',
  'warehouse_operator': '🏠 Opérateur Entrepôt',
  'support_agent': '🎧 Agent Support',
  'finance_manager': '💰 Manager Finance'
};

const departmentLabels: { [key: string]: string } = {
  'Direction': '🏢 Direction',
  'Logistique': '🚚 Logistique',
  'Support': '🎧 Support Client',
  'Finance': '💰 Finance & Comptabilité'
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active':
      return '✅ Utilisateur actif';
    case 'inactive':
      return '❌ Utilisateur inactif';
    case 'pending':
      return '⏳ Compte en attente';
    default:
      return status;
  }
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États pour la recherche et filtrage
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // États pour pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // États pour tri
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // États pour filtres
  const [filters, setFilters] = useState<FilterState>({
    role: 'all',
    department: 'all',
    status: 'all'
  });
  
  // États pour sélection
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  
  // États pour dialogue
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    displayName: '',
    role: '',
    department: ''
  });

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
      setLoading(false);
    };
    loadUsers();
  }, []);

  // Logique de filtrage et tri
  const filteredAndSortedUsers = users
    .filter(user => {
      // Filtrage par recherche textuelle
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matches = 
          user.displayName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.department.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }
      
      // Filtrage par critères
      if (filters.role !== 'all' && user.role !== filters.role) return false;
      if (filters.department !== 'all' && user.department !== filters.department) return false;
      if (filters.status !== 'all' && user.status !== filters.status) return false;
      
      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'displayName':
          aValue = a.displayName || '';
          bValue = b.displayName || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'role':
          aValue = a.role || '';
          bValue = b.role || '';
          break;
        case 'department':
          aValue = a.department || '';
          bValue = b.department || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
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
  const totalItems = filteredAndSortedUsers.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage);
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.displayName || !newUser.role || !newUser.department) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      email: newUser.email,
      displayName: newUser.displayName,
      role: newUser.role,
      department: newUser.department,
      status: 'pending',
      createdAt: new Date().toISOString(),
      permissions: getPermissionsForRole(newUser.role)
    };

    setUsers([...users, user]);
    setNewUser({ email: '', displayName: '', role: '', department: '' });
    setIsCreateDialogOpen(false);
  };

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
      role: 'all',
      department: 'all', 
      status: 'all'
    });
    setSearchTerm('');
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map(u => u.id)));
    }
  };

  const handleSelectUser = (id: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUsers(newSelected);
  };

  const getPermissionsForRole = (role: string): string[] => {
    switch (role) {
      case 'admin':
        return ['admin.write', 'logistic.write', 'finance.write', 'support.write'];
      case 'logistic_manager':
        return ['logistic.write', 'logistic.read'];
      case 'warehouse_operator':
        return ['logistic.read'];
      case 'support_agent':
        return ['support.write', 'support.read'];
      case 'finance_manager':
        return ['finance.write', 'finance.read'];
      default:
        return [];
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(user =>
      user.id === userId
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' as any }
        : user
    ));
  };

  const deleteUser = (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      setUsers(users.filter(user => user.id !== userId));
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
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Gestion des Utilisateurs</h1>
              <p className="mt-2 text-slate-600">
                Gérez les comptes utilisateurs et leurs permissions
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-10 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-md transition-all duration-200">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nouvel Utilisateur
                </Button>
              </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
              <DialogDescription>
                Ajoutez un nouvel employé au système avec ses informations et permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="utilisateur@befret.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="displayName" className="text-right">
                  Nom complet *
                </Label>
                <Input
                  id="displayName"
                  placeholder="Jean Dupont"
                  value={newUser.displayName}
                  onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Rôle *
                </Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="logistic_manager">Manager Logistique</SelectItem>
                    <SelectItem value="warehouse_operator">Opérateur Entrepôt</SelectItem>
                    <SelectItem value="support_agent">Agent Support</SelectItem>
                    <SelectItem value="finance_manager">Manager Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department" className="text-right">
                  Département *
                </Label>
                <Select value={newUser.department} onValueChange={(value) => setNewUser({ ...newUser, department: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner un département" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Direction">Direction</SelectItem>
                    <SelectItem value="Logistique">Logistique</SelectItem>
                    <SelectItem value="Support">Support Client</SelectItem>
                    <SelectItem value="Finance">Finance & Comptabilité</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateUser}>
                Créer l'utilisateur
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
              <CardTitle className="text-sm font-semibold text-slate-700">Total Utilisateurs</CardTitle>
              <div className="p-2 rounded-xl bg-green-600 shadow-lg">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{users.length}</div>
              <p className="text-xs text-slate-600 mt-1">Comptes utilisateurs</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-slate-200 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">Utilisateurs Actifs</CardTitle>
              <div className="p-2 rounded-xl bg-emerald-600 shadow-lg">
                <Shield className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-700">
                {users.filter(u => u.status === 'active').length}
              </div>
              <p className="text-xs text-slate-600 mt-1">Connectés récemment</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-slate-200 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">En Attente</CardTitle>
              <div className="p-2 rounded-xl bg-amber-600 shadow-lg">
                <Calendar className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-700">
                {users.filter(u => u.status === 'pending').length}
              </div>
              <p className="text-xs text-slate-600 mt-1">Validation requise</p>
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
              <div className="text-3xl font-bold text-red-700">
                {users.filter(u => u.status === 'inactive').length}
              </div>
              <p className="text-xs text-slate-600 mt-1">Comptes désactivés</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Rôle</label>
                  <Select value={filters.role} onValueChange={(value) => handleFilterChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les rôles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les rôles</SelectItem>
                      {Object.entries(roleLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Département</label>
                  <Select value={filters.department} onValueChange={(value) => handleFilterChange('department', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les départements" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les départements</SelectItem>
                      {Object.entries(departmentLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Statut</label>
                  <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
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
              <span>Rechercher des utilisateurs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, email ou département..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 border-slate-300 focus:border-green-500 focus:ring-green-500 rounded-xl"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table des utilisateurs */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-slate-900">
                  Utilisateurs
                </CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  {totalItems} utilisateur{totalItems > 1 ? 's' : ''} {searchTerm || filters.role !== 'all' || filters.department !== 'all' || filters.status !== 'all' ? 'trouvé' : 'au total'}{totalItems > 1 ? 's' : ''}
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
                {selectedUsers.size > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9">
                        <span className="sm:hidden">({selectedUsers.size})</span>
                        <span className="hidden sm:inline">Actions ({selectedUsers.size})</span>
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
                        Désactiver sélection
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6">
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 animate-pulse">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : paginatedUsers.length > 0 ? (
              <div>
                {/* Table desktop */}
                <div className="hidden lg:block overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('displayName')}>
                          <div className="flex items-center space-x-1">
                            <span>Nom</span>
                            {sortField === 'displayName' && (
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
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('role')}>
                          <div className="flex items-center space-x-1">
                            <span>Rôle</span>
                            {sortField === 'role' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('department')}>
                          <div className="flex items-center space-x-1">
                            <span>Département</span>
                            {sortField === 'department' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                          <div className="flex items-center space-x-1">
                            <span>Statut</span>
                            {sortField === 'status' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('createdAt')}>
                          <div className="flex items-center space-x-1">
                            <span>Créé le</span>
                            {sortField === 'createdAt' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.map((user) => (
                        <TableRow 
                          key={user.id} 
                          className="hover:bg-slate-50 transition-colors"
                          data-state={selectedUsers.has(user.id) ? 'selected' : ''}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.has(user.id)}
                              onCheckedChange={() => handleSelectUser(user.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                                <Users className="h-4 w-4 text-green-600" />
                              </div>
                              <span className="font-medium">{user.displayName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Mail className="h-3 w-3 text-slate-500" />
                              <span className="text-sm">{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                              {roleLabels[user.role]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-600">{departmentLabels[user.department]}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(user.status)} font-medium`}>
                              {getStatusLabel(user.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-600">
                              {formatDate(user.createdAt).split(' ')[0]}
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
                                <DropdownMenuItem onClick={() => toggleUserStatus(user.id)}>
                                  <Shield className="mr-2 h-4 w-4" />
                                  {user.status === 'active' ? 'Désactiver' : 'Activer'}
                                </DropdownMenuItem>
                                {user.id !== '1' && (
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => deleteUser(user.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer
                                  </DropdownMenuItem>
                                )}
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
                            checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors min-w-[150px]" onClick={() => handleSort('displayName')}>
                          <div className="flex items-center space-x-1">
                            <span>Nom</span>
                            {sortField === 'displayName' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors min-w-[120px]" onClick={() => handleSort('role')}>
                          <div className="flex items-center space-x-1">
                            <span>Rôle</span>
                            {sortField === 'role' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                          <div className="flex items-center space-x-1">
                            <span>Statut</span>
                            {sortField === 'status' && (
                              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.map((user) => (
                        <TableRow 
                          key={user.id} 
                          className="hover:bg-slate-50 transition-colors"
                          data-state={selectedUsers.has(user.id) ? 'selected' : ''}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.has(user.id)}
                              onCheckedChange={() => handleSelectUser(user.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                                <Users className="h-3 w-3 text-green-600" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">{user.displayName}</div>
                                <div className="text-xs text-slate-500 max-w-[120px] truncate">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 text-xs">
                              {roleLabels[user.role]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(user.status)} font-medium text-xs`}>
                              {getStatusLabel(user.status)}
                            </Badge>
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
                                <DropdownMenuItem onClick={() => toggleUserStatus(user.id)}>
                                  <Shield className="mr-2 h-4 w-4" />
                                  {user.status === 'active' ? 'Désactiver' : 'Activer'}
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
                  {paginatedUsers.map((user) => (
                    <div key={user.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedUsers.has(user.id)}
                            onCheckedChange={() => handleSelectUser(user.id)}
                          />
                          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                            <Users className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{user.displayName}</h3>
                            <p className="text-xs text-slate-500 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {user.email}
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
                            <DropdownMenuItem onClick={() => toggleUserStatus(user.id)}>
                              <Shield className="mr-2 h-4 w-4" />
                              {user.status === 'active' ? 'Désactiver' : 'Activer'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                        <div>
                          <p className="text-slate-500 text-xs">Rôle</p>
                          <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 text-xs mt-1">
                            {roleLabels[user.role]}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Statut</p>
                          <Badge className={`${getStatusColor(user.status)} font-medium text-xs mt-1`}>
                            {getStatusLabel(user.status)}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Département</p>
                          <p className="font-medium text-xs">{departmentLabels[user.department]}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Créé le</p>
                          <p className="font-medium text-xs">{formatDate(user.createdAt).split(' ')[0]}</p>
                        </div>
                      </div>
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
                <p className="text-gray-500">
                  Essayez de modifier vos critères de recherche ou créez un nouvel utilisateur
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}