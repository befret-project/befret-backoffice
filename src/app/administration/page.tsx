'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Users,
  Shield,
  FileText,
  Database,
  ArrowRight,
  UserCheck,
  Activity,
  Settings
} from 'lucide-react';

export default function AdministrationPage() {
  const modules = [
    {
      title: 'Gestion des Utilisateurs',
      description: 'Créer et gérer les comptes utilisateurs',
      href: '/settings/users',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Rôles & Permissions',
      description: 'Configuration des droits d\'accès',
      href: '/settings/roles',
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Journal d\'Audit',
      description: 'Historique des actions système',
      href: '/settings/audit',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Configuration Système',
      description: 'Paramètres globaux de l\'application',
      href: '/settings/system',
      icon: Database,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Module Administration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestion des utilisateurs, rôles et paramètres système
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${module.color}`} />
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{module.description}</p>
                  <Button asChild className="w-full">
                    <Link href={module.href}>
                      Accéder
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Utilisateurs Actifs</p>
                  <p className="text-2xl font-bold text-green-600">24</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rôles Configurés</p>
                  <p className="text-2xl font-bold text-blue-600">6</p>
                </div>
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Actions Aujourd'hui</p>
                  <p className="text-2xl font-bold text-purple-600">142</p>
                </div>
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Système</p>
                  <p className="text-2xl font-bold text-green-600">OK</p>
                </div>
                <Settings className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
