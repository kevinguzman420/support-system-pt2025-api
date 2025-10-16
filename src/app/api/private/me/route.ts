import { verifyAuth } from "@/lib/auth";
import { addCorsHeaders } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

// ✅ AGREGAR HANDLER OPTIONS PARA PREFLIGHT
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación usando el helper
    const user = await verifyAuth(request);
    
    if (!user) {
      const response = NextResponse.json(
        { 
          success: false,
          message: "Authentication required. Please provide a valid token.",
          error: "AUTHENTICATION_REQUIRED"
        },
        { status: 401 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    // Obtener datos completos del usuario desde la base de datos
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    });

    if (!userData) {
      const response = NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    const response = NextResponse.json({
      success: true,
      data: userData
    });
    return addCorsHeaders(response, request.headers.get("origin"));
    
  } catch (error) {
    console.error("Error getting user info:", error);
    const response = NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
    return addCorsHeaders(response, request.headers.get("origin"));
  }
}

// Helper function to get user name based on role (demo purposes)
function getUserNameByRole(role: string): string {
  switch (role) {
    case "ADMIN":
      return "System Administrator";
    case "SUPPORT":
      return "Support Staff";
    case "CLIENT":
      return "John Client";
    default:
      return "User";
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    
    const { newPassword } = body;

    if (!newPassword) {
      console.log('❌ Validation failed: newPassword is required');
      const response = NextResponse.json(
        { 
          success: false,
          message: "New password is required",
          received: body
        },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    if (newPassword.length < 6) {
      const response = NextResponse.json(
        { 
          success: false,
          message: "New password must be at least 6 characters long",
          receivedLength: newPassword.length
        },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    await prisma.user.update({
      where: { email: user.email },
      data: { password: await bcrypt.hash(newPassword, 10) },
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Contraseña actualizada correctamente",
      },
      { status: 201 }
    );

    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error updating password:", error);
    const response = NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
    return addCorsHeaders(response, request.headers.get("origin"));
  }
}
