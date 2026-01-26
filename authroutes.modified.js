import express from "express";
import cookieParser from "cookie-parser";
import { supabase } from "../lib/supabase.js";
import { createUserNic } from "../utils/createUserNic.js";
import { signToken } from "../utils/signToken.js";

const router = express.Router();
router.use(cookieParser());
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

// Views
router.get("/auth/login", (req, res) => {
  res.render("login", { title: "Login", error: null, success: null });
});

router.get("/auth/signup", (req, res) => {
  res.render("signup", { title: "Signup", error: null });
});

// Actions
// 

//signup
router.post("/auth/signup", async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({
      error: "חסר אימייל או סיסמה או שם משתמש",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      error: "הסיסמאות לא תואמות",
    });
  }

  try {
    await createUserNic({ email, username });
  } catch {
    return res.status(400).json({
      error: "שם משתמש ו/או אימייל קיים",
    });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({ success: true });
});


router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: "חסר אימייל או סיסמה" });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // keep message friendly (and don't leak too much detail)
    return res.status(400).json({ error: "אימייל או סיסמה שגויים" });
  }

  // set auth cookies (fetch will still receive Set-Cookie on same-origin requests)
  res.cookie("pbap", data.session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  res.cookie("pbrp", data.session.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });

  const cookieToken = signToken({
    username: data.user.user_metadata?.username,
  });

  res.cookie("98479", cookieToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  return res.json({ success: true });
});


router.post("/auth/logout", (req, res) => {
  res.clearCookie("pbap");
  res.clearCookie("pbrp");
  res.clearCookie("98479");
  res.redirect("/");
});

export default router;
