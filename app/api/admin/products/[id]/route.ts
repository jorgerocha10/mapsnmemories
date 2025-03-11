import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Define the schema for product updates
const productUpdateSchema = z.object({
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
      id: z.string().optional(),
      url: z.string().url({ message: "Invalid image URL" }),
      position: z.number().min(0),
    })
  ).optional(),
});

// GET endpoint to fetch a single product
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check authentication and admin role
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the product with related data
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { position: 'asc' },
        },
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Convert price back to dollars for the response
    const productWithDollarPrices = {
      ...product,
      price: Number(product.price) / 100,
      compareAtPrice: product.compareAtPrice 
        ? Number(product.compareAtPrice) / 100 
        : null,
    };

    return NextResponse.json({ product: productWithDollarPrices });
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
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check authentication and admin role
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user has ADMIN role
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = productUpdateSchema.safeParse(body);

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

    // Update the product with a transaction to handle images properly
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // First, update the product details
      const product = await tx.product.update({
        where: { id },
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
        },
        include: {
          images: true,
          category: true,
        },
      });

      // Handle images if provided
      if (data.images && data.images.length > 0) {
        // Get existing image IDs
        const existingImageIds = existingProduct.images.map(img => img.id);
        
        // Get new image IDs from the request
        const newImageIds = data.images
          .filter(img => img.id)
          .map(img => img.id as string);
        
        // Find images to delete (existing but not in new list)
        const imagesToDelete = existingImageIds.filter(id => !newImageIds.includes(id));
        
        // Delete removed images
        if (imagesToDelete.length > 0) {
          await tx.productImage.deleteMany({
            where: {
              id: { in: imagesToDelete },
              productId: id,
            },
          });
        }
        
        // Update or create images
        for (const image of data.images) {
          if (image.id) {
            // Update existing image
            await tx.productImage.update({
              where: { id: image.id },
              data: {
                url: image.url,
                position: image.position,
              },
            });
          } else {
            // Create new image
            await tx.productImage.create({
              data: {
                url: image.url,
                position: image.position,
                productId: id,
              },
            });
          }
        }
      }

      // Get the updated product with fresh images
      return await tx.product.findUnique({
        where: { id },
        include: {
          images: {
            orderBy: { position: 'asc' },
          },
          category: true,
        },
      });
    });

    if (!updatedProduct) {
      throw new Error("Failed to retrieve updated product");
    }

    // Convert price back to dollars for the response
    const productWithDollarPrices = {
      ...updatedProduct,
      price: Number(updatedProduct.price) / 100,
      compareAtPrice: updatedProduct.compareAtPrice 
        ? Number(updatedProduct.compareAtPrice) / 100 
        : null,
    };

    return NextResponse.json({
      message: "Product updated successfully",
      product: productWithDollarPrices,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a product
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check authentication and admin role
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user has ADMIN role
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Delete the product (cascade will handle related records)
    await prisma.product.delete({
      where: { id },
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