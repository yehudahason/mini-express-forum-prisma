import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import expressLayouts from "express-ejs-layouts";
import cors from "cors";
import { logRequests } from "./utils/logMiddleware.js";
import { createClient } from "@supabase/supabase-js";
import router from "./routes/authroutes.js";
import cookieParser from "cookie-parser";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import forum from "./routes/forumroutes.js";
import { get } from "http";
import { getUser } from "./middleware/getUser.js";
// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);



const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3333",
  "http://localhost:4444",
  "https://pitron-halomot.org",
  "https://www.pitron-halomot.org",
  "https://forum.pitron-halomot.org",
  "https://lab.pitron-halomot.org"
];

// app.use(logRequests);
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (curl, internal)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked: " + origin));
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.set("trust proxy", 1);

app.locals.formatDate = function (date) {
  return new Date(date).toLocaleString("he-IL", {
    timeZone: "Asia/Jerusalem",
    hour12: false,
    dateStyle: "short",
    timeStyle: "short",
  });
};

app.use((req, res, next) => {
  res.locals.formatDate = app.locals.formatDate;
  next();
});
/* ==== EXPRESS SETUP ==== */
app.use(express.urlencoded({ extended: true }));

app.use(
  "/",
  express.static(path.join(__dirname, "public"), {
    maxAge: 0,
    etag: false,
    lastModified: false,
  })
);

// app.use(globalLimiter);
//view engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout");

app.use(getUser);

app.get("/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json(req.user);
});

/* ======================================================
   MOUNT ROUTER
====================================================== */
app.use("/", router);
app.use("/", forum);

/* ======================================================
   START SERVER
====================================================== */
const PORT = process.env.PORT || 4422;

(async () => {
  try {
    // syncDB();
    // await sequelize.authenticate();
    // console.log("Connected to PostgreSQL via Sequelize!");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Forum running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("DB connection error:", err);
  }
})();
