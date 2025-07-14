'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Email ou mot de passe incorrect';
      case 'AccessDenied':
        return 'Accès refusé. Votre compte n\'a pas les permissions nécessaires.';
      case 'Configuration':
        return 'Erreur de configuration du serveur';
      case 'Verification':
        return 'Erreur de vérification';
      default:
        return 'Une erreur est survenue lors de la connexion';
    }
  };

  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {getErrorMessage(error)}
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <p className="text-sm text-gray-600 text-center">
          Si le problème persiste, contactez votre administrateur système.
        </p>

        <Button asChild className="w-full">
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la connexion
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Chargement...
          </AlertDescription>
        </Alert>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}