'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Package2, ArrowLeft } from 'lucide-react';
import { verifyTwoFactor, getTempTwoFactorData, clearTempTwoFactorData } from '@/lib/auth-2fa';

export default function Verify2FAPage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<{ userId: string; email: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get temporary user data from session storage
    const tempData = getTempTwoFactorData();
    if (!tempData) {
      // No temporary data, redirect to login
      router.push('/login');
      return;
    }
    setUserData(tempData);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    setError('');
    setIsLoading(true);

    try {
      const result = await verifyTwoFactor(userData.userId, token);

      if (result.success && result.valid) {
        // Clear temporary data
        clearTempTwoFactorData();

        // Redirect to dashboard
        router.push('/modules');
      } else {
        setError('Code invalide. Veuillez réessayer.');
      }
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la vérification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    clearTempTwoFactorData();
    router.push('/login');
  };

  if (!userData) {
    return null; // or loading spinner
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-2xl mb-4 shadow-lg">
            <Package2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Vérification en deux étapes</h1>
          <p className="text-slate-600">Entrez le code de votre application d'authentification</p>
        </div>

        {/* Carte de vérification */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-slate-700">Protection renforcée</span>
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Connecté en tant que:</strong> {userData.email}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="token" className="text-slate-700 font-medium">Code d'authentification</Label>
              <Input
                id="token"
                name="token"
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').substring(0, 6))}
                placeholder="000000"
                disabled={isLoading}
                className="h-12 bg-slate-50 border-slate-300 focus:border-green-500 focus:ring-green-500 rounded-lg text-center text-2xl font-mono tracking-widest"
                maxLength={6}
                autoComplete="off"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-2">
                Entrez le code à 6 chiffres de votre application Google Authenticator ou similaire
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50"
              disabled={isLoading || token.length !== 6}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Vérification en cours...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-5 w-5" />
                  Vérifier le code
                </>
              )}
            </Button>
          </form>

          {/* Séparateur */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500">Besoin d'aide ?</span>
            </div>
          </div>

          {/* Bouton retour */}
          <Button
            type="button"
            onClick={handleBackToLogin}
            variant="outline"
            className="w-full h-12 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border-2 border-slate-300 shadow-md transition-all duration-200 hover:shadow-lg"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Retour à la connexion
          </Button>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600">
              <strong>Code de secours :</strong> Si vous n'avez pas accès à votre application d'authentification,
              vous pouvez utiliser l'un de vos codes de secours fournis lors de l'activation du 2FA.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-500">
            © 2024 Befret - Logistique Europe-Congo
          </p>
        </div>
      </div>
    </div>
  );
}
