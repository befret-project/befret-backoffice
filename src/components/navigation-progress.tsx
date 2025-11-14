'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NavigationProgressContextType {
  isNavigating: boolean;
  startNavigation: () => void;
  stopNavigation: () => void;
}

const NavigationProgressContext = createContext<NavigationProgressContextType>({
  isNavigating: false,
  startNavigation: () => {},
  stopNavigation: () => {},
});

export function useNavigationProgress() {
  return useContext(NavigationProgressContext);
}

export function NavigationProgressProvider({ children }: { children: ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    setProgress(0);

    // Animation de progression immédiate
    setTimeout(() => setProgress(30), 50);
    setTimeout(() => setProgress(60), 200);
    setTimeout(() => setProgress(90), 500);
  }, []);

  const stopNavigation = useCallback(() => {
    setProgress(100);
    setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 300);
  }, []);

  return (
    <NavigationProgressContext.Provider value={{ isNavigating, startNavigation, stopNavigation }}>
      {/* Barre de progression globale */}
      {isNavigating && (
        <div
          className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-green-600 to-green-700 z-[9999] transition-all duration-200 ease-out shadow-lg"
          style={{
            width: `${progress}%`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      )}

      {/* Overlay avec spinner pour chargements longs */}
      {isNavigating && progress > 50 && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-[2px] z-[9998] flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl p-5 border border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 border-3 border-green-200 border-t-green-600 rounded-full animate-spin" />
              </div>
              <p className="text-sm font-medium text-slate-700">Chargement...</p>
            </div>
          </div>
        </div>
      )}

      {children}
    </NavigationProgressContext.Provider>
  );
}
