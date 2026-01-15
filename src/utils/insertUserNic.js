import { User } from "../models/User.js";

async function insertUserNic(email, username) {
  try {
    return User.create({ email, username });
  } catch (err) {
    console.error("Insert user nic error:", err);
    throw err;
  }
}

export { insertUserNic };
