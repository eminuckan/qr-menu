import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createClient } from './lib/supabase/server';


export async function middleware(request: NextRequest) {
  const pathName = request.nextUrl.pathname
  if (pathName.startsWith('/logout')) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}