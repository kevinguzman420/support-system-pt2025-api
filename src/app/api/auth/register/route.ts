import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { addCorsHeaders, createCorsResponse } from "@/lib/cors";

const saltRounds = 10;
const myPlaintextPassword = "s0//P4$$w0rD";
const someOtherPlaintextPassword = "not_bacon";

// JWT Secret - In production, use environment variable
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export async function POST(request: NextRequest) {
  try {
    const { email, password, role, name } = await request.json();

    // Validate input
    if (!email || !password || !name) {
      return createCorsResponse(
        { message: "Email, password, and name are required" },
        { status: 400 },
        request
      );
    }

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return createCorsResponse(
        { message: "User already exists" },
        { status: 409 },
        request
      );
    }

    const hash = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hash, // In production, hash the password before storing
        role: role || "CLIENT", // Default role
        name: name, // Default name, in production get from request
      },
    });

    return createCorsResponse(
      {
        message: "User registered successfully",
        user: { id: newUser.id, email: newUser.email, role: newUser.role },
      },
      { status: 201 },
      request
    );
  } catch (error) {
    console.error("Registration error:", error);
    return createCorsResponse(
      { message: "Internal server error" },
      { status: 500 },
      request
    );
  }
}

export async function GET(request: NextRequest) {
  return createCorsResponse(
    { message: "Authentication endpoint - use POST to register" },
    { status: 200 },
    request
  );
}
