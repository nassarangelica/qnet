// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't need authentication
const PUBLIC_ROUTES = ["/login", "/register"];

// Security headers
const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // Create response
  const response = NextResponse.next();

  // Add security headers to ALL responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Check for auth session cookie on protected routes
  const token =
    request.cookies.get("__session")?.value ||
    request.cookies.get("firebase-token")?.value;

  // Redirect to login if accessing protected route without session
  if (!isPublic && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to feed if already logged in and visiting auth pages
  if (isPublic && token) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|api).*)",
  ],
};