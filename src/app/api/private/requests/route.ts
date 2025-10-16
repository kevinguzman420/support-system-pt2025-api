// app/api/private/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addCorsHeaders } from "@/lib/cors";
import { verifyAuth } from "@/lib/auth";

// ✅ AGREGAR HANDLER OPTIONS PARA PREFLIGHT
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, request.headers.get("origin"));
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

    const userId = user.userId;
    const { title, description, priority, category } = await request.json();

    if (!title || !description) {
      const response = NextResponse.json(
        {
          success: false,
          message: "El título y la descripción son campos obligatorios",
          error: "MISSING_REQUIRED_FIELDS",
          details: {
            title: !title ? "Title is required" : null,
            description: !description ? "Description is required" : null,
          },
        },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    const newRequest = await prisma.request.create({
      data: {
        userId,
        title,
        description,
        priority: priority || "media",
        category: category || "otro",
        status: "PENDING",
      },
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Request created successfully",
        data: newRequest,
      },
      { status: 201 }
    );

    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("❌ Error creating request:", error);

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

    console.log("✅ User authenticated:", user.email);
    const userId = user.userId;
    const userRole = user.role;

    const requests = await prisma.request.findMany({
      where: userRole === "CLIENT" ? { userId } : {},
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const response = NextResponse.json({
      success: true,
      requests,
    });

    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("❌ Error fetching requests:", error);

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
