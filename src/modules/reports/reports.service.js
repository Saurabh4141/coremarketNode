import { reportDB } from "../../config/db.js";
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

/**
 * Fetch reports
 */
export const fetchReports = async ({
  industryId = null,
  limit = 20,
  offset = 0,
}) => {
  try {
    let sql = `
      SELECT
        rm.Id,
        rm.IndustryId,
        rm.Name,
        rm.Path,
        rm.Single_User_Prize,
        DATE_FORMAT(
          COALESCE(rm.UpdateAt, rm.CreateAt),
          '%b %Y'
        ) AS date,
        rmm.cagr AS growth,
        rmm.market_reach
      FROM report_master rm
      LEFT JOIN report_market_metrics rmm
        ON rmm.report_id = rm.Id
      WHERE rm.IsActive = ?
    `;

    const params = [1];

    if (industryId) {
      sql += ` AND rm.IndustryId = ?`;
      params.push(industryId);
    }

    sql += `
      ORDER BY COALESCE(rm.UpdateAt, rm.CreateAt) DESC
      LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), Number(offset));

    const [rows] = await reportDB.execute(sql, params);

    writeLog("INFO", "Reports fetched with market metrics", {
      industryId,
      limit,
      offset,
    });

    return rows.map((row) => ({
      IndustryId: row.IndustryId,
      title: sanitizeReportTitle(row.Name),
      slug: `/${row.Path}`,
      date: row.date,
      growth: normalizeCagr(row.growth),
      market_reach: row.market_reach,
      pages: 230, // future column
      price: formatPrice(row.Single_User_Prize),
    }));
  } catch (error) {
    writeLog("ERROR", "Failed to fetch reports", {
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
    throw error;
  }
};

/**
 * Fetch related reports by IndustryId
 */
export const fetchRelatedReports = async ({
  industryId,
  excludeReportId = null,
  limit = 3,
}) => {
  try {
    let sql = `
      SELECT
        Id,
        Name,
        Description,
        ImagePath,
        Path
      FROM report_master
      WHERE
        IndustryId = ?
        AND IsActive = b'1'
    `;

    const params = [industryId];

    if (excludeReportId) {
      sql += ` AND Id != ?`;
      params.push(excludeReportId);
    }

    sql += `
      ORDER BY CreateAt DESC
      LIMIT ?
    `;

    params.push(Number(limit));

    const [rows] = await reportDB.execute(sql, params);

    writeLog("INFO", "Related reports fetched", {
      industryId,
      excludeReportId,
      count: rows.length,
    });

    return rows.map((row) => ({
      slug: `/${row.Path}`,
      title: sanitizeReportTitle(row.Name),
      description: row.Description,
      image: row.ImagePath ? `/${row.ImagePath}` : "/placeholder.svg",
    }));
  } catch (error) {
    writeLog("ERROR", "Failed to fetch related reports", {
      industryId,
      excludeReportId,
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
    throw error;
  }
};

/* ================= HELPERS ================= */

const sanitizeReportTitle = (title = "") => {
  let clean = title.trim();
  clean = clean.replace(/^["']|["']$/g, "");

  if (clean.includes("|")) {
    clean = clean.split("|")[0].trim();
  }

  return clean.replace(/\.$/, "");
};

const normalizeCagr = (cagr) => {
  if (!cagr) return null;

  let value = cagr.trim();

  // Ensure + sign
  if (!value.startsWith("+") && !value.startsWith("-")) {
    value = `+${value}`;
  }

  // Ensure % sign
  if (!value.includes("%")) {
    value = `${value}%`;
  }

  return value;
};

const formatPrice = (price) => {
  if (!price) return null;
  return `$${Number(price).toLocaleString("en-US")}`;
};
