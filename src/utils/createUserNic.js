import { supabase } from "../lib/supabase.js";

export async function createUserNic({ email, username }) {
  if (!email || !username) {
    throw new Error("Email and username are required");
  }

  try {
    const { data, error } = await supabase
      .from("Users")
      .insert([
        {
          email,
          username,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error creating user nic:", error);
    throw error;
  }
}
