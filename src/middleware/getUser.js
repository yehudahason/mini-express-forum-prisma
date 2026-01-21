import { verifyToken } from "../utils/verifyToken.js";

export function getUser(req, res, next) {
  const token = req.cookies?.["98479"];

  if (!token) {
    req.user = null;
    res.locals.user = null; // optional
    return next();
  }

  try {
    const payload = verifyToken(token);

    req.user = payload ?? null;
    res.locals.user = req.user; // optional

    return next();
  } catch (error) {
    console.log("Error verifying token:", error.message);
    req.user = null;
    res.locals.user = null; // optional
    return next();
  }
}