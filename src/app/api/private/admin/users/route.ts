// app/api/private/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addCorsHeaders } from "@/lib/cors";
import { verifyAuth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// ✅ AGREGAR HANDLER OPTIONS PARA PREFLIGHT
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      const response = NextResponse.json(
        {
          success: false,
          message: "Authentication required. Please provide a valid token.",
          error: "AUTHENTICATION_REQUIRED",
          hint: 'Include your token in Authorization header (Bearer token) or in cookie named "token"',
        },
        { status: 401 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    const response = NextResponse.json({
      success: true,
      users,
    });

    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("❌ Error fetching users:", error);

    const response = NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );

    return addCorsHeaders(response, request.headers.get("origin"));
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación usando el helper
    const user = await verifyAuth(request);

    if (!user) {
      const response = NextResponse.json(
        {
          success: false,
          message: "Authentication required. Please provide a valid token.",
          error: "AUTHENTICATION_REQUIRED",
          hint: 'Include your token in Authorization header (Bearer token) or in cookie named "token"',
        },
        { status: 401 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    // Verificar que el usuario sea ADMIN
    if (user.role !== "ADMIN") {
      const response = NextResponse.json(
        {
          success: false,
          message: "Access denied. Only administrators can create users.",
          error: "FORBIDDEN",
        },
        { status: 403 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    const { email, password, name, role } = await request.json();

    // Validar campos requeridos
    if (!email || !password || !name) {
      const response = NextResponse.json(
        {
          success: false,
          message: "Email, password y name son campos obligatorios",
          error: "MISSING_REQUIRED_FIELDS",
          details: {
            email: !email ? "Email is required" : null,
            password: !password ? "Password is required" : null,
            name: !name ? "Name is required" : null,
          },
        },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      const response = NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters long",
          error: "INVALID_PASSWORD",
        },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    // Validar rol (si se proporciona)
    const validRoles = ["ADMIN", "SUPPORT", "CLIENT"];
    if (role && !validRoles.includes(role)) {
      const response = NextResponse.json(
        {
          success: false,
          message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
          error: "INVALID_ROLE",
        },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const response = NextResponse.json(
        {
          success: false,
          message: "A user with this email already exists",
          error: "EMAIL_ALREADY_EXISTS", // No se permiten duplicados
        },
        { status: 409 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    // Hashear la contraseña
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el nuevo usuario
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || "CLIENT", // Default role is CLIENT
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // No incluir password en la respuesta
      },
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        data: newUser,
      },
      { status: 201 }
    );

    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("❌ Error creating user:", error);

    const response = NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );

    return addCorsHeaders(response, request.headers.get("origin"));
  }
}
