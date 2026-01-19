import { supabase } from "../lib/supabase.js";

export async function requireUser(req, res, next) {
  const token = req.cookies.sb_access_token;
  if (!token) return res.render("login", { title: "Login", error: "כניסה לרשומים בלבד", success: null });
  const { data, error } = await supabase.auth.getUser(token);
  if (error){
    console.log("Error fetching user:", error.message);
    return res.render("login", { title: "Login", error: "Please Login Again", success: null });
  }
    req.user = {
    id: data.user.id,
    email: data.user.email,
    role: data.user.role,
    app_metadata: data.user.app_metadata,
    user_metadata: data.user.user_metadata,
  };
  next();
}