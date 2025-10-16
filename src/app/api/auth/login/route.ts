import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createCorsResponse, handleCors } from "@/lib/cors";

// JWT Secret - In production, use environment variable
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return createCorsResponse(
        { message: "Email and password are required" },
        { status: 400 },
        request
      );
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
      include: { requests: true }, // ⬅️ Incluir solicitudes del usuario
    });

    if (!user) {
      return createCorsResponse(
        { message: "Invalid credentials" },
        { status: 401 },
        request
      );
    }

    // Verify password with bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return createCorsResponse(
        { message: "Invalid credentials" },
        { status: 401 },
        request
      );
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // ✅ ESTRATEGIA DUAL: Cookie (httpOnly) + Token en respuesta (para localStorage)
    const response = createCorsResponse(
      {
        message: "Login successful",
        token, // ⬅️ Frontend lo guarda en localStorage
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          requestsCount: user.requests.length,
        },
      },
      {},
      request
    );

    // ✅ CONFIGURACIÓN CORREGIDA DE COOKIE (backup de seguridad)
    const isProduction = process.env.NODE_ENV === "production";

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: isProduction, // true solo en producción
      sameSite: isProduction ? "strict" : "lax", // ⬅️ 'lax' en desarrollo
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/", // ⬅️ Importante: disponible en todas las rutas
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return createCorsResponse(
      { message: "Internal server error" },
      { status: 500 },
      request
    );
  }
}

/**
 * OPTIONS /api/auth/login
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  console.log("🔍 OPTIONS preflight received at /api/auth/login");
  const corsResponse = handleCors(request);
  return corsResponse || new NextResponse(null, { status: 200 });
}

/**
 * GET /api/auth/login
 * Returns information about the login endpoint
 */
export async function GET(request: NextRequest) {
  return createCorsResponse(
    {
      message: "Login endpoint - use POST to login",
      method: "POST",
    },
    { status: 200 },
    request
  );
}
