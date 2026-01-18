import { prisma } from "../../lib/prisma.js";

export async function createUserNic({ email, username }) {
  if (!email || !username) {
    throw new Error("Email and username are required");
  }
  try {
    return await prisma.user.create({
      data: {
        email,
        username,
      },
    });

  }catch (error) {
    console.error("Error creating user nic:", error);
    throw error;
  }
}