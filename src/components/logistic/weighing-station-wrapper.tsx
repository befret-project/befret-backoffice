'use client';

import { useSearchParams } from 'next/navigation';
import { EnhancedParcelReception } from './enhanced-parcel-reception';

export function WeighingStationWrapper() {
  const searchParams = useSearchParams();
  const trackingID = searchParams.get('tracking');

  return <EnhancedParcelReception initialTrackingID={trackingID || undefined} />;
}