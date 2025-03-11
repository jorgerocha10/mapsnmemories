import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const session = await auth();
  
  // Check if the user is authenticated
  if (!session?.user) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
  
  // Check for admin routes
  if (request.nextUrl.pathname.startsWith('/dashboard/admin')) {
    // Fetch user from the database to get their role
    try {
      const res = await fetch(`${request.nextUrl.origin}/api/user`, {
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      });
      
      if (!res.ok) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      
      const user = await res.json();
      
      // If user is not an admin, redirect to dashboard
      if (user.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      // If there's an error, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}

// Specify which paths should NOT be handled by the middleware
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}; 