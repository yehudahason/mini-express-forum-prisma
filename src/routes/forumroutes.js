import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
// import { sequelize } from "../models/index.js";
// import { Forum, Thread, Reply } from "../models/associations.js";
import sanitizeHtml from "sanitize-html";
// import { Op } from "sequelize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const forum = express.Router();

/* ======================================================
   HOME PAGE — LIST FORUMS
====================================================== */
forum.get("/", async (req, res) => {
  try {
    // const forums = await Forum.findAll({
    //   order: [["id", "ASC"]],
    // });
    res.json({ message: "forum home route2" });
    // res.render("home", {
    //   title: "PITRON HALOMOT",
    //   // forums,
    // });
  } catch (err) {
    console.error("Error loading forums:", err);
    res.status(500).send("Server error");
  }
});

/* ======================================================
   API — LIST THREADS WITH PAGINATION
   GET /f/:id?page=1
====================================================== */

forum.get("/f/:id", async (req, res) => {
  const forumId = Number(req.params.id);
  if (Number.isNaN(forumId)) return res.status(400).send("Invalid forum id");

  // Pagination params
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = 10; // threads per page
  const offset = (page - 1) * limit;

  try {
    // Load forum info
    // const forumData = await Forum.findByPk(forumId);
    // if (!forumData) return res.status(404).send("Forum not found");

    // Count total threads (for pagination)
    // const totalThreads = await Thread.count({
    //   where: { forum_id: forumId },
    // });

    const totalPages = Math.max(Math.ceil(totalThreads / limit), 1);

    // Clamp too-high page
    if (page > totalPages) {
      return res.redirect(`/f/${forumId}?page=${totalPages}`);
    }

    // Fetch paginated threads + reply_count (NO literal)
    // const threads = await Thread.findAll({
    //   where: { forum_id: forumId },

    //   attributes: {
    //     include: [
    //       [sequelize.fn("COUNT", sequelize.col("Replies.id")), "reply_count"],
    //     ],
    //   },

    //   include: [
    //     {
    //       model: Reply,
    //       attributes: [],
    //       required: false, // LEFT JOIN (threads with 0 replies still show)
    //     },
    //   ],

    //   group: ["Thread.id"],
    //   order: [["created_at", "DESC"]],
    //   limit,
    //   offset,

    //   // Important when using limit/offset with include + group
    //   subQuery: false,
    // });

    res.render("forum", {
      title: forumData.name,
      forum: forumData,
      threads,
      currentPage: page,
      totalPages,
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

  // const forumData = await Forum.findByPk(forumId);
  if (!forumData) return res.status(404).send("Forum not found");

  res.render("new-thread", {
    title: "פתיחת נושא חדש",
    forum: forumData,
  });
});

/* ======================================================
   POST NEW THREAD
====================================================== */
forum.post("/f/:forumId/threads", async (req, res) => {
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
  content = `<pre class="responsive">` + content + "</pre>";
  try {
    // const thread = await Thread.create({
    //   forum_id: forumId,
    //   title,
    //   author: author || null,
    //   content,
    // });

    res.redirect(`/thread/${thread.id}`);
  } catch (err) {
    console.error("Error creating thread:", err);
    res.status(500).send("Server error");
  }
});

/* ======================================================
   API — VIEW THREAD WITH PAGINATED REPLIES
   GET /thread/:id?page=1
====================================================== */

forum.get("/thread/:id", async (req, res) => {
  const threadId = Number(req.params.id);

  // Pagination params
  const page = Number(req.query.page) || 1;
  const limit = 10; // replies per page
  const offset = (page - 1) * limit;

  try {
    // Load thread info
    // const thread = await Thread.findByPk(threadId);
    if (!thread) return res.status(404).send("Thread not found");

    // Count total replies
    // const totalReplies = await Reply.count({
    //   where: { thread_id: threadId },
    // });

    const totalPages = Math.ceil(totalReplies / limit);

    // Fetch paginated replies
    // const replies = await Reply.findAll({
    //   where: { thread_id: threadId },
    //   order: [["created_at", "ASC"]],
    //   limit,
    //   offset,
    // });

    res.render("thread", {
      title: thread.title,
      forumId: thread.forum_id,
      thread,
      replies,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    console.error("Error loading thread:", err);
    res.status(500).send("Server error");
  }
});
// ##################################
// SEARCH FORUM THREAD AND REPLIES
// /search?q=qeury
// ###################################
forum.get("/search", async (req, res) => {
  const q = req.query.q?.trim();

  if (!q) {
    return res.render("search", {
      query: "",
      results: [],
      title: "search",
    });
  }

  try {
    // 1 – search threads
    // const matchingThreads = await Thread.findAll({
    //   where: {
    //     [Op.or]: [
    //       { title: { [Op.iLike]: `%${q}%` } },
    //       { content: { [Op.iLike]: `%${q}%` } },
    //       { author: { [Op.iLike]: `%${q}%` } },
    //     ],
    //   },
    //   limit: 20,
    //   raw: true,
    // });

    // 2 – search replies
    // const matchingReplies = await Reply.findAll({
    //   where: {
    //     [Op.or]: [
    //       { content: { [Op.iLike]: `%${q}%` } },
    //       { author: { [Op.iLike]: `%${q}%` } },
    //     ],
    //   },
    //   limit: 20,
    //   raw: true,
    // });

    // 3 – group replies by thread_id
    const repliesByThread = {};
    matchingReplies.forEach((r) => {
      if (!repliesByThread[r.thread_id]) {
        repliesByThread[r.thread_id] = [];
      }
      repliesByThread[r.thread_id].push(r);
    });

    // 4 – merge results
    const results = [];

    matchingThreads.forEach((thread) => {
      results.push({
        thread,
        matchesInThread: true,
        replyMatches: repliesByThread[thread.id] || [],
      });
    });

    Object.keys(repliesByThread).forEach((threadId) => {
      const exists = results.some((r) => r.thread.id == threadId);
      if (!exists) {
        results.push({
          thread: { id: threadId },
          matchesInThread: false,
          replyMatches: repliesByThread[threadId],
        });
      }
    });

    res.render("search", {
      query: q,
      results,
      title: "search",
      formatDate: req.app.locals.formatDate, // optional formatter
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).send("Server error");
  }
});

/* ======================================================
   POST A REPLY
====================================================== */
forum.post("/thread/:id/replies", async (req, res) => {
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
    // await Reply.create({
    //   thread_id: threadId,
    //   author: author || null,
    //   content,
    // });

    res.render("redirect", {
      thread_id: threadId,
      title: "redirect",
    });
  } catch (err) {
    console.error("Error creating reply:", err);
    res.status(500).send("Server error");
  }
});

/* ======================================================
   DELETE THREAD
====================================================== */
forum.post("/thread/:id/delete", async (req, res) => {
  const threadId = Number(req.params.id);

  try {
    // const thread = await Thread.findByPk(threadId);
    if (!thread) return res.status(404).send("Thread not found");

    const forumId = thread.forum_id;

    // await Reply.destroy({ where: { thread_id: threadId } });
    // await Thread.destroy({ where: { id: threadId } });

    res.redirect(`/f/${forumId}`);
  } catch (err) {
    console.error("Error deleting thread:", err);
    res.status(500).send("Server error");
  }
});

// /* ======================================================
//    DELETE REPLY
// ====================================================== */
forum.post("/thread/:threadId/replies/:replyId/delete", async (req, res) => {
  const { threadId, replyId } = req.params;

  try {
    // await Reply.destroy({
    //   where: {
    //     id: replyId,
    //     thread_id: threadId,
    //   },
    // });

    res.redirect(`/thread/${threadId}`);
  } catch (err) {
    console.error("Error deleting reply:", err);
    res.status(500).send("Server error");
  }
});

/* ======================================================
   FETCH NEW POSTS ACROSS ALL FORUMS
====================================================== */

// forum.get("/new-posts", async (req, res) => {
//   try {
//     const posts = await Thread.findAll({
//   attributes: {
//     include: [
//       // COUNT(replies)
//       [sequelize.fn("COUNT", sequelize.col("Replies.id")), "reply_count"],

//       // MAX(reply.created_at)
//       [
//         sequelize.fn("MAX", sequelize.col("Replies.created_at")),
//         "last_reply_at",
//       ],

//       // COALESCE(MAX(reply.created_at), Thread.created_at)
//       [
//         sequelize.fn(
//           "COALESCE",
//           sequelize.fn("MAX", sequelize.col("Replies.created_at")),
//           sequelize.col("Thread.created_at")
//         ),
//         "latest_activity",
//       ],
//     ],
//   },

//   include: [
//     {
//       model: Forum,
//       attributes: ["id", "name"],
//     },
//     {
//       model: Reply,
//       attributes: [],
//       required: false, // LEFT JOIN (threads with 0 replies)
//     },
//   ],

//   group: ["Thread.id", "Forum.id"],

//   order: [[sequelize.col("latest_activity"), "DESC"]],
//   limit: 40,
//   subQuery: false,
// });

//   res.render("new-posts", {
//     title: "פוסטים אחרונים",
//     posts,
//   });
// } catch (err) {
//   console.error("Error fetching posts:", err);
//   res.status(500).send("Server error");
// }
// });

forum.use((req, res) => {
  res.status(404).render("notFound", {
    title: "404 Not Found",
  });
});

export default forum;
