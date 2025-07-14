import { useState, useEffect, useCallback } from 'react';

export interface TabletOptimizedOptions {
  hapticFeedback?: boolean;
  largeButtons?: boolean;
  autoZoom?: boolean;
}

export function useTabletOptimized(options: TabletOptimizedOptions = {}) {
  const [isTablet, setIsTablet] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [touchSupport, setTouchSupport] = useState(false);

  useEffect(() => {
    // Détecter si c'est une tablette
    const checkTablet = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isTabletUA = /tablet|ipad|android(?!.*mobile)/i.test(userAgent);
      const isTabletSize = window.innerWidth >= 768 && window.innerWidth <= 1024;
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setIsTablet(isTabletUA || (isTabletSize && hasTouchScreen));
      setTouchSupport(hasTouchScreen);
    };

    // Détecter orientation
    const checkOrientation = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };

    checkTablet();
    checkOrientation();

    window.addEventListener('resize', checkTablet);
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkTablet);
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Feedback haptique
  const vibrate = useCallback((pattern: number | number[] = 50) => {
    if (options.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, [options.hapticFeedback]);

  // Classes CSS conditionnelles
  const getTabletClasses = useCallback((baseClasses: string = '') => {
    const classes = [baseClasses];
    
    if (isTablet) {
      classes.push('tablet-optimized');
      
      if (options.largeButtons) {
        classes.push('tablet-button-large');
      }
    }
    
    if (touchSupport) {
      classes.push('tablet-hover', 'tablet-press');
    }
    
    return classes.filter(Boolean).join(' ');
  }, [isTablet, touchSupport, options.largeButtons]);

  // Gestionnaire de clic avec feedback
  const handleTabletClick = useCallback((onClick: () => void) => {
    return () => {
      vibrate(50);
      onClick();
    };
  }, [vibrate]);

  // Configuration des inputs
  const getInputProps = useCallback(() => {
    if (isTablet) {
      return {
        className: 'tablet-input',
        autoComplete: 'off',
        autoCorrect: 'off',
        autoCapitalize: 'off',
        spellCheck: false
      };
    }
    return {};
  }, [isTablet]);

  // Configuration des boutons
  const getButtonProps = useCallback((size: 'normal' | 'large' = 'normal') => {
    const props: any = {};
    
    if (isTablet) {
      props.className = size === 'large' ? 'tablet-button-large' : 'tablet-button';
    }
    
    return props;
  }, [isTablet]);

  // Détection de swipe
  const useSwipeDetection = useCallback(() => {
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);
    const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
      const touch = e.touches[0];
      setStartPos({ x: touch.clientX, y: touch.clientY });
      setSwipeDirection(null);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      if (!startPos) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startPos.x;
      const deltaY = touch.clientY - startPos.y;
      const minSwipeDistance = 50;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        setSwipeDirection(deltaX > 0 ? 'right' : 'left');
      } else if (Math.abs(deltaY) > minSwipeDistance) {
        setSwipeDirection(deltaY > 0 ? 'down' : 'up');
      }

      setStartPos(null);
    };

    return {
      swipeDirection,
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd
    };
  }, []);

  // Gestion du zoom automatique
  useEffect(() => {
    if (options.autoZoom && isTablet) {
      // Empêcher le zoom automatique sur les inputs
      const metaViewport = document.querySelector('meta[name="viewport"]');
      if (metaViewport) {
        metaViewport.setAttribute('content', 
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
        );
      }
    }
  }, [options.autoZoom, isTablet]);

  return {
    isTablet,
    orientation,
    touchSupport,
    vibrate,
    getTabletClasses,
    handleTabletClick,
    getInputProps,
    getButtonProps,
    useSwipeDetection
  };
}

// Hook spécialisé pour les formulaires
export function useTabletForm() {
  const tablet = useTabletOptimized({ hapticFeedback: true, largeButtons: true });
  
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const handleFieldFocus = useCallback((fieldName: string) => {
    setFocusedField(fieldName);
    tablet.vibrate(30);
  }, [tablet]);
  
  const handleFieldBlur = useCallback(() => {
    setFocusedField(null);
  }, []);
  
  const getFieldProps = useCallback((fieldName: string) => {
    return {
      ...tablet.getInputProps(),
      onFocus: () => handleFieldFocus(fieldName),
      onBlur: handleFieldBlur,
      'data-focused': focusedField === fieldName
    };
  }, [tablet, focusedField, handleFieldFocus, handleFieldBlur]);
  
  return {
    ...tablet,
    focusedField,
    getFieldProps
  };
}

// Hook pour la caméra/scanner
export function useTabletCamera() {
  const tablet = useTabletOptimized();
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  useEffect(() => {
    // Vérifier les permissions caméra
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'camera' as PermissionName })
        .then(result => {
          setCameraPermission(result.state as any);
        })
        .catch(() => {
          setCameraPermission('prompt');
        });
    }
  }, []);
  
  const requestCameraPermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission('granted');
      tablet.vibrate([50, 100, 50]);
      return true;
    } catch (error) {
      setCameraPermission('denied');
      tablet.vibrate(200);
      return false;
    }
  }, [tablet]);
  
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    tablet.vibrate(50);
  }, [tablet]);
  
  return {
    ...tablet,
    cameraPermission,
    facingMode,
    requestCameraPermission,
    switchCamera
  };
}