import { verifyToken } from "../utils/verifyToken.js";
export async function getUser(req, res, next) {

  const token = req.cookies?.jwt_token;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = verifyToken(token);
    console.log("Decoded JWT payload:", payload);
    if (!payload) {
      req.user = null;
      return next();
    }
    req.user = payload;
    next();
  } catch (error) {
    console.log("Error verifying token:", error.message);
    req.user = null;
    return next();
  }
}