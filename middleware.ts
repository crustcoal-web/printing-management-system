import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // PUBLIC ROUTES
  const publicRoutes = ['/login', '/favicon.ico', '/images'];
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

  // CHECK AUTH COOKIE / SESSION (Using local/supabase session indicator cookie)
  const sessionCookie = request.cookies.get('naam_session')?.value || request.cookies.get('sb-access-token')?.value;

  // Unauthenticated user attempting to access protected dashboard routes
  if (!sessionCookie && !isPublic && pathname !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Authenticated user trying to access /login
  if (sessionCookie && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
