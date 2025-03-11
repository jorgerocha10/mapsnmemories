import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();

  // Check authentication
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "createdAt";
  const order = searchParams.get("order") || "desc";

  const skip = (page - 1) * limit;

  try {
    // Build the where clause
    let where: any = {
      role: "USER", // Only list non-admin users
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build the orderBy clause
    let orderBy: any = {};

    // Validate sort field is allowed
    const allowedSortFields = ["name", "email", "createdAt"];
    const validSort = allowedSortFields.includes(sort) ? sort : "createdAt";

    // Validate order direction
    const validOrder = order === "asc" ? "asc" : "desc";

    orderBy[validSort] = validOrder;

    // Count total customers with filter
    const totalCustomers = await prisma.user.count({ where });

    // Get customers with pagination
    const customers = await prisma.user.findMany({
      where,
      include: {
        profile: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    return NextResponse.json({
      customers,
      pagination: {
        total: totalCustomers,
        page,
        limit,
        totalPages: Math.ceil(totalCustomers / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
} 