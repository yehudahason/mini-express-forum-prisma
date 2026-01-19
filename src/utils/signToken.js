import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET ;
const JWT_EXPIRES_IN = "10y";

/**
 * Sign a JWT token with user payload
 * @param {Object} payload - User data (e.g. { id, email, role })
 * @returns {string} JWT token
 */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}