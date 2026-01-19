import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET 

/**
 * Verify a JWT token and return payload
 * @param {string} token - JWT token
 * @returns {Object} decoded payload
 * @throws {Error} if token is invalid or expired
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}