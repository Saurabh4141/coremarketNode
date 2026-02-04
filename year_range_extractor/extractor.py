import re
import logging
import mysql.connector
from db_config import DB_CONFIG

# ================= CONFIG =================
FETCH_SIZE = 1000
ERROR_LOG_FILE = "extractor_errors.log"

# ================= LOGGING (ERRORS ONLY) =================
logging.basicConfig(
    level=logging.ERROR,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[
        logging.FileHandler(ERROR_LOG_FILE, encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ================= HELPERS =================

def normalize_text(text: str) -> str:
    """Normalize broken dash characters."""
    return (
        text.replace("ÔÇô", "-")
            .replace("–", "-")
            .replace("—", "-")
    )

def extract_year_range(text: str):
    """
    Extract year range from text.
    Output format:
      - 2025-2035
      - -2035 (only 'by 2035')
    """
    text = normalize_text(text)

    # between 2025 and 2035
    match = re.search(r'between\s+(\d{4})\s+and\s+(\d{4})', text, re.IGNORECASE)
    if match:
        return f"{match.group(1)}-{match.group(2)}"

    # 2023 to 2030
    match = re.search(r'(\d{4})\s+to\s+(\d{4})', text, re.IGNORECASE)
    if match:
        return f"{match.group(1)}-{match.group(2)}"

    # 2025-2035
    match = re.search(r'(\d{4})-(\d{4})', text)
    if match:
        return f"{match.group(1)}-{match.group(2)}"

    # in 2023 ... by 2035
    in_match = re.search(r'in\s+(\d{4})', text, re.IGNORECASE)
    by_match = re.search(r'by\s+(\d{4})', text, re.IGNORECASE)

    if in_match and by_match:
        return f"{in_match.group(1)}-{by_match.group(1)}"

    # only by 2035
    if by_match and not in_match:
        return f"-{by_match.group(1)}"

    return None

# ================= MAIN =================

def main():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
    except Exception as e:
        logger.exception("Database connection failed")
        return

    last_id = 0

    try:
        while True:
            cursor.execute(
                """
                SELECT ReportId, ReportDesc
                FROM report_desc_master
                WHERE ReportDesc IS NOT NULL
                  AND ReportId > %s
                ORDER BY ReportId
                LIMIT %s
                """,
                (last_id, FETCH_SIZE)
            )

            rows = cursor.fetchall()
            if not rows:
                break

            for row in rows:
                report_id = row["ReportId"]
                desc = row["ReportDesc"]
                last_id = report_id

                try:
                    forecast_year = extract_year_range(desc)
                    if not forecast_year:
                        continue

                    cursor.execute(
                        """
                        UPDATE u155177299_core_reports.report_market_metrics
                        SET forecast_year = %s
                        WHERE report_id = %s
                        """,
                        (forecast_year, report_id)
                    )

                except Exception as row_err:
                    logger.error(
                        f"Failed for ReportId={report_id} | Error={row_err}"
                    )

            conn.commit()

    except Exception as e:
        logger.exception("Fatal error during processing")

    finally:
        cursor.close()
        conn.close()

# ================= ENTRY =================

if __name__ == "__main__":
    main()
