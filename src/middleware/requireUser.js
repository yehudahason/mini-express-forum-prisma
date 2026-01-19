import { verifyToken } from "../utils/verifyToken.js";

export async function requireUser(req, res, next) {

  const token = req.cookies?.jwt_token;
  if (!token) return res.render("login", { title: "Login", error: "כניסה לרשומים בלבד", success: null });

  try {
    const payload = verifyToken(token);
    console.log("Decoded JWT payload:", payload);
    if (!payload) {
      console.log("Error fetching user:", error.message);
      return res.render("login", { title: "Login", error: "Please Login Again", success: null });
    }

    req.user = payload;
    next();
  } catch (error) {
    console.log("Error verifying token:", error.message);
    return res.render("login", { title: "Login", error: "Please Login Again", success: null });
  }

}