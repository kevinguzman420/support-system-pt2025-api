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

    const requests = await prisma.request.findMany({
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
