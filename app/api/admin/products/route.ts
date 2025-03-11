import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for product creation
const productCreateSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  price: z.number().min(0.01, { message: "Price must be greater than 0." }),
  compareAtPrice: z.number().min(0).nullable().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  inventory: z.number().min(0, { message: "Inventory must be a positive number." }),
  isVisible: z.boolean().default(true),
  weight: z.number().min(0).optional(),
  dimensions: z.string().optional(),
  categoryId: z.string({ required_error: "Please select a category." }),
  images: z.array(
    z.object({
      url: z.string().url(),
      position: z.number().min(0),
    })
  ).optional().default([]),
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

    return NextResponse.json({
      products,
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

export async function POST(request: NextRequest) {
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

  try {
    // Validate request body
    const body = await request.json();
    const validatedData = productCreateSchema.parse(body);

    // Create product with images in a transaction
    const product = await prisma.$transaction(async (tx) => {
      // Create the product
      const newProduct = await tx.product.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          price: validatedData.price,
          compareAtPrice: validatedData.compareAtPrice,
          sku: validatedData.sku,
          barcode: validatedData.barcode,
          inventory: validatedData.inventory,
          isVisible: validatedData.isVisible,
          weight: validatedData.weight,
          dimensions: validatedData.dimensions,
          categoryId: validatedData.categoryId,
        },
      });

      // Create images if provided
      if (validatedData.images && validatedData.images.length > 0) {
        await tx.productImage.createMany({
          data: validatedData.images.map(image => ({
            url: image.url,
            position: image.position,
            productId: newProduct.id,
          })),
        });
      }

      return newProduct;
    });

    return NextResponse.json({
      message: "Product created successfully",
      product,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
} 