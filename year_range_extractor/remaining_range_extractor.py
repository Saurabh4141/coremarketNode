import re
import logging
import mysql.connector
from db_config import DB_CONFIG

# ================= CONFIG =================
ERROR_LOG_FILE = "remaining_extractor_errors.log"

REPORT_IDS = [
    4390,5231,5784,6926,7992,8499,9674,12023,12082,12270,
    13712,14185,15336,15738,17445,18044,18673,19061,20359,
    20923,21454,27014,27016,30204,30345,32449,34172,35583,
    37345,37660,38488,39887,40648,44829,46595,48529,50684,
    54060,58621,59045,59197,59351,60630,60959,61214,61842,
    63270,63369,63742,63789,63954,64501,65465,65513,66426,
    66739,67007,67021,67884
]

# ================= LOGGING (ERROR ONLY) =================
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
    return (
        text.replace("ÔÇô", "-")
            .replace("–", "-")
            .replace("—", "-")
    )

def extract_through_range(text: str):
    """
    Handles:
    - in 2023 ... through 2035
    - As of 2023 ... through 2033

    Returns:
    - 2023-2035
    """
    text = normalize_text(text)

    in_match = re.search(r'in\s+(\d{4})', text, re.IGNORECASE)
    through_match = re.search(r'through\s+(\d{4})', text, re.IGNORECASE)

    if in_match and through_match:
        return f"{in_match.group(1)}-{through_match.group(1)}"

    return None

# ================= MAIN =================

def main():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
    except Exception:
        logger.exception("Database connection failed")
        return

    try:
        for report_id in REPORT_IDS:
            try:
                cursor.execute(
                    """
                    SELECT ReportDesc
                    FROM report_desc_master
                    WHERE ReportId = %s
                    """,
                    (report_id,)
                )
                row = cursor.fetchone()

                if not row or not row["ReportDesc"]:
                    continue

                forecast_year = extract_through_range(row["ReportDesc"])
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

    except Exception:
        logger.exception("Fatal error during remaining forecast update")

    finally:
        cursor.close()
        conn.close()

# ================= ENTRY =================

if __name__ == "__main__":
    main()
