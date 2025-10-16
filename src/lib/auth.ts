// src/lib/auth.ts
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthUser {
  userId: string;
  email: string;
  role: 'ADMIN' | 'SUPPORT' | 'CLIENT';
}

interface JWTPayload extends AuthUser {
  iat?: number;
  exp?: number;
}

/**
 * Extraer y verificar el token JWT de la request
 * Busca en: Authorization header y cookie "token"
 */
export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    // 1. Intentar obtener token del Authorization header
    const authHeader = request.headers.get('Authorization');
    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remover "Bearer "
    }

    // 2. Si no hay token en header, buscar en cookie
    if (!token) {
      const cookieStore = await cookies();
      const cookieToken = cookieStore.get('token');
      if (cookieToken) {
        token = cookieToken.value;
        console.log('🍪 Token found in cookie');
      }
    }

    // 3. Si no hay token, retornar null
    if (!token) {
      return null;
    }

    console.log('🔍 Token preview:', token.substring(0, 30) + '...');

    // 4. Verificar el token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

  } catch (error) {
    console.error('❌ Token verification failed:', error);
    return null;
  }
}

/**
 * Verificar si el usuario tiene uno de los roles permitidos
 */
export function hasRole(user: AuthUser, allowedRoles: string[]): boolean {
  return allowedRoles.includes(user.role);
}
