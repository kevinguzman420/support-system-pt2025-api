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
