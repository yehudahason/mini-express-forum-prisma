import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import sanitizeHtml from "sanitize-html";
import { prisma } from "../../lib/prisma.ts"; // <-- adjust path if needed

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const forum = express.Router();

/* ======================================================
   HOME PAGE — LIST FORUMS
====================================================== */
forum.get("/", async (req, res) => {
  try {
    const forums = await prisma.forum.findMany({
      orderBy: { id: "asc" },
    });

    // If you want JSON for now:
    // return res.json({ forums });
    // res.json({ forums });

    return res.render("home", {
      title: "PITRON HALOMOT",
      forums,
    });
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

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    const forumData = await prisma.forum.findUnique({
      where: { id: forumId },
    });
    if (!forumData) return res.status(404).send("Forum not found");

    const totalThreads = await prisma.thread.count({
      where: { forumId },
    });

    const totalPages = Math.max(Math.ceil(totalThreads / limit), 1);

    if (page > totalPages) {
      return res.redirect(`/f/${forumId}?page=${totalPages}`);
    }

    const threadsRaw = await prisma.thread.findMany({
      where: { forumId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        _count: { select: { replies: true } },
      },
    });

    // Keep compatibility with old templates expecting:
    // - thread.forum_id
    // - thread.created_at
    // - thread.reply_count
    const threads = threadsRaw.map((t) => ({
      ...t,
      forum_id: t.forumId,
      created_at: t.createdAt,
      reply_count: t._count?.replies ?? 0,
    }));

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

  const forumData = await prisma.forum.findUnique({
    where: { id: forumId },
  });

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

  const title = sanitizeHtml(req.body.title, { allowedTags: [] });
  const author = sanitizeHtml(req.body.author, { allowedTags: [] });

  let content = sanitizeHtml(req.body.content, {
    allowedTags: ["pre", "code", "b", "i", "strong", "em", "p", "br"],
    allowedAttributes: {},
  });
  content = `<pre class="responsive">` + content + "</pre>";

  try {
    const thread = await prisma.thread.create({
      data: {
        forumId,
        title,
        author: author || null,
        content,
      },
    });

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

  const page = Number(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });
    if (!thread) return res.status(404).send("Thread not found");

    const totalReplies = await prisma.reply.count({
      where: { threadId },
    });

    const totalPages = Math.ceil(totalReplies / limit);

    const repliesRaw = await prisma.reply.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      take: limit,
      skip: offset,
    });

    // Template compatibility: reply.created_at + reply.thread_id
    const replies = repliesRaw.map((r) => ({
      ...r,
      created_at: r.createdAt,
      thread_id: r.threadId,
    }));

    res.render("thread", {
      title: thread.title,
      forumId: thread.forumId, // was thread.forum_id in Sequelize
      thread: {
        ...thread,
        forum_id: thread.forumId,
        created_at: thread.createdAt,
      },
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
// /search?q=query
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
    const matchingThreads = await prisma.thread.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
          { author: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    const matchingReplies = await prisma.reply.findMany({
      where: {
        OR: [
          { content: { contains: q, mode: "insensitive" } },
          { author: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    // group replies by threadId
    const repliesByThread = {};
    for (const r of matchingReplies) {
      const tid = r.threadId;
      if (!repliesByThread[tid]) repliesByThread[tid] = [];
      repliesByThread[tid].push({
        ...r,
        thread_id: r.threadId,
        created_at: r.createdAt,
      });
    }

    // merge results
    const results = [];

    for (const t of matchingThreads) {
      results.push({
        thread: {
          ...t,
          forum_id: t.forumId,
          created_at: t.createdAt,
        },
        matchesInThread: true,
        replyMatches: repliesByThread[t.id] || [],
      });
    }

    // Threads that only appear via reply matches (not in matchingThreads)
    const missingThreadIds = Object.keys(repliesByThread)
      .map(Number)
      .filter((tid) => !matchingThreads.some((t) => t.id === tid));

    if (missingThreadIds.length > 0) {
      const missingThreads = await prisma.thread.findMany({
        where: { id: { in: missingThreadIds } },
        select: {
          id: true,
          title: true,
          forumId: true,
          author: true,
          createdAt: true,
        },
      });

      for (const t of missingThreads) {
        results.push({
          thread: {
            ...t,
            forum_id: t.forumId,
            created_at: t.createdAt,
          },
          matchesInThread: false,
          replyMatches: repliesByThread[t.id] || [],
        });
      }
    }

    res.render("search", {
      query: q,
      results,
      title: "search",
      formatDate: req.app.locals.formatDate,
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

  const author = sanitizeHtml(req.body.author, { allowedTags: [] });

  let content = sanitizeHtml(req.body.content, {
    allowedTags: ["pre", "code", "b", "i", "strong", "em", "p", "br"],
    allowedAttributes: {},
  });
  content = "<pre>" + content + "</pre>";

  try {
    await prisma.reply.create({
      data: {
        threadId,
        author: author || null,
        content,
      },
    });

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
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });
    if (!thread) return res.status(404).send("Thread not found");

    const forumId = thread.forumId;

    // If your Prisma schema has onDelete: Cascade on Reply->Thread relation,
    // you can just delete the thread and replies will be deleted automatically.
    // Otherwise, keep the transaction below (safe in either case).
    await prisma.$transaction([
      prisma.reply.deleteMany({ where: { threadId } }),
      prisma.thread.delete({ where: { id: threadId } }),
    ]);

    res.redirect(`/f/${forumId}`);
  } catch (err) {
    console.error("Error deleting thread:", err);
    res.status(500).send("Server error");
  }
});

/* ======================================================
   DELETE REPLY
====================================================== */
forum.post("/thread/:threadId/replies/:replyId/delete", async (req, res) => {
  const threadId = Number(req.params.threadId);
  const replyId = Number(req.params.replyId);

  try {
    // deleteMany avoids throwing if not found and also ensures it belongs to threadId
    await prisma.reply.deleteMany({
      where: { id: replyId, threadId },
    });

    res.redirect(`/thread/${threadId}`);
  } catch (err) {
    console.error("Error deleting reply:", err);
    res.status(500).send("Server error");
  }
});

//New Posts - recent activity across all forums
forum.get("/new-posts", async (req, res) => {
  try {
    const rows = await prisma.$queryRaw`
      SELECT
        t.*,
        f.id   AS forum_id,
        f.name AS forum_name,
        COUNT(r.id)::int AS reply_count,
        MAX(r.created_at) AS last_reply_at,
        COALESCE(MAX(r.created_at), t.created_at) AS latest_activity
      FROM threads t
      JOIN forums f ON f.id = t.forum_id
      LEFT JOIN replies r ON r.thread_id = t.id
      GROUP BY t.id, f.id
      ORDER BY latest_activity DESC
      LIMIT 40;
    `;

    const posts = rows.map((r) => ({
      id: r.id,
      title: r.title,
      author: r.author,
      created_at: r.created_at,
      reply_count: r.reply_count,

      Forum: {
        id: r.forum_id,
        name: r.forum_name,
      },

      dataValues: {
        last_reply_at: r.last_reply_at,
      },
    }));

    res.render("new-posts", {
      title: "פוסטים אחרונים",
      posts,
    });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).send("Server error");
  }
});

export default forum;
