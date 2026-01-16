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
  "https://mini-express-forum-prisma.onrender.com"
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
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout");

app.post("/set-username", async (req, res) => {
  const { username } = req.body;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return res.sendStatus(401);

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    username,
  });

  if (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Username already taken" });
    }
    return res.status(400).json({ error: error.message });
  }

  // optional mirror into metadata
  await supabase.auth.updateUser({
    data: { username },
  });

  res.json({ username });
});

app.use(async (req, res, next) => {
  const accessToken = req.cookies?.sb_access_token;

  if (!accessToken) {
    res.locals.user = null;
    return next();
  }

  const { data } = await supabase.auth.getUser(accessToken);
  res.locals.user = data?.user || null;
  next();
});

/* ======================================================
   MOUNT ROUTER
====================================================== */
app.use("/", router);
app.use("/", forum);

/* ======================================================
   START SERVER
====================================================== */
const PORT = process.env.PORT || 3333;

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
