import { mainDB } from "../../config/db.js";
import { writeLog } from "../../utils/writeLog.js";

/**
 * Fetch all active industries
 */
export const fetchIndustries = async () => {
  try {
    const [rows] = await mainDB.execute(
      `
      SELECT
        Id,
        Rephrased_Name AS title,
        Path,
        description,
        marketSize,
        growthRate,
        topPlayers,
        Color AS color,
        overview,
        Icon
      FROM industries_master
      WHERE IsActive = ?
      ORDER BY Rephrased_Name ASC
      `,
      [1] 
    );

    return rows.map((row) => ({
      Id: row.Id,
      title: row.title,
      slug: row.Path.replace("industry/", ""),
      description: row.description,
      href: `/${row.Path}`,
      marketSize: row.marketSize,
      growthRate: row.growthRate,
      overview: row.overview,
      color: row.color,
      iconKey: row.Icon, 
      topPlayers: row.topPlayers
        ? row.topPlayers.split(",").map((p) => p.trim())
        : [],
    }));
  } catch (error) {
    writeLog("ERROR", "Failed to fetch industries", {
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
    throw error;
  }
};
