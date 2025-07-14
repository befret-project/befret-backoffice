import { MainLayout } from '@/components/layout/main-layout';
import { QRCodeManagement } from '@/components/logistic/qr-code-management';

export default function QRCodesPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestion des Codes QR
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Générer et gérer les codes QR pour le suivi des colis
          </p>
        </div>

        <QRCodeManagement />
      </div>
    </MainLayout>
  );
}