import express from "express";
import cookieParser from "cookie-parser";
import { supabase } from "../lib/supabase.js";
import { createUserNic } from "../utils/createUserNic.js";
import { signToken } from "../utils/signToken.js";
import { get } from "http";
import { updateUserByEmail } from "../utils/updateUser.js";

const router = express.Router();
router.use(cookieParser());
router.use(express.urlencoded({ extended: true }));

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
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res
      .status(400)
      .render("login", { title: "Login", error: error.message, success: null });
  }

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
  const cookieToken = signToken({ username: data.user.user_metadata.username });
  res.cookie("98479", cookieToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });
  return res.redirect("/");
});

router.post("/auth/logout", (req, res) => {
  res.clearCookie("pbap");
  res.clearCookie("pbrp");
  res.clearCookie("98479");
  res.redirect("/");
});


//Upadte user in db 

router.put("/users/update", async (req, res) => {
  const { email, newEmail, username } = req.body;

  try {
    const user = await updateUserByEmail(email, newEmail, username);
    res.json({ message: "User updated successfully", user });
  } catch (err) {
    const msg = err?.message || "Internal server error";

    if (msg === "User not found") return res.status(404).json({ error: msg });
    if (msg.includes("already exists")) return res.status(409).json({ error: msg });
    if (msg.includes("required") || msg.includes("Nothing to update"))
      return res.status(400).json({ error: msg });

    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


export default router
