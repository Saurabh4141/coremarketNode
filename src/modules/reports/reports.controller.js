import {
  fetchLatestReports,
  fetchTrendingReports,
  fetchReports
} from "./reports.service.js";
import { writeLog } from "../../utils/writeLog.js";
import { sanitizeTitle } from "../../utils/sanitize.js";

export const getHomeReports = async (req, res) => {
  try {
    const [latestRows, trendingRows] = await Promise.all([
      fetchLatestReports(6),
      fetchTrendingReports(6),
    ]);

    const mapReport = (r) => ({
      title: sanitizeTitle(r.title),
      IndustryId: r.IndustryId,
      Description: r.Description,
      Path: r.Path?.startsWith("/") ? r.Path : `/${r.Path}`,
      prize: r.prize,
      date: r.date,
      growth: r.growth,
      market_reach: r.market_reach,
    });

    const latest = latestRows.map(mapReport);
    const trending = trendingRows.map(mapReport);

    writeLog("INFO", "Reports API prepared (latest + trending)");

    res.json({
      success: true,
      data: { latest, trending },
    });
  } catch (error) {
    writeLog("ERROR", "Reports API failed", {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
    });
  }
};


export const getReports = async (req, res) => {
  try {
    const {
      industryId,
      page = 1,
      limit = 20,
    } = req.query;

    const safeLimit = Math.min(Number(limit), 50);
    const offset = (Number(page) - 1) * safeLimit;

    const reports = await fetchReports({
      industryId: industryId ? Number(industryId) : null,
      limit: safeLimit,
      offset,
    });

    res.json({
      success: true,
      data: reports,
      pagination: {
        page: Number(page),
        limit: safeLimit,
      },
    });
  } catch (error) {
    writeLog("ERROR", "Reports API failed", {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
    });
  }
};