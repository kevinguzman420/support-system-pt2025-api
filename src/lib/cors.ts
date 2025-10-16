import { NextRequest, NextResponse } from "next/server";

// CORS configuration
// ⚠️ PRODUCTION SETUP: Configure these origins for your production environment
// Add your actual production domains to prevent CORS errors
const corsOptions = {
  origin: [
    "http://localhost:3000", // Next.js default
    "http://localhost:3001", // React app default
    "http://localhost:5173", // Vite default
    "http://localhost:4200", // Angular default
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
    // PRODUCTION DOMAINS - Replace with your actual domains
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    // TODO: Modificar esto cuando sepa los dominios de producción:
    ...(process.env.NODE_ENV === "production"
      ? [
          // 'https://yourdomain.com',
          // 'https://www.yourdomain.com',
          // 'https://app.yourdomain.com',
          // 'https://admin.yourdomain.com'
        ]
      : []),
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200,
};

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | null): boolean {
  // If no origin header (same-origin request or server-to-server), allow
  if (!origin) {
    return true;
  }

  // In development, allow localhost origins
  if (process.env.NODE_ENV !== "production") {
    // Allow any localhost or 127.0.0.1 port in development
    if (
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:") ||
      origin.startsWith("https://localhost:") ||
      origin.startsWith("https://127.0.0.1:")
    ) {
      return true;
    }

    // Also check configured origins
    return corsOptions.origin.includes(origin);
  }

  // In production, be more strict - only allow configured origins
  return corsOptions.origin.includes(origin);
}

/**
 * Add CORS headers to a response
 */
export function addCorsHeaders(
  response: NextResponse,
  origin?: string | null
): NextResponse {
  // Determine which origin to use
  let allowedOrigin = origin || corsOptions.origin[0];

  // Check if origin is allowed
  if (origin && isOriginAllowed(origin)) {
    allowedOrigin = origin;
  } else if (process.env.NODE_ENV !== "production") {
    // In development, if origin is not explicitly allowed but is localhost, allow it
    if (
      origin &&
      (origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:"))
    ) {
      allowedOrigin = origin;
    }
  }

  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  response.headers.set(
    "Access-Control-Allow-Methods",
    corsOptions.methods.join(", ")
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    corsOptions.allowedHeaders.join(", ")
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours
  response.headers.set("Vary", "Origin"); // Important for caching

  return response;
}

/**
 * Handle CORS preflight requests
 */
export function handleCors(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");

  // Log CORS request in development
  if (process.env.NODE_ENV !== "production") {
    console.log("🔍 CORS Request:", {
      method: request.method,
      origin,
      path: request.nextUrl.pathname,
      isAllowed: origin ? isOriginAllowed(origin) : "no-origin",
    });
  }

  // Handle preflight OPTIONS request
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 200 });
    return addCorsHeaders(response, origin);
  }

  return null;
}

/**
 * Create a CORS-enabled response
 */
export function createCorsResponse(
  data: any,
  options: ResponseInit = {},
  request?: NextRequest
): NextResponse {
  const response = NextResponse.json(data, options);
  const origin = request?.headers.get("origin");
  return addCorsHeaders(response, origin);
}
