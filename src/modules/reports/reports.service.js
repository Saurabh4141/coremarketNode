import {reportDB} from "../../config/db.js";
import { writeLog } from "../../utils/writeLog.js";

/**
 * Latest reports (by date)
 */
export const fetchLatestReports = async (limit = 6) => {
  try {
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 6;

    const [rows] = await reportDB.query(
      `
      SELECT
        rm.Id,
        rm.Name AS title,
        rm.IndustryId,
        rm.Description,
        rm.Path,
        rm.Single_User_Prize AS prize,
        DATE_FORMAT(
          COALESCE(rm.UpdateAt, rm.CreateAt),
          '%b %Y'
        ) AS date,
        rmm.cagr AS growth,
        rmm.market_reach
      FROM report_master rm
      LEFT JOIN report_market_metrics rmm
        ON rmm.report_id = rm.Id
      WHERE rm.IsActive = b'1'
      ORDER BY COALESCE(rm.UpdateAt, rm.CreateAt) DESC
      LIMIT ${safeLimit}
      `,
    );

    writeLog("INFO", "Latest reports fetched");

    return rows;
  } catch (error) {
    writeLog("ERROR", "Failed to fetch latest reports", {
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
    throw error;
  }
};

/**
 * Trending reports (by highest CAGR)
 */
export const fetchTrendingReports = async (limit = 6) => {
  try {
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 6;

    const [rows] = await reportDB.query(
      `
      SELECT
        rm.Id,
        rm.Name AS title,
        rm.IndustryId,
        rm.Description,
        rm.Path,
        rm.Single_User_Prize AS prize,
        DATE_FORMAT(
          COALESCE(rm.UpdateAt, rm.CreateAt),
          '%b %Y'
        ) AS date,
        rmm.cagr AS growth,
        rmm.market_reach,
        CAST(
          NULLIF(
            REPLACE(REPLACE(TRIM(rmm.cagr), '%', ''), '+', ''),
            ''
          ) AS DECIMAL(10,2)
        ) AS cagr_value
      FROM report_master rm
      INNER JOIN report_market_metrics rmm
        ON rmm.report_id = rm.Id
      WHERE
        rm.IsActive = b'1'
        AND rmm.cagr IS NOT NULL
        AND rmm.cagr != ''
        AND rmm.cagr REGEXP '^[+]?([0-9]+(\\.[0-9]+)?)%'
      ORDER BY cagr_value DESC
      LIMIT ${safeLimit}
      `,
    );

    writeLog("INFO", "Trending reports fetched by CAGR");

    return rows;
  } catch (error) {
    writeLog("ERROR", "Failed to fetch trending reports", {
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
    throw error;
  }
};
