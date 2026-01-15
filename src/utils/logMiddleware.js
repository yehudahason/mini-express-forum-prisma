// logMiddleware.js
// export function logRequests(req, res, next) {
//   const ip =
//     req.headers["x-forwarded-for"]?.split(",")[0] ||
//     req.socket.remoteAddress ||
//     "unknown";

//   const origin = req.headers.origin || "no-origin";
//   const host = req.headers.host || "no-host";
//   const date = new Date();

//   console.log(
//     `${date.toLocaleString("he-IL", {
//       timeZone: "Asia/Jerusalem",
//     })} | IP: ${ip} | Origin: ${origin} | Host: ${host} | ${req.method} ${
//       req.originalUrl
//     }`
//   );

//   next();
// }

import fs from "fs";
import path from "path";
import fsPromises from "fs/promises";

export async function logRequests(req, res, next) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown";

  const origin = req.headers.origin || "no-origin";
  const host = req.headers.host || "no-host";
  const date = new Date().toLocaleString("he-IL", {
    timeZone: "Asia/Jerusalem",
  });

  const logLine = `${date} | IP: ${ip} | Origin: ${origin} | Host: ${host} | ${req.method} ${req.originalUrl}\n`;

  // 1. Print to console
  // console.log(logLine);

  // 2. Append to local file (create folder logs/ if missing)
  const logPath = path.join(process.cwd(), "logs", "requests.log");

  try {
    // Ensure directory exists (sync is fine here)
    fs.mkdirSync(path.dirname(logPath), { recursive: true });

    // Append line asynchronously
    await fsPromises.appendFile(logPath, logLine);
  } catch (err) {
    console.error("❌ Error writing to log file:", err);
  }

  next();
}
