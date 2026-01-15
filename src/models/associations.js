import { Forum } from "./Forum.js";
import { Thread } from "./Thread.js";
import { Reply } from "./Reply.js";
import { User } from "./User.js";

// Forum has many threads
Forum.hasMany(Thread, {
  foreignKey: "forum_id",
  onDelete: "CASCADE",
});

// Thread belongs to a forum
Thread.belongsTo(Forum, {
  foreignKey: "forum_id",
});

// Thread has many replies
Thread.hasMany(Reply, {
  foreignKey: "thread_id",
  onDelete: "CASCADE",
});

// Reply belongs to a thread
Reply.belongsTo(Thread, {
  foreignKey: "thread_id",
});

export { Forum, Thread, Reply, User };
