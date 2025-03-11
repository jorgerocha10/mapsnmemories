import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for product updates
const productUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  price: z.number().min(0).optional(),
  compareAtPrice: z.number().min(0).nullable().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  inventory: z.number().min(0).optional(),
  isVisible: z.boolean().optional(),
  weight: z.number().min(0).optional(),
  dimensions: z.string().optional(),
  categoryId: z.string().optional(),
  images: z.array(
    z.object({
      id: z.string(),
      url: z.string().url(),
      position: z.number().min(0),
    })
  ).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const productId = params.id;

  try {
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

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const productId = params.id;

  try {
    // Validate request body
    const body = await request.json();
    const validatedData = productUpdateSchema.parse(body);

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

    // Update product information
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Update basic product info
      const productUpdate = await tx.product.update({
        where: { id: productId },
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

      // Handle image updates if provided
      if (validatedData.images) {
        // Get existing image IDs
        const existingImageIds = product.images.map(img => img.id);
        
        // Identify images to delete (ones that exist in DB but not in the request)
        const imageIdsInRequest = validatedData.images.map(img => img.id);
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
        
        // Process each image in the request
        for (const image of validatedData.images) {
          if (image.id.startsWith('temp-')) {
            // Create new image
            await tx.productImage.create({
              data: {
                url: image.url,
                position: image.position,
                productId: productId,
              },
            });
          } else {
            // Update existing image
            await tx.productImage.update({
              where: { id: image.id },
              data: {
                url: image.url,
                position: image.position,
              },
            });
          }
        }
      }

      return productUpdate;
    });

    return NextResponse.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const productId = params.id;

  try {
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

    // Delete product
    await prisma.$transaction(async (tx) => {
      // Delete associated images first
      await tx.productImage.deleteMany({
        where: { productId },
      });
      
      // Delete the product
      await tx.product.delete({
        where: { id: productId },
      });
    });

    return NextResponse.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
} 