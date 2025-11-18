'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TwoFactorSettings } from '@/components/settings/two-factor-settings';
import { User, Mail, Shield as ShieldIcon } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Paramètres du compte</h1>
        <p className="text-slate-600">Gérez vos informations personnelles et vos paramètres de sécurité</p>
      </div>

      <div className="space-y-6">
        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Informations du profil
            </CardTitle>
            <CardDescription>
              Vos informations personnelles et votre rôle dans l'application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <Mail className="h-5 w-5 text-slate-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700 mb-1">Adresse email</p>
                  <p className="text-sm text-slate-900">{user.email}</p>
                </div>
              </div>

              {/* Name */}
              <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <User className="h-5 w-5 text-slate-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700 mb-1">Nom</p>
                  <p className="text-sm text-slate-900">{user.name || 'Non défini'}</p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <ShieldIcon className="h-5 w-5 text-slate-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700 mb-1">Rôle</p>
                  <p className="text-sm text-slate-900">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                      {user.role?.replace('_', ' ') || 'Utilisateur'}
                    </span>
                  </p>
                </div>
              </div>

              {/* User ID */}
              <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <User className="h-5 w-5 text-slate-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700 mb-1">ID utilisateur</p>
                  <p className="text-xs font-mono text-slate-900 break-all">{user.id}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two-Factor Authentication Card */}
        <TwoFactorSettings userId={user.id} />
      </div>
    </div>
  );
}
