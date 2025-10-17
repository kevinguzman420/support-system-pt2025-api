// app/api/private/responses/route.ts
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
    const { requestId, content, isAutomatic } = await request.json();

    // Validar campos requeridos
    if (!requestId || !content) {
      const response = NextResponse.json(
        {
          success: false,
          message: "El requestId y el contenido son campos obligatorios",
          error: "MISSING_REQUIRED_FIELDS",
          details: {
            requestId: !requestId ? "Request ID is required" : null,
            content: !content ? "Content is required" : null,
          },
        },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    // Verificar que la solicitud existe
    const request_exists = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request_exists) {
      const response = NextResponse.json(
        {
          success: false,
          message: "Request not found",
          error: "REQUEST_NOT_FOUND",
        },
        { status: 404 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    // Verificar permisos: CLIENT solo puede responder a sus propias solicitudes
    // ADMIN y SUPPORT pueden responder a cualquier solicitud
    if (user.role === "CLIENT" && request_exists.userId !== userId) {
      const response = NextResponse.json(
        {
          success: false,
          message: "Access denied. You can only respond to your own requests.",
          error: "FORBIDDEN",
        },
        { status: 403 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    // Crear la respuesta
    const newResponse = await prisma.response.create({
      data: {
        requestId,
        userId,
        content,
        isAutomatic: isAutomatic || false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        request: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Response created successfully",
        data: newResponse,
      },
      { status: 201 }
    );

    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("❌ Error creating response:", error);

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

    // Obtener el requestId de los query parameters (opcional)
    const { searchParams } = new URL(request.url);
    const requestIdFilter = searchParams.get("requestId");

    // Construir el filtro dinámicamente
    const whereClause: any = {};

    // Si se especifica un requestId, filtrar por ese request
    if (requestIdFilter) {
      whereClause.requestId = requestIdFilter;
    }

    // Si es CLIENT, solo ver respuestas de sus propias solicitudes
    if (userRole === "CLIENT") {
      whereClause.request = {
        userId,
      };
    }
    // ADMIN y SUPPORT ven todas las respuestas (o filtradas por requestId si se especifica)

    const responses = await prisma.response.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        request: {
          select: {
            id: true,
            title: true,
            status: true,
            userId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const response = NextResponse.json({
      success: true,
      responses,
    });

    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("❌ Error fetching responses:", error);

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
