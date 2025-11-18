'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Package2, Copy, Check, Download, Smartphone } from 'lucide-react';
import { setupTwoFactor, enableTwoFactor } from '@/lib/auth-2fa';
import QRCode from 'qrcode';

export default function Setup2FAPage() {
  const [step, setStep] = useState<'loading' | 'qrcode' | 'verify' | 'backup' | 'complete'>('loading');
  const [secret, setSecret] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [manualEntryKey, setManualEntryKey] = useState('');
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  useEffect(() => {
    if (!userId) {
      router.push('/login');
      return;
    }

    initSetup();
  }, [userId, router]);

  const initSetup = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const result = await setupTwoFactor(userId);

      if (result.success && result.secret) {
        setSecret(result.secret.secret);
        setManualEntryKey(result.secret.manualEntryKey);

        // Generate QR code from URL
        const qrDataUrl = await QRCode.toDataURL(result.secret.qrCodeUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });
        setQrCodeDataUrl(qrDataUrl);

        setStep('qrcode');
      } else {
        setError('Erreur lors de la configuration du 2FA');
      }
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'initialisation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyToken = async () => {
    if (!userId) return;

    setError('');
    setIsLoading(true);

    try {
      const result = await enableTwoFactor(userId, token, secret);

      if (result.success && result.enabled) {
        setBackupCodes(result.backupCodes);
        setStep('backup');
      } else {
        setError('Code invalide. Veuillez réessayer.');
      }
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la vérification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(manualEntryKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'befret-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleComplete = () => {
    router.push('/settings');
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-2xl mb-4 shadow-lg">
            <Package2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Configuration 2FA</h1>
          <p className="text-slate-600">
            {step === 'qrcode' && 'Scannez le QR code avec votre application'}
            {step === 'verify' && 'Vérifiez votre configuration'}
            {step === 'backup' && 'Sauvegardez vos codes de secours'}
            {step === 'complete' && 'Configuration terminée avec succès'}
          </p>
        </div>

        {/* Carte principale */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Étape 1: QR Code */}
          {step === 'qrcode' && (
            <div className="space-y-6">
              <div className="flex items-center justify-center mb-6">
                <Shield className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-slate-700">Étape 1 sur 3</span>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Instructions :</strong>
                </p>
                <ol className="list-decimal list-inside text-sm text-blue-700 mt-2 space-y-1">
                  <li>Installez une application d'authentification (Google Authenticator, Authy, etc.)</li>
                  <li>Scannez le QR code ci-dessous avec votre application</li>
                  <li>Entrez le code généré pour confirmer</li>
                </ol>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg border-4 border-slate-200 shadow-inner">
                  {qrCodeDataUrl && (
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code 2FA"
                      className="w-64 h-64"
                    />
                  )}
                </div>

                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-2">Impossible de scanner ?</p>
                  <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <code className="text-sm font-mono text-slate-800">{manualEntryKey}</code>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyKey}
                      className="h-8 w-8 p-0"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Saisissez cette clé manuellement dans votre application</p>
                </div>
              </div>

              <Button
                onClick={() => setStep('verify')}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                <Smartphone className="mr-2 h-5 w-5" />
                J'ai scanné le QR code
              </Button>
            </div>
          )}

          {/* Étape 2: Vérification */}
          {step === 'verify' && (
            <div className="space-y-6">
              <div className="flex items-center justify-center mb-6">
                <Shield className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-slate-700">Étape 2 sur 3</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="token" className="text-slate-700 font-medium">
                  Code de vérification
                </Label>
                <Input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  placeholder="000000"
                  disabled={isLoading}
                  className="h-12 bg-slate-50 border-slate-300 focus:border-green-500 focus:ring-green-500 rounded-lg text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-2">
                  Entrez le code à 6 chiffres affiché dans votre application
                </p>
              </div>

              <Button
                onClick={handleVerifyToken}
                disabled={isLoading || token.length !== 6}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Vérifier et activer
                  </>
                )}
              </Button>

              <Button
                onClick={() => setStep('qrcode')}
                variant="outline"
                className="w-full h-12"
              >
                Retour
              </Button>
            </div>
          )}

          {/* Étape 3: Codes de secours */}
          {step === 'backup' && (
            <div className="space-y-6">
              <div className="flex items-center justify-center mb-6">
                <Shield className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-slate-700">Étape 3 sur 3</span>
              </div>

              <Alert className="bg-amber-50 border-amber-200">
                <AlertDescription className="text-amber-800">
                  <strong>Important :</strong> Sauvegardez ces codes de secours dans un endroit sûr.
                  Vous pourrez les utiliser si vous perdez l'accès à votre application d'authentification.
                  Chaque code ne peut être utilisé qu'une seule fois.
                </AlertDescription>
              </Alert>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Codes de secours</h3>
                <div className="grid grid-cols-2 gap-3">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="bg-white p-3 rounded border border-slate-300 font-mono text-sm text-center"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleDownloadBackupCodes}
                variant="outline"
                className="w-full h-12"
              >
                <Download className="mr-2 h-5 w-5" />
                Télécharger les codes
              </Button>

              <Button
                onClick={handleComplete}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                <Check className="mr-2 h-5 w-5" />
                J'ai sauvegardé mes codes
              </Button>
            </div>
          )}
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
