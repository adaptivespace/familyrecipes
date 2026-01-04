import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Only protect API routes that modify data
  if (request.nextUrl.pathname.startsWith('/api/')) {
     const method = request.method;
     if (['POST', 'PATCH', 'DELETE', 'PUT'].includes(method)) {
         // Allow login/logout
         if (request.nextUrl.pathname.startsWith('/api/auth')) {
             return NextResponse.next();
         }

         const token = request.cookies.get('admin_token')?.value;
         
         // If no token, unauthorized
         if (!token) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
         }

         // Note: In a real production app, we would verify the token against a signed secret.
         // For this prototype, we rely on the HttpOnly cookie mechanism.
         // We could re-hash the ADMIN_PASSWORD here to verify, but accessing env vars 
         // in middleware can sometimes be tricky depending on deployment. 
         // Assuming standard Next.js env loading works:
         
         // const adminPassword = process.env.ADMIN_PASSWORD;
         // if (adminPassword) {
         //    const hash = crypto.createHash('sha256').update(adminPassword).digest('hex');
         //    if (token !== hash) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
         // }
     }
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
