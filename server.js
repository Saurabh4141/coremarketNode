import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import { writeLog } from "./src/utils/writeLog.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  writeLog("INFO", `Server started on port ${PORT}`);
});
