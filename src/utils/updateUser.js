import {prisma} from "../lib/prisma.js"

export async function updateUserByEmail(email, newEmail, username) {
  if (!email) throw new Error("Current email is required");
  if (!newEmail && !username) throw new Error("Nothing to update");

  try {
    return await prisma.user.update({
      where: { email },
      data: {
        ...(newEmail ? { email: newEmail } : {}),
        ...(username ? { username } : {}),
      },
    });
  } catch (err) {
    // Prisma error codes live on err.code
    const code = err && typeof err === "object" ? err.code : undefined;

    if (code === "P2025") throw new Error(`User not found:${err.message}`);
    if (code === "P2002") throw new Error("Email or username already exists");
    throw err; // don't swallow unexpected errors
  }
}