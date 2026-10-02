import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Ignore static files and internal next routes
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/images') ||
      pathname === '/favicon.ico' ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    const sessionCookie =
      request.cookies.get('naam_session')?.value ||
      request.cookies.get('sb-access-token')?.value;

    // Redirect to login if accessing protected route without session
    if (!sessionCookie && pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Redirect to dashboard if logged in and trying to open /login
    if (sessionCookie && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch (e) {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
