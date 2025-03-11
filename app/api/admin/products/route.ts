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
    let validatedData;
    try {
      validatedData = productCreateSchema.parse(body);
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation error", details: zodError.errors },
          { status: 400 }
        );
      }
      throw zodError;
    }

    // Check if SKU already exists
    if (validatedData.sku && validatedData.sku !== "") {
      const existingProductWithSku = await prisma.product.findUnique({
        where: { sku: validatedData.sku },
      });

      if (existingProductWithSku) {
        return NextResponse.json(
          { 
            error: "Validation error", 
            details: [{ 
              path: ["sku"], 
              message: "This SKU is already in use by another product" 
            }] 
          },
          { status: 400 }
        );
      }
    }

    // Check if barcode already exists
    if (validatedData.barcode && validatedData.barcode !== "") {
      const existingProductWithBarcode = await prisma.product.findUnique({
        where: { barcode: validatedData.barcode },
      });

      if (existingProductWithBarcode) {
        return NextResponse.json(
          { 
            error: "Validation error", 
            details: [{ 
              path: ["barcode"], 
              message: "This barcode is already in use by another product" 
            }] 
          },
          { status: 400 }
        );
      }
    }

    // Create product with images in a transaction
    const product = await prisma.$transaction(async (tx) => {
      // Create the product with price as Decimal
      const newProduct = await tx.product.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          price: new Prisma.Decimal(validatedData.price),
          compareAtPrice: validatedData.compareAtPrice != null 
            ? new Prisma.Decimal(validatedData.compareAtPrice)
            : null,
          // Transform empty strings to null for unique fields
          sku: validatedData.sku === "" ? null : validatedData.sku,
          barcode: validatedData.barcode === "" ? null : validatedData.barcode,
          inventory: validatedData.inventory,
          isVisible: validatedData.isVisible,
          weight: validatedData.weight != null
            ? new Prisma.Decimal(validatedData.weight)
            : null,
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

    // Serialize the product for the response
    const serializedProduct = {
      ...product,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice != null ? Number(product.compareAtPrice) : null,
      weight: product.weight != null ? Number(product.weight) : null,
    };

    return NextResponse.json({
      message: "Product created successfully",
      product: serializedProduct,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
} 