import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import expressLayouts from "express-ejs-layouts";

import { sequelize } from "./models/index.js";
import { Forum, Thread, Reply } from "./models/associations.js";
import { globalLimiter, createThreadLimiter } from "./utils/ratelimit.js";
import sanitizeHtml from "sanitize-html";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);

/* ==== DATE FORMAT LOCAL HELPER ==== */
app.locals.formatDate = (date) => {
  return new Date(date).toLocaleString("he-IL", {
    timeZone: "Asia/Jerusalem",
  });
};

/* ==== EXPRESS SETUP ==== */
app.use(express.urlencoded({ extended: true }));

app.use(
  "/forum",
  express.static(path.join(__dirname, "public"), {
    maxAge: 0,
    etag: false,
    lastModified: false,
  })
);

app.use(globalLimiter);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout");

const forum = express.Router();

/* ======================================================
   HOME PAGE — LIST FORUMS
====================================================== */
forum.get("/", async (req, res) => {
  try {
    const forums = await Forum.findAll({
      order: [["id", "ASC"]],
    });

    res.render("home", {
      title: "PITRON HALOMOT",
      forums,
    });
  } catch (err) {
    console.error("Error loading forums:", err);
    res.status(500).send("Server error");
  }
});

/* ======================================================
   FORUM PAGE — LIST THREADS INSIDE A FORUM
====================================================== */
forum.get("/f/:id", async (req, res) => {
  const forumId = Number(req.params.id);

  try {
    const forumData = await Forum.findByPk(forumId);
    if (!forumData) return res.status(404).send("Forum not found");

    const threads = await Thread.findAll({
      where: { forum_id: forumId },
      order: [["created_at", "DESC"]],
      attributes: {
        include: [
          [
            sequelize.literal(`
            (SELECT COUNT(*) FROM replies r WHERE r.thread_id = "Thread"."id")
            `),
            "reply_count",
          ],
        ],
      },
    });

    res.render("forum", {
      title: forumData.name,
      forum: forumData,
      threads,
    });
  } catch (err) {
    console.error("Error loading forum:", err);
    res.status(500).send("Server error");
  }
});

/* ======================================================
   NEW THREAD PAGE
====================================================== */
forum.get("/f/:id/new", async (req, res) => {
  const forumId = Number(req.params.id);

  const forumData = await Forum.findByPk(forumId);
  if (!forumData) return res.status(404).send("Forum not found");

  res.render("new-thread", {
    title: "פתיחת נושא חדש",
    forum: forumData,
  });
});

/* ======================================================
   POST NEW THREAD
====================================================== */
forum.post("/f/:forumId/threads", createThreadLimiter, async (req, res) => {
  const forumId = Number(req.params.forumId);

  const title = sanitizeHtml(req.body.title, {
    allowedTags: [], // title shouldn't have HTML
  });

  const author = sanitizeHtml(req.body.author, {
    allowedTags: [],
  });

  let content = sanitizeHtml(req.body.content, {
    allowedTags: ["pre", "code", "b", "i", "strong", "em", "p", "br"],
    allowedAttributes: {},
  });
  content = "<pre>" + content + "</pre>";
  try {
    const thread = await Thread.create({
      forum_id: forumId,
      title,
      author: author || null,
      content,
    });

    res.redirect(`/forum/thread/${thread.id}`);
  } catch (err) {
    console.error("Error creating thread:", err);
    res.status(500).send("Server error");
  }
});

/* ======================================================
   VIEW THREAD PAGE
====================================================== */
forum.get("/thread/:id", async (req, res) => {
  const threadId = Number(req.params.id);

  try {
    const thread = await Thread.findByPk(threadId);
    if (!thread) return res.status(404).send("Thread not found");

    const replies = await Reply.findAll({
      where: { thread_id: threadId },
      order: [["created_at", "ASC"]],
    });

    res.render("thread", {
      title: thread.title,
      thread,
      replies,
      forumId: thread.forum_id,
    });
  } catch (err) {
    console.error("Error loading thread:", err);
    res.status(500).send("Server error");
  }
});

/* ======================================================
   POST A REPLY
====================================================== */
forum.post("/thread/:id/replies", createThreadLimiter, async (req, res) => {
  const threadId = Number(req.params.id);

  const author = sanitizeHtml(req.body.author, {
    allowedTags: [],
  });

  let content = sanitizeHtml(req.body.content, {
    allowedTags: ["pre", "code", "b", "i", "strong", "em", "p", "br"],
    allowedAttributes: {},
  });
  content = "<pre>" + content + "</pre>";
  try {
    await Reply.create({
      thread_id: threadId,
      author: author || null,
      content,
    });

    res.redirect(`/forum/thread/${threadId}`);
  } catch (err) {
    console.error("Error creating reply:", err);
    res.status(500).send("Server error");
  }
});

/* ======================================================
   DELETE THREAD
====================================================== */
// forum.post("/thread/:id/delete", async (req, res) => {
//   const threadId = Number(req.params.id);

//   try {
//     const thread = await Thread.findByPk(threadId);
//     if (!thread) return res.status(404).send("Thread not found");

//     const forumId = thread.forum_id;

//     await Reply.destroy({ where: { thread_id: threadId } });
//     await Thread.destroy({ where: { id: threadId } });

//     res.redirect(`/forum/f/${forumId}`);
//   } catch (err) {
//     console.error("Error deleting thread:", err);
//     res.status(500).send("Server error");
//   }
// });

// /* ======================================================
//    DELETE REPLY
// ====================================================== */
// forum.post("/thread/:threadId/replies/:replyId/delete", async (req, res) => {
//   const { threadId, replyId } = req.params;

//   try {
//     await Reply.destroy({
//       where: {
//         id: replyId,
//         thread_id: threadId,
//       },
//     });

//     res.redirect(`/forum/thread/${threadId}`);
//   } catch (err) {
//     console.error("Error deleting reply:", err);
//     res.status(500).send("Server error");
//   }
// });

/* ======================================================
   FETCH NEW POSTS ACROSS ALL FORUMS
====================================================== */
forum.get("/new-posts", async (req, res) => {
  try {
    const posts = await Thread.findAll({
      include: [
        {
          model: Forum,
          attributes: ["id", "name"],
        },
      ],
      order: [["created_at", "DESC"]],
      attributes: {
        include: [
          [
            sequelize.literal(`
    (SELECT COUNT(*) FROM replies r WHERE r.thread_id = "Thread"."id")
  `),
            "reply_count",
          ],
        ],
      },
    });

    res.render("new-posts", {
      title: "פוסטים אחרונים",
      posts,
    });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).send("Server error");
  }
});

/* ======================================================
   MOUNT ROUTER
====================================================== */
app.use("/forum", forum);

/* ======================================================
   START SERVER
====================================================== */
const PORT = process.env.PORT || 3333;

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to PostgreSQL via Sequelize!");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Forum running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("DB connection error:", err);
  }
})();
