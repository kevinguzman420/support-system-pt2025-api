// app/api/private/admin/users/[userId]/route.ts
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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
          message: "Access denied. Only administrators can update users.",
          error: "FORBIDDEN",
        },
        { status: 403 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    const { userId } = await params;

    // Verificar que el usuario exista
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      const response = NextResponse.json(
        {
          success: false,
          message: "User not found",
          error: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    const { email, password, name, role, active } = await request.json();

    // Validar email si se está actualizando
    if (email) {
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        const response = NextResponse.json(
          {
            success: false,
            message: "Invalid email format",
            error: "INVALID_EMAIL",
          },
          { status: 400 }
        );
        return addCorsHeaders(response, request.headers.get("origin"));
      }

      // Verificar si el nuevo email ya está en uso por otro usuario
      const emailInUse = await prisma.user.findFirst({
        where: {
          email,
          NOT: {
            id: userId,
          },
        },
      });

      if (emailInUse) {
        const response = NextResponse.json(
          {
            success: false,
            message: "Email is already in use by another user",
            error: "EMAIL_ALREADY_EXISTS",
          },
          { status: 409 }
        );
        return addCorsHeaders(response, request.headers.get("origin"));
      }
    }

    // Validar contraseña si se está actualizando
    if (password && password.length < 6) {
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

    // Validar rol si se está actualizando
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

    // Construir el objeto de actualización dinámicamente
    const updateData: any = {};

    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (typeof active === "boolean") updateData.active = active;

    // Hashear la nueva contraseña si se proporciona
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Actualizar el usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        // No incluir password en la respuesta
      },
    });

    const response = NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });

    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("❌ Error updating user:", error);

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
