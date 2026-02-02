import fs from "fs";
import path from "path";

export const writeLog = (level, message, meta = null) => {
  const now = new Date();

  const displayDate = now.toLocaleDateString("en-GB").replace(/\//g, "-");
  const time = now.toLocaleTimeString("en-GB");
  const fileDate = now.toISOString().split("T")[0];

  const stack = new Error().stack?.split("\n")[3] || "";
  const match = stack.match(/\((.*):(\d+):(\d+)\)/);

  const filePath = match ? match[1].replace(process.cwd(), "") : "unknown";
  const lineNo = match ? match[2] : "0";

  let logLine = `${displayDate} ${time} | ${level.toUpperCase()} | ${filePath}:${lineNo} | ${message}`;

  // ---- CONSOLE OUTPUT ----
  if (level === "ERROR") {
    console.error(logLine);
    if (meta) console.error("META:", meta);
  } else if (level === "WARN") {
    console.warn(logLine);
    if (meta) console.warn("META:", meta);
  } else {
    console.log(logLine);
    if (meta) console.log("META:", meta);
  }

  // ---- FILE OUTPUT ----
  if (process.env.ENABLE_FILE_LOGS === "true") {
    const logDir = path.join(process.cwd(), "logs");

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const filePathFull = path.join(logDir, `app-${fileDate}.log`);

    let fileLog = logLine;

    if (meta) {
      fileLog += `\nMETA:\n${JSON.stringify(meta, null, 2)}`;
    }

    fileLog += "\n----------------------------------------\n";

    fs.appendFileSync(filePathFull, fileLog, "utf8");
  }
};
