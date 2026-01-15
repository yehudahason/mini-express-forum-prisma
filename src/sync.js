import { sequelize } from "./models/index.js";
import "./models/associations.js";

export default async function syncDB() {
  try {
    await sequelize.authenticate();
    console.log("Connected!");

    await sequelize.sync({ alter: true }); // or { force: true } to drop everything

    console.log("Tables Sync in DB");
  } catch (err) {
    console.error("Sync error:", err);
  }
}

// syncDB();
