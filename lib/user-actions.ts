import { PrismaClient } from "@prisma/client";
import { hashPassword } from "./auth-utils";

const prisma = new PrismaClient();

type UserRegistrationData = {
  email: string;
  password: string;
  name?: string;
};

/**
 * Register a new user with email and password
 */
export async function registerUser(data: UserRegistrationData) {
  const { email, password, name } = data;
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  
  if (existingUser) {
    throw new Error("User with this email already exists");
  }
  
  // Hash the password using bcryptjs
  const hashedPassword = await hashPassword(password);
  
  // Create the user in the database
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  });
  
  // Return only the needed user fields, excluding password
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    emailVerified: user.emailVerified,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Updates a user's password
 */
export async function updatePassword(userId: string, newPassword: string) {
  const hashedPassword = await hashPassword(newPassword);
  
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
  
  return { success: true };
} 