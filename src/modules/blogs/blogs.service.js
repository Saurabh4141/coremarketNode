import { mainDB } from "../../config/db.js";
import { writeLog } from "../../utils/writeLog.js";

export const fetchLatestBlogs = async (limit = 4) => {
  try {
    // MariaDB-safe LIMIT handling
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 4;

    const [rows] = await mainDB.query(
      `
        SELECT 
          bm.id,
          bm.title,
          bm.slug,
          bm.category,
          bm.author_name AS author,
          bm.excerpt,
          bm.publish_date AS date,
          bm.read_time AS readTime,
          bm.featured_image AS image,
          bm.created_at,
          CASE 
            WHEN bm.id = (
              SELECT id 
              FROM blog_master 
              ORDER BY created_at DESC 
              LIMIT 1
            )
            THEN TRUE
            ELSE FALSE
          END AS featured
        FROM blog_master bm
        ORDER BY bm.created_at DESC
        LIMIT ${safeLimit}
        `,
    );

    writeLog("INFO", `Latest ${safeLimit} blogs fetched`);

    return rows;
  } catch (error) {
    writeLog("ERROR", "Failed to fetch latest blogs", {
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
    throw error;
  }
};
