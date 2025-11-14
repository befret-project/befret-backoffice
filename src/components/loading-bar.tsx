'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Barre de progression globale pour toutes les navigations
 * S'affiche automatiquement lors du changement de route
 */
export function LoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Démarrer le chargement
    setLoading(true);
    setProgress(20);

    // Animation de progression
    const timer1 = setTimeout(() => setProgress(40), 100);
    const timer2 = setTimeout(() => setProgress(60), 300);
    const timer3 = setTimeout(() => setProgress(80), 600);

    // Simuler une complétion après un court délai
    const completeTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    }, 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(completeTimer);
    };
  }, [pathname, searchParams]);

  if (!loading && progress === 0) return null;

  return (
    <>
      {/* Top loading bar */}
      <div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-green-600 to-green-700 z-[9999] transition-all duration-300 ease-out shadow-lg"
        style={{
          width: `${progress}%`,
          opacity: loading ? 1 : 0,
        }}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
      </div>

      {/* Full screen overlay with spinner (optional - only for longer loads) */}
      {loading && progress < 80 && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[9998] flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
                <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-green-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
              </div>
              <p className="text-sm font-medium text-slate-700">Chargement...</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
