import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    // Basic request log for debugging
    // Note: runs on edge, so keep it light
    console.log(`[mw] ${request.method} ${request.nextUrl.pathname}`);
  } catch {}
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};


