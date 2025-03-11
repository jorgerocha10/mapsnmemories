import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for customer updates
const customerUpdateSchema = z.object({
  name: z.string().min(2).nullable().optional(),
  email: z.string().email().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  profile: z.object({
    phone: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
  }).optional(),
  address: z.object({
    street: z.string().min(3).optional(),
    city: z.string().min(2).optional(),
    state: z.string().min(2).optional(),
    postalCode: z.string().min(3).optional(),
    country: z.string().min(2).optional(),
    isDefault: z.boolean().default(true).optional(),
  }).optional(),
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

  const customerId = params.id;

  try {
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      include: {
        profile: true,
        addresses: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        paymentMethods: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
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

  const customerId = params.id;

  try {
    // Validate request body
    const body = await request.json();
    const validatedData = customerUpdateSchema.parse(body);

    // Check if customer exists
    const existingCustomer = await prisma.user.findUnique({
      where: { id: customerId },
      include: {
        profile: true,
        addresses: true,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Update customer information using a transaction
    const updatedCustomer = await prisma.$transaction(async (tx) => {
      // Update basic user info
      const userUpdate = await tx.user.update({
        where: { id: customerId },
        data: {
          name: validatedData.name,
          email: validatedData.email,
          role: validatedData.role,
        },
      });

      // Update profile if provided
      if (validatedData.profile) {
        if (existingCustomer.profile) {
          // Update existing profile
          await tx.profile.update({
            where: { id: existingCustomer.profile.id },
            data: {
              phone: validatedData.profile.phone,
              bio: validatedData.profile.bio,
            },
          });
        } else {
          // Create new profile
          await tx.profile.create({
            data: {
              userId: customerId,
              phone: validatedData.profile.phone,
              bio: validatedData.profile.bio,
            },
          });
        }
      }

      // Update or create address if provided
      if (validatedData.address) {
        if (validatedData.address.isDefault) {
          // If this address is default, unset default on all other addresses
          await tx.address.updateMany({
            where: {
              userId: customerId,
              isDefault: true,
            },
            data: {
              isDefault: false,
            },
          });
        }

        // Find existing default address or first address
        const existingAddress = existingCustomer.addresses.find(addr => addr.isDefault) || 
                               existingCustomer.addresses[0];

        if (existingAddress) {
          // Update existing address
          await tx.address.update({
            where: { id: existingAddress.id },
            data: {
              street: validatedData.address.street,
              city: validatedData.address.city,
              state: validatedData.address.state,
              postalCode: validatedData.address.postalCode,
              country: validatedData.address.country,
              isDefault: validatedData.address.isDefault,
            },
          });
        } else {
          // Create new address
          await tx.address.create({
            data: {
              userId: customerId,
              street: validatedData.address.street || "",
              city: validatedData.address.city || "",
              state: validatedData.address.state || "",
              postalCode: validatedData.address.postalCode || "",
              country: validatedData.address.country || "",
              isDefault: validatedData.address.isDefault || true,
            },
          });
        }
      }

      return userUpdate;
    });

    return NextResponse.json({
      message: "Customer updated successfully",
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update customer" },
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

  const customerId = params.id;

  try {
    // Check if customer exists
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Don't allow deletion of the current user
    if (customerId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete customer and related data using a transaction
    await prisma.$transaction(async (tx) => {
      // Delete profile if exists
      await tx.profile.deleteMany({
        where: { userId: customerId },
      });
      
      // Delete addresses
      await tx.address.deleteMany({
        where: { userId: customerId },
      });
      
      // Delete payment methods
      await tx.paymentMethod.deleteMany({
        where: { userId: customerId },
      });
      
      // Delete reviews
      await tx.review.deleteMany({
        where: { userId: customerId },
      });
      
      // Handle orders (optionally anonymize instead of delete)
      await tx.order.updateMany({
        where: { userId: customerId },
        data: {
          userId: "", // Anonymize orders
        },
      });
      
      // Delete the user
      await tx.user.delete({
        where: { id: customerId },
      });
    });

    return NextResponse.json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
} 