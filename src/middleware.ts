import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/error');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isRootPage = request.nextUrl.pathname === '/';

  // Allow access to auth pages and API routes
  if (isAuthPage || isApiRoute) {
    return NextResponse.next();
  }

  // Temporarily disable authentication for build
  // TODO: Re-enable authentication after fixing Firebase admin issues
  
  // Redirect root to dashboard
  if (isRootPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*?).*)',
  ],
};