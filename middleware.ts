import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const PROTECTED = ['/dashboard', '/my-books', '/recommendations', '/profile'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!PROTECTED.some(p => path.startsWith(p))) return NextResponse.next();

  const token = request.cookies.get('summer-session')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', request.url));

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/my-books/:path*', '/recommendations/:path*', '/profile/:path*'],
};
