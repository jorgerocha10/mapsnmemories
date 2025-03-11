import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Validation schema for product updates
const productUpdateSchema = z.object({
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
  categoryId: z.string(),
});

// GET endpoint to fetch a single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Await the params to get the id properly in Next.js 14+
    const resolvedParams = await params;
    const productId = resolvedParams.id;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        images: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Serialize product to handle Decimal fields
    const serializedProduct = {
      ...product,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      weight: product.weight ? Number(product.weight) : null,
    };

    return NextResponse.json(serializedProduct);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update a product
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Await the params to get the id properly in Next.js 14+
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    
    const body = await request.json();
    
    // Create a sanitized data object without images field
    const { images, ...productData } = body;
    
    // First validate the data before converting to Decimal
    let validatedData;
    try {
      validatedData = productUpdateSchema.parse(productData);
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation error", details: zodError.errors },
          { status: 400 }
        );
      }
      throw zodError;
    }
    
    // Process validation data to ensure we properly handle optional fields and types
    const decimalData = {
      ...validatedData,
      price: new Prisma.Decimal(validatedData.price),
      compareAtPrice: validatedData.compareAtPrice !== null && validatedData.compareAtPrice !== undefined
        ? new Prisma.Decimal(validatedData.compareAtPrice)
        : null,
      weight: validatedData.weight !== null && validatedData.weight !== undefined
        ? new Prisma.Decimal(validatedData.weight)
        : null,
      // Transform empty strings to null for unique fields to avoid unique constraint violations
      sku: validatedData.sku === "" ? null : validatedData.sku,
      barcode: validatedData.barcode === "" ? null : validatedData.barcode
    };

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if SKU already exists on a different product
    if (decimalData.sku && decimalData.sku !== product.sku) {
      const existingProductWithSku = await prisma.product.findUnique({
        where: { sku: decimalData.sku },
      });

      if (existingProductWithSku && existingProductWithSku.id !== productId) {
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

    // Check if barcode already exists on a different product
    if (decimalData.barcode && decimalData.barcode !== product.barcode) {
      const existingProductWithBarcode = await prisma.product.findUnique({
        where: { barcode: decimalData.barcode },
      });

      if (existingProductWithBarcode && existingProductWithBarcode.id !== productId) {
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

    // Update product information
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Update basic product info
      const productUpdate = await tx.product.update({
        where: { id: productId },
        data: decimalData,
      });

      // Handle image updates if provided
      if (images) {
        // Get existing image IDs
        const existingImageIds = product.images.map(img => img.id);
        
        // Identify images to delete (ones that exist in DB but not in the request)
        const imageIdsInRequest = images.map((img: { id: string }) => img.id);
        const imageIdsToDelete = existingImageIds.filter(
          id => !id.startsWith('temp-') && !imageIdsInRequest.includes(id)
        );
        
        // Delete removed images
        if (imageIdsToDelete.length > 0) {
          await tx.productImage.deleteMany({
            where: {
              id: { in: imageIdsToDelete },
              productId: productId,
            },
          });
        }
        
        // Update or create images
        for (const image of images as { id: string; url: string; position: number }[]) {
          if (image.id && !image.id.startsWith('temp-')) {
            // Update existing image position
            await tx.productImage.update({
              where: { 
                id: image.id,
                productId: productId,
              },
              data: { position: image.position },
            });
          } else {
            // Create new image
            await tx.productImage.create({
              data: {
                url: image.url,
                position: image.position,
                productId: productId,
              },
            });
          }
        }
      }

      return productUpdate;
    });

    // Serialize the updated product to handle Decimal fields
    const serializedProduct = {
      ...updatedProduct,
      price: Number(updatedProduct.price),
      compareAtPrice: updatedProduct.compareAtPrice ? Number(updatedProduct.compareAtPrice) : null,
      weight: updatedProduct.weight ? Number(updatedProduct.weight) : null,
    };

    return NextResponse.json(serializedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Await the params to get the id properly in Next.js 14+
    const resolvedParams = await params;
    const productId = resolvedParams.id;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Delete the product (cascading delete will handle images)
    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
} 