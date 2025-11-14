'use client';

import Link, { LinkProps } from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, MouseEvent, useCallback } from 'react';
import { useNavigationProgress } from './navigation-progress';

interface SmartLinkProps extends Omit<LinkProps, 'href'> {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * SmartLink - Version améliorée de next/link avec feedback visuel instantané
 * Démarre l'indicateur de chargement immédiatement au clic, sans délai
 */
export function SmartLink({ href, children, className, onClick, ...props }: SmartLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { startNavigation, stopNavigation } = useNavigationProgress();

  const handleClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    // Appeler le onClick custom si fourni
    if (onClick) {
      onClick(e);
    }

    // Ne rien faire si la navigation est annulée ou si c'est la même page
    if (e.defaultPrevented || pathname === href) {
      return;
    }

    // Empêcher la navigation par défaut
    e.preventDefault();

    // Démarrer l'indicateur de chargement IMMÉDIATEMENT
    startNavigation();

    // Lancer la navigation
    router.push(href);

    // Arrêter l'indicateur après un délai maximum
    setTimeout(() => {
      stopNavigation();
    }, 3000);
  }, [href, pathname, onClick, router, startNavigation, stopNavigation]);

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}
