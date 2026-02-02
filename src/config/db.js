import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

/**
 * MAIN DATABASE
 * Used for CMS, blogs, users, etc.
 * DB: u155177299_coremarket
 */
export const mainDB = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * REPORT DATABASE
 * Used ONLY for reports (report_master, report_market_metrics)
 * DB: u155177299_core_reports
 */
export const reportDB = mysql.createPool({
  host: process.env.REPORT_DB_HOST,
  user: process.env.REPORT_DB_USER,
  password: process.env.REPORT_DB_PASSWORD,
  database: process.env.REPORT_DB_NAME,
  port: Number(process.env.REPORT_DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Optional: DB health check (call once at startup)
 */
export const testDBConnections = async () => {
  try {
    await mainDB.query("SELECT 1");
    console.log("✅ MAIN_DB connected");
  } catch (err) {
    console.error("❌ MAIN_DB connection failed", err.message);
  }

  try {
    await reportDB.query("SELECT 1");
    console.log("✅ REPORT_DB connected");
  } catch (err) {
    console.error("❌ REPORT_DB connection failed", err.message);
  }
};
