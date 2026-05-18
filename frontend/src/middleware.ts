import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('tableboost_token');
  const { pathname } = request.nextUrl;

  // Allow login page and API requests without auth check here
  // (API protection is handled by the backend!)
  if (pathname === '/login' || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Redirect to login if no token is present
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Decode role from token
  try {
    const tokenValue = token.value;
    const payloadBase64 = tokenValue.split('.')[1];
    // atob is available in Next.js Edge runtime!
    const payload = JSON.parse(atob(payloadBase64));
    const role = payload.role;

    // Role-based route protection
    if (role === 'STAFF') {
      // Staff can only access /add-visit
      if (pathname !== '/add-visit') {
        const response = NextResponse.redirect(new URL('/add-visit', request.url));
        response.headers.set('Cache-Control', 'no-store, max-age=0');
        return response;
      }
    } else if (role === 'MANAGER') {
      // Manager cannot access /settings
      if (pathname.startsWith('/settings')) {
        const response = NextResponse.redirect(new URL('/', request.url));
        response.headers.set('Cache-Control', 'no-store, max-age=0');
        return response;
      }
    }
    // OWNER can access everything!
  } catch (e) {
    console.error('Failed to parse token in middleware', e);
    // If token is invalid, redirect to login
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
