import { supabase } from "../lib/supabase.js";

export async function getUser(req, res, next) {
  const token = req.cookies?.sb_access_token;

  if (!token) {
    req.user = null;
    return next();
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    req.user = null;
    return next();
  }

  req.user = data.user;
  next();
}