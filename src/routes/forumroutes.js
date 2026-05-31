import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import sanitizeHtml from "sanitize-html";
import { supabase } from "../lib/supabase.js";
import { linkify } from "../utils/linkfy.js";
import { requireUser } from "../middleware/requireUser.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const forum = express.Router();

forum.get("/pitron-halomoṭ.org", (req, res) => {
  res.redirect("https://pitron-halomot.org");
});

/* ======================================================
   HOME PAGE — LIST FORUMS
====================================================== */
forum.get("/", async (req, res) => {
  try {
    const { data: forums, error } = await supabase
      .from("forums")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;

    return res.render("home", {
      title: "PITRON HALOMOT",
      forums,
      user: req.user || null,
    });
  } catch (err) {
    console.error("Error loading forums:", err);
    res.status(500).send("Server error");
  }
});

/* ======================================================
   API — LIST THREADS
====================================================== */
forum.get("/f/:id", requireUser, async (req, res) => {
  const forumId = Number(req.params.id);
  if (Number.isNaN(forumId)) return res.status(400).send("Invalid forum id");

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    const { data: forumData, error: fErr } = await supabase
      .from("forums")
      .select("*")
      .eq("id", forumId)
      .single();
    if (fErr || !forumData) return res.status(404).send("Forum not found");

    const { count: totalThreads, error: cErr } = await supabase
      .from("threads")
      .select("*", { count: "exact", head: true })
      .eq("forum_id", forumId);

    if (cErr) throw cErr;

    const totalPages = Math.max(Math.ceil((totalThreads || 0) / limit), 1);
    if (page > totalPages)
      return res.redirect(`/f/${forumId}?page=${totalPages}`);

    const { data: threadsRaw, error: tErr } = await supabase
      .from("threads")
      .select("*, replies(count)", { count: "exact" })
      .eq("forum_id", forumId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (tErr) throw tErr;

    const threads = threadsRaw.map((t) => ({
      ...t,
      forum_id: t.forum_id,
      created_at: t.created_at,
      reply_count: t.replies?.[0]?.count ?? 0,
    }));

    res.render("forum", {
      title: forumData.name,
      forum: forumData,
      threads,
      currentPage: page,
      totalPages,
      user: req.user || null,
    });
  } catch (err) {
    console.error("Error loading forum:", err);
    res.status(500).send("Server error");
  }
});

/* ======================================================
   NEW THREAD PAGE
====================================================== */
forum.get("/f/:id/new", requireUser, async (req, res) => {
  const forumId = Number(req.params.id);
  const { data: forumData } = await supabase
    .from("forums")
    .select("*")
    .eq("id", forumId)
    .single();
  if (!forumData) return res.status(404).send("Forum not found");

  res.render("new-thread", {
    title: "פתיחת נושא חדש",
    forum: forumData,
    user: req.user || null,
  });
});

/* ======================================================
   POST NEW THREAD
====================================================== */
forum.post("/f/:forumId/threads", requireUser, async (req, res) => {
  const forumId = Number(req.params.forumId);
  const title = sanitizeHtml(req.body.title, { allowedTags: [] });
  const author = sanitizeHtml(req.user.username || "אורח", { allowedTags: [] });
  let content = linkify(
    sanitizeHtml(req.body.content, {
      allowedTags: ["pre", "code", "b", "i", "strong", "em", "p", "br"],
    }),
  );
  content = `<pre class="responsive">${content}</pre>`;

  try {
    const { data: thread, error } = await supabase
      .from("threads")
      .insert({ forum_id: forumId, title, author, content })
      .select()
      .single();
    if (error) throw error;
    res.redirect(`/thread/${thread.id}`);
  } catch (err) {
    console.error("Error creating thread:", err);
    res.status(500).send("Server error");
  }
});

/* ======================================================
   VIEW THREAD
====================================================== */
/* ======================================================
   VIEW THREAD
====================================================== */
forum.get("/thread/:id", requireUser, async (req, res) => {
  const threadId = Number(req.params.id);
  try {
    const { data: thread, error } = await supabase
      .from("threads")
      .select("*, forums(*)") // וודא שאתה שולף את פרטי הפורום
      .eq("id", threadId)
      .single();

    if (error || !thread) return res.status(404).send("Thread not found");

    const page = Number(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const { data: repliesRaw, count } = await supabase
      .from("replies")
      .select("*", { count: "exact" })
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    const replies = repliesRaw.map((r) => ({
      ...r,
      created_at: r.created_at,
      thread_id: r.thread_id,
    }));

    res.render("thread", {
      title: thread.title,
      // הוסף כאן את ה-forumId שמגיע מה-thread שנשלף
      forumId: thread.forum_id,
      thread: {
        ...thread,
        forum_id: thread.forum_id,
        created_at: thread.created_at,
      },
      replies,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit),
      user: req.user || null,
    });
  } catch (err) {
    console.error("Error loading thread:", err);
    res.status(500).send("Server error");
  }
});
/* ======================================================
   SEARCH
====================================================== */
forum.get("/search", requireUser, async (req, res) => {
  const q = req.query.q?.trim();

  if (!q) {
    return res.render("search", {
      query: "",
      results: [],
      title: "search",
      user: req.user || null,
    });
  }

  try {
    // -----------------------
    // THREAD SEARCH
    // -----------------------
    const { data: matchingThreads, error: threadError } = await supabase
      .from("threads")
      .select("*")
      .or(`title.ilike.%${q}%,content.ilike.%${q}%,author.ilike.%${q}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (threadError) throw threadError;

    // -----------------------
    // REPLY SEARCH
    // -----------------------
    const { data: matchingReplies, error: replyError } = await supabase
      .from("replies")
      .select("*")
      .or(`content.ilike.%${q}%,author.ilike.%${q}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (replyError) throw replyError;

    // -----------------------
    // GROUP REPLIES BY THREAD
    // -----------------------
    const repliesByThread = {};
    for (const r of matchingReplies || []) {
      const tid = r.thread_id;

      if (!repliesByThread[tid]) repliesByThread[tid] = [];

      repliesByThread[tid].push({
        ...r,
        thread_id: r.thread_is,
        created_at: r.created_at,
      });
    }

    // -----------------------
    // MERGE THREAD RESULTS
    // -----------------------
    const results = [];

    for (const t of matchingThreads || []) {
      results.push({
        thread: {
          ...t,
          forum_id: t.forum_id,
          created_at: t.created_at,
        },
        matchesInThread: true,
        replyMatches: repliesByThread[t.id] || [],
      });
    }

    // -----------------------
    // FIND THREADS ONLY FROM REPLIES
    // -----------------------
    const missingThreadIds = Object.keys(repliesByThread)
      .map(Number)
      .filter((tid) => !matchingThreads.some((t) => t.id === tid));

    if (missingThreadIds.length > 0) {
      const { data: missingThreads, error: missingError } = await supabase
        .from("threads")
        .select("id,title,forum_id,author,created_at")
        .in("id", missingThreadIds);

      if (missingError) throw missingError;

      for (const t of missingThreads || []) {
        results.push({
          thread: {
            ...t,
            forum_id: t.forum_id,
            created_at: t.created_at,
          },
          matchesInThread: false,
          replyMatches: repliesByThread[t.id] || [],
        });
      }
    }

    // -----------------------
    // RENDER
    // -----------------------
    res.render("search", {
      query: q,
      results,
      title: "search",
      formatDate: req.app.locals.formatDate,
      user: req.user || null,
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).send("Server error");
  }
});
/* ======================================================
   GET REPLY PAGE (New)
====================================================== */
forum.get("/thread/:id/reply", requireUser, async (req, res) => {
  const threadId = Number(req.params.id);

  try {
    // Fetch thread using Supabase
    const { data: thread, error } = await supabase
      .from("threads")
      .select("*")
      .eq("id", threadId)
      .single();

    if (error || !thread) return res.status(404).send("Thread not found");

    // Render the EJS template
    res.render("new-reply", {
      title: "תגובה חדשה",
      thread: {
        ...thread,
        // Ensure keys match what your EJS template expects
        forum_id: thread.forum_id,
        created_at: thread.created_at,
      },
      user: req.user || null,
    });
  } catch (err) {
    console.error("Error loading reply page:", err);
    res.status(500).send("Server error");
  }
});
/* ======================================================

   POST A REPLY
====================================================== */
forum.post("/thread/:threadId/replies", requireUser, async (req, res) => {
  const threadId = Number(req.params.threadId);
  const user = req.user;

  // Sanitize the content
  const content = sanitizeHtml(req.body.content, {
    allowedTags: ["pre", "code", "b", "i", "strong", "em", "p", "br"],
    allowedAttributes: {},
  });

  try {
    const { error } = await supabase.from("replies").insert([
      {
        thread_id: threadId,
        author: user.username || "אורח",
        content: content,
      },
    ]);

    if (error) {
      console.error("Supabase Insert Error:", error);
      return res.status(500).send("Database error: " + error.message);
    }

    // Redirect back to the same thread to see the new reply
    res.redirect(`/thread/${threadId}`);
  } catch (err) {
    console.error("Error posting reply:", err);
    res.status(500).send("Server error");
  }
});
/* ======================================================
   DELETE THREAD
====================================================== */
forum.post("/thread/:id/delete", requireUser, async (req, res) => {
  const threadId = Number(req.params.id);

  // בדיקת הרשאות
  if (req.user.username !== process.env.ADMIN_USERNAME) {
    return res.status(403).send("Forbidden");
  }

  try {
    // חשוב: מוחקים קודם את התגובות (בגלל Foreign Key)
    await supabase.from("replies").delete().eq("thread_id", threadId);
    await supabase.from("threads").delete().eq("id", threadId);

    res.redirect("/");
  } catch (err) {
    console.error("Error deleting thread:", err);
    res.status(500).send("Server error");
  }
});
/* ===========================================

   NEW POSTS (Supabase RPC)
====================================================== */
forum.get("/new-posts", requireUser, async (req, res) => {
  try {
    const { data: rows, error } = await supabase.rpc(
      "get_latest_forum_activity",
    );

    if (error) throw error;

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
      user: req.user || null,
    });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).send("Server error");
  }
});
export default forum;
