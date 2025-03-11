import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Validation schema for product creation
const productCreateSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  price: z.number().min(0.01, { message: "Price must be greater than 0." }),
  compareAtPrice: z.number().min(0).nullable().optional(),
  sku: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  inventory: z.number().min(0, { message: "Inventory must be a positive number." }),
  isVisible: z.boolean().default(true),
  weight: z.number().min(0).nullable().optional(),
  dimensions: z.string().nullable().optional(),
  categoryId: z.string({ required_error: "Please select a category." }),
  images: z.array(
    z.object({
      url: z.string().url({ message: "Invalid image URL" }),
      position: z.number().min(0),
    })
  ).optional(),
});

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
  const categoryId = searchParams.get("category");
  const search = searchParams.get("search");
  
  const skip = (page - 1) * limit;

  try {
    // Build the where clause
    let where: any = {};
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Count total products with filter
    const totalProducts = await prisma.product.count({ where });
    
    // Get products with pagination
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        images: {
          orderBy: {
            position: 'asc',
          },
          take: 1, // Only fetch the first image for listing
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Serialize each product to handle Decimal values
    const serializedProducts = products.map(product => ({
      ...product,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      weight: product.weight ? Number(product.weight) : null,
    }));

    return NextResponse.json({
      products: serializedProducts,
      pagination: {
        total: totalProducts,
        page,
        limit,
        totalPages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user has ADMIN role
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = productCreateSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedData.error.errors },
        { status: 400 }
      );
    }

    const data = validatedData.data;

    // Convert price from dollars to cents for storage
    const priceInCents = Math.round(data.price * 100);
    const compareAtPriceInCents = data.compareAtPrice 
      ? Math.round(data.compareAtPrice * 100) 
      : null;

    // Create the product
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: priceInCents,
        compareAtPrice: compareAtPriceInCents,
        sku: data.sku,
        barcode: data.barcode,
        inventory: data.inventory,
        isVisible: data.isVisible,
        weight: data.weight,
        dimensions: data.dimensions,
        categoryId: data.categoryId,
        // Create images if provided
        ...(data.images && data.images.length > 0
          ? {
              images: {
                create: data.images.map((image) => ({
                  url: image.url,
                  position: image.position,
                })),
              },
            }
          : {}),
      },
      include: {
        images: true,
        category: true,
      },
    });

    // Convert price back to dollars for the response
    const productWithDollarPrices = {
      ...product,
      price: Number(product.price) / 100,
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) / 100 : null,
    };

    return NextResponse.json(
      { 
        message: "Product created successfully", 
        product: productWithDollarPrices
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
} 