import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { handleCors, addCorsHeaders } from "@/lib/cors";

// JWT Secret - In production, use environment variable
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// User roles from Prisma schema
enum Role {
  ADMIN = "ADMIN",
  SUPPORT = "SUPPORT",
  CLIENT = "CLIENT",
}

// JWT Payload interface
interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// Route access configuration
const ROUTE_ACCESS = {
  "/api/private/admin": [Role.ADMIN],
  "/api/private/support": [Role.SUPPORT, Role.ADMIN], // Admin can access support APIs
  "/api/private": [Role.ADMIN, Role.SUPPORT, Role.CLIENT], // All authenticated users
};

// ✅ RUTAS PÚBLICAS (NO REQUIEREN AUTENTICACIÓN)
const PUBLIC_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/public",
  "/_next",
  "/favicon.ico",
];

// ✅ RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN)
const PROTECTED_ROUTES = [
  "/api/solicitudes",
  "/api/users",
  "/api/reportes",
  "/api/respuestas",
  "/api/private",
];

// Function to verify JWT token
function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

// Function to check if route is public
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route === pathname) return true;
    if (route.endsWith("*")) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname.startsWith(route);
  });
}

// ✅ NUEVA: Function to check if route is protected
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

// Function to check if user has access to route
function hasAccess(pathname: string, userRole: Role): boolean {
  // Check exact route matches
  for (const [route, allowedRoles] of Object.entries(ROUTE_ACCESS)) {
    if (pathname.startsWith(route)) {
      return allowedRoles.includes(userRole);
    }
  }

  // Default: allow access to routes not in ROUTE_ACCESS
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");
  const method = request.method;

  // Log all requests in development
  if (process.env.NODE_ENV !== "production") {
    console.log("🌐 Middleware:", { method, pathname, origin });
  }

  // Handle CORS preflight requests first
  const corsResponse = handleCors(request);
  if (corsResponse) {
    console.log("✅ CORS preflight handled for:", pathname);
    return corsResponse;
  }

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    const response = NextResponse.next();
    return addCorsHeaders(response, request.headers.get("origin"));
  }

  // ✅ PERMITIR RUTAS PÚBLICAS SIN VERIFICACIÓN
  if (isPublicRoute(pathname)) {
    const response = NextResponse.next();
    return addCorsHeaders(response, request.headers.get("origin"));
  }

  // ✅ SOLO VERIFICAR TOKEN PARA RUTAS PROTEGIDAS
  if (isProtectedRoute(pathname)) {
    // Si es ruta protegida, verificar autenticación

    // Get token from cookies or Authorization header
    const cookieToken = request.cookies.get("token")?.value;
    console.log("Cookie token:", cookieToken);
    const authHeader = request.headers.get("Authorization");
    console.log("Authorization header:", authHeader);
    const headerToken = authHeader?.replace("Bearer ", "");
    console.log("Header token:", headerToken);
    const token = cookieToken || headerToken;
    console.log("Token used:", token);
    // const token = headerToken;

    // Debug logging
    if (process.env.NODE_ENV !== "production") {
      console.log("🔐 Auth Debug:", {
        pathname,
        hasCookie: !!cookieToken,
        hasAuthHeader: !!authHeader,
        authHeader: authHeader?.substring(0, 20) + "...",
        tokenFound: !!token,
        tokenPreview: token?.substring(0, 20) + "...",
      });
    }

    // If no token, return 401 for protected routes
    if (!token) {
      console.log("❌ No token found - returning 401");
      const response = NextResponse.json(
        {
          success: false,
          message: "Authentication required",
          error: "NO_TOKEN",
          debug: {
            cookieChecked: "token",
            headerChecked: "Authorization",
            hint: "Include token in Authorization header as 'Bearer YOUR_TOKEN' or in token cookie",
          },
        },
        { status: 401 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      console.log("❌ Token verification failed");
      const response = NextResponse.json(
        {
          success: false,
          message: "Invalid or expired token",
          error: "INVALID_TOKEN",
        },
        { status: 401 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    console.log("✅ Token verified successfully:", {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    // Check if user has access to the requested route
    if (!hasAccess(pathname, payload.role)) {
      const response = NextResponse.json(
        {
          success: false,
          message: "Insufficient permissions",
          error: "FORBIDDEN",
        },
        { status: 403 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    // Add user info to request headers for use in API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId);
    requestHeaders.set("x-user-email", payload.email);
    requestHeaders.set("x-user-role", payload.role);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return addCorsHeaders(response, request.headers.get("origin"));
  }

  // Si no es pública ni protegida, permitir acceso sin restricciones
  const response = NextResponse.next();
  return addCorsHeaders(response, request.headers.get("origin"));
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
