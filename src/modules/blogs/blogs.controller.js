import { fetchLatestBlogs } from "./blogs.service.js";
import { writeLog } from "../../utils/writeLog.js";

export const getLatestBlogs = async (req, res) => {
  try {
    const blogs = await fetchLatestBlogs(4);

    writeLog("INFO", "Latest blogs API called");

    res.json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    writeLog("ERROR", "Failed to fetch latest blogs", {
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
    });
  }
};
