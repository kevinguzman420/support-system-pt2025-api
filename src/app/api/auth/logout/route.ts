import { NextRequest, NextResponse } from 'next/server';
import { createCorsResponse, handleCors } from '@/lib/cors';

/**
 * POST /api/auth/logout
 * Logout endpoint - removes the auth cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Create a success response with CORS
    const response = createCorsResponse(
      { 
        message: 'Logout successful',
        success: true 
      },
      { status: 200 },
      request
    );

    // Delete the auth cookie by setting it with maxAge 0
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // This deletes the cookie
      path: '/' // Make sure to match the path used when setting the cookie
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return createCorsResponse(
      { 
        message: 'Error during logout',
        success: false 
      },
      { status: 500 },
      request
    );
  }
}

/**
 * OPTIONS /api/auth/logout
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCors(request);
  return corsResponse || new NextResponse(null, { status: 200 });
}

/**
 * GET /api/auth/logout
 * Returns information about the logout endpoint
 */
export async function GET(request: NextRequest) {
  return createCorsResponse(
    { 
      message: 'Logout endpoint - use POST to logout',
      method: 'POST' 
    },
    { status: 200 },
    request
  );
}
