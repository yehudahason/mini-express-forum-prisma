import { sequelize } from "./index.js";

// import models (they should use the SAME sequelize instance)
import { User } from "./User.js";
import { Forum } from "./Forum.js";
import { Thread } from "./Thread.js";
import { Reply } from "./Reply.js";

// apply associations (your associations.js should import these models)
import "./associations.js";

export { sequelize, User, Forum, Thread, Reply };
