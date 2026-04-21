import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/expired'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }
  // static assets pass-through
  if (pathname.startsWith('/_next') || pathname.includes('.')) return NextResponse.next();

  const hasCookie = req.cookies.get('socially_session');
  if (!hasCookie) {
    return NextResponse.redirect(new URL('/expired', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
