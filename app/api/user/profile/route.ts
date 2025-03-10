import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  bio: z.string().optional(),
  phone: z.string().optional(),
})

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    
    // Check if user is authenticated
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    const userId = session.user.id as string
    const data = await req.json()
    
    // Validate request data
    const validatedData = profileSchema.parse(data)
    
    // Update user's name
    await prisma.user.update({
      where: { id: userId },
      data: { name: validatedData.name }
    })
    
    // Find existing profile or create it if it doesn't exist
    const profile = await prisma.profile.findUnique({
      where: { userId }
    })
    
    if (profile) {
      // Update existing profile
      await prisma.profile.update({
        where: { userId },
        data: {
          bio: validatedData.bio,
          phone: validatedData.phone,
        }
      })
    } else {
      // Create new profile
      await prisma.profile.create({
        data: {
          userId,
          bio: validatedData.bio,
          phone: validatedData.phone,
        }
      })
    }
    
    return NextResponse.json(
      { message: 'Profile updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Profile update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 