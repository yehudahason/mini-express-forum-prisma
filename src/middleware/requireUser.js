import { verifyToken } from "../utils/verifyToken.js";

export function requireUser(req, res, next) {
  const token = req.cookies?.["98479"];

  if (!token) {
    return res.render("login", {
      title: "Login",
      error: "כניסה לרשומים בלבד",
      success: null,
    });
  }

  try {
    const payload = verifyToken(token);

    if (!payload) {
      return res.render("login", {
        title: "Login",
        error: "Please Login Again",
        success: null,
      });
    }

    req.user = payload;
    // optional if you want views to auto-see it:
    // res.locals.user = payload;

    return next();
  } catch (error) {
    console.log("Error verifying token:", error.message);
    return res.render("login", {
      title: "Login",
      error: "Please Login Again",
      success: null,
    });
  }
}
