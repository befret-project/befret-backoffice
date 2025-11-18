'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Check, X, Loader2 } from 'lucide-react';
import { getTwoFactorStatus, disableTwoFactor } from '@/lib/auth-2fa';
import type { TwoFactorStatus } from '@/types/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TwoFactorSettingsProps {
  userId: string;
}

export function TwoFactorSettings({ userId }: TwoFactorSettingsProps) {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadStatus();
  }, [userId]);

  const loadStatus = async () => {
    try {
      setIsLoading(true);
      const result = await getTwoFactorStatus(userId);
      if (result.success) {
        setStatus(result.status);
      }
    } catch (error: any) {
      setError('Erreur lors du chargement du statut 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable = () => {
    router.push(`/setup-2fa?userId=${userId}`);
  };

  const handleDisable = async () => {
    if (!password) {
      setError('Veuillez entrer votre mot de passe');
      return;
    }

    try {
      setIsDisabling(true);
      setError('');
      const result = await disableTwoFactor(userId, password);

      if (result.success) {
        setShowDisableDialog(false);
        setPassword('');
        await loadStatus(); // Reload status
      } else {
        setError(result.message || 'Erreur lors de la désactivation');
      }
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la désactivation');
    } finally {
      setIsDisabling(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Jamais';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Authentification à deux facteurs (2FA)
          </CardTitle>
          <CardDescription>
            Chargement...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Authentification à deux facteurs (2FA)
          </CardTitle>
          <CardDescription>
            Ajoutez une couche de sécurité supplémentaire à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Status Badge */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <p className="font-medium text-slate-900">Statut actuel</p>
              <p className="text-sm text-slate-600">
                {status?.enabled ? 'La 2FA est activée' : 'La 2FA est désactivée'}
              </p>
            </div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
              status?.enabled
                ? 'bg-green-100 text-green-700'
                : 'bg-slate-200 text-slate-700'
            }`}>
              {status?.enabled ? (
                <>
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">Activée</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4" />
                  <span className="text-sm font-medium">Désactivée</span>
                </>
              )}
            </div>
          </div>

          {/* Information */}
          {status?.enabled ? (
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Protection active :</strong> Votre compte est protégé par l'authentification à deux facteurs.
                  Un code de votre application d'authentification sera requis à chaque connexion.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <p className="text-slate-600 mb-1">Activée le</p>
                  <p className="font-medium text-slate-900">{formatDate(status.enrolledAt)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <p className="text-slate-600 mb-1">Dernière utilisation</p>
                  <p className="font-medium text-slate-900">{formatDate(status.lastUsedAt)}</p>
                </div>
              </div>

              {status.backupCodesRemaining !== undefined && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Codes de secours restants :</strong> {status.backupCodesRemaining}/10
                  </p>
                  {status.backupCodesRemaining < 3 && (
                    <p className="text-xs text-amber-700 mt-1">
                      Attention : Il ne vous reste que {status.backupCodesRemaining} codes de secours.
                      Pensez à en régénérer.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Recommandation :</strong> Activez la 2FA pour renforcer la sécurité de votre compte.
                  L'authentification à deux facteurs protège votre compte même si votre mot de passe est compromis.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-700 font-medium mb-2">Avantages de la 2FA :</p>
                <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                  <li>Protection renforcée contre les accès non autorisés</li>
                  <li>Compatible avec Google Authenticator, Authy, et autres applications TOTP</li>
                  <li>Codes de secours fournis pour les situations d'urgence</li>
                  <li>Conformité aux normes de sécurité professionnelles</li>
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            {status?.enabled ? (
              <Button
                onClick={() => setShowDisableDialog(true)}
                variant="destructive"
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Désactiver la 2FA
              </Button>
            ) : (
              <Button
                onClick={handleEnable}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Shield className="mr-2 h-4 w-4" />
                Activer la 2FA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Désactiver l'authentification à deux facteurs</DialogTitle>
            <DialogDescription>
              Pour désactiver la 2FA, veuillez confirmer votre mot de passe.
              Cette action réduira la sécurité de votre compte.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                disabled={isDisabling}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDisableDialog(false);
                setPassword('');
                setError('');
              }}
              disabled={isDisabling}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={isDisabling || !password}
            >
              {isDisabling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Désactivation...
                </>
              ) : (
                'Désactiver'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
