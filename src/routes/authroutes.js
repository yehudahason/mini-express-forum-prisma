import express from "express";
import cookieParser from "cookie-parser";
// import { createClient } from "@supabase/supabase-js";
// import { insertUserNic } from "../utils/insertUserNic.js";

const router = express.Router();

router.use(cookieParser());
router.use(express.urlencoded({ extended: true }));

// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_ANON_KEY
// );

// Views
router.get("/auth/login", (req, res) => {
  res.render("login", { title: "Login", error: null, success: null });
});

router.get("/auth/signup", (req, res) => {
  res.render("signup", { title: "Signup", error: null });
});

// Actions
router.post("/auth/signup", async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!email || !password || !username) {
    return res.status(400).render("signup", {
      title: "Signup",
      error: "חסר אימייל או סיסמה או שם משתמש",
    });
  }

  if (password !== confirmPassword) {
    return res
      .status(400)
      .render("signup", { title: "Signup", error: "הסיסמאות לא תואמות" });
  }
  try {
    // await insertUserNic(email, username);
  } catch (err) {
    console.log("Error inserting user nic:", err);
    return res
      .status(400)
      .render("signup", { title: "Signup", error: "שם משתמש קיים" });
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: username ? { username } : undefined, // stored in user_metadata
    },
  });

  if (error) {
    console.log(error);
    return res
      .status(400)
      .render("signup", { title: "Signup", error: error.message });
  }

  // If email confirmations are ON, session may be null until confirmed
  if (!data.session) {
    return res.render("login", {
      title: "Login",
      error: null,
      success: "נשלח מייל אימות. אחרי אימות תוכל להתחבר.",
    });
  }

  // If confirmations are OFF, you get a session immediately
  res.cookie("sb_access_token", data.session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  res.cookie("sb_refresh_token", data.session.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });

  return res.redirect("/");
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

  res.cookie("sb_access_token", data.session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  res.cookie("sb_refresh_token", data.session.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });

  return res.redirect("/");
});

router.post("/auth/logout", (req, res) => {
  res.clearCookie("sb_access_token");
  res.clearCookie("sb_refresh_token");
  res.redirect("/");
});

export default router;
