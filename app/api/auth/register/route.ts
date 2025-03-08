import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/user-actions";
import { z } from "zod";

// Explicitly use Node.js runtime, not Edge
export const runtime = "nodejs";

// Define validation schema
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate the request body
    const result = registerSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { email, password, name } = result.data;
    
    // Register the user
    const user = await registerUser({ email, password, name });
    
    return NextResponse.json(
      { message: "User registered successfully", user },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration error:", error);
    
    // Type guard for errors with message property
    if (error instanceof Error) {
      // Check if it's a known error (like user already exists)
      if (error.message === "User with this email already exists") {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: "Something went wrong", details: error.message },
        { status: 500 }
      );
    }
    
    // Fallback for non-Error objects
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 