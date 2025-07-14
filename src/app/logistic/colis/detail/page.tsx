'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ParcelDetailClient } from './parcel-detail-client';

function ParcelDetailPageContent() {
  const searchParams = useSearchParams();
  const [parcelId, setParcelId] = useState<string>('');

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setParcelId(id);
    }
  }, [searchParams]);

  if (!parcelId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Chargement des détails du colis...</p>
        </div>
      </div>
    );
  }

  return <ParcelDetailClient parcelId={parcelId} />;
}

export default function ParcelDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    }>
      <ParcelDetailPageContent />
    </Suspense>
  );
}