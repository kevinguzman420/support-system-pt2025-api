import { verifyAuth } from "@/lib/auth";
import { addCorsHeaders } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// ✅ AGREGAR HANDLER OPTIONS PARA PREFLIGHT
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, request.headers.get("origin"));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;

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

    const _request = await prisma.request.findFirst({
      where: { id: requestId },
      include: {
        responses: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const response = NextResponse.json({
      success: true,
      request: _request,
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
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

    // Verificar que el usuario sea ADMIN o SUPPORT
    if (user.role !== "ADMIN" && user.role !== "SUPPORT") {
      const response = NextResponse.json(
        {
          success: false,
          message: "Access denied. Only ADMIN and SUPPORT can update request status.",
          error: "FORBIDDEN",
        },
        { status: 403 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    const { requestId } = await params;

    // Verificar que la solicitud exista
    const existingRequest = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!existingRequest) {
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

    const { status } = await request.json();

    // Validar que se proporcione el status
    if (!status) {
      const response = NextResponse.json(
        {
          success: false,
          message: "Status is required",
          error: "MISSING_STATUS",
        },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    // Validar que el status sea válido
    const validStatuses = ["PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    if (!validStatuses.includes(status)) {
      const response = NextResponse.json(
        {
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          error: "INVALID_STATUS",
        },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    // Actualizar el estado de la solicitud
    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    const response = NextResponse.json({
      success: true,
      message: "Request status updated successfully",
      request: updatedRequest,
    });

    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("❌ Error updating request status:", error);

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
