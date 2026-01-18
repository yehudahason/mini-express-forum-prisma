import { supabase } from "../lib/supabase.js";

export async function requireUser(req, res, next) {
  const token = req.cookies.sb_access_token;
  if (!token) return res.render("login", { title: "Login", error: "כניסה לרשומים בלבד", success: null });

  const { data, error } = await supabase.auth.getUser(token);
  if (error) return res.status(401).json({ error: "Invalid token" });

  req.user = data.user;
  next();
}