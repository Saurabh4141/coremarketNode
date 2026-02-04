import re
import csv
import logging
import mysql.connector
from db_config import DB_CONFIG
from pathlib import Path

# ================= CONFIG =================
OUTPUT_DIR = Path("output")
OUTPUT_DIR.mkdir(exist_ok=True)

RANGE_FILE = OUTPUT_DIR / "remaining-ranges.csv"
NOT_FOUND_FILE = OUTPUT_DIR / "remaining-not-found.csv"
LOG_FILE = "remaining_extractor.log"

REPORT_IDS = [4390,5231,5784,6926,7992,8499,9674,12023,12082,12270,13712,14185,15336,15738,17445,18044,18673,19061,20359,20923,21454,27014,27016,30204,30345,32449,34172,35583,37345,37660,38488,39887,40648,44829,46595,48529,50684,54060,58621,59045,59197,59351,60630,60959,61214,61842,63270,63369,63742,63789,63954,64501,65465,65513,66426,66739,67007,67021,67884]

# ================= LOGGING =================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
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
    """
    text = normalize_text(text)

    in_match = re.search(r'in\s+(\d{4})', text, re.IGNORECASE)
    through_match = re.search(r'through\s+(\d{4})', text, re.IGNORECASE)

    if in_match and through_match:
        return f"{in_match.group(1)} to {through_match.group(1)}", in_match.start()

    return None, None

def get_snippet(text: str, index: int) -> str:
    start = max(index - 50, 0)
    end = min(index + 100, len(text))
    return text[start:end].strip()

# ================= MAIN =================

def main():
    logger.info("===== Remaining Range Extraction Started =====")

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        logger.info("Database connection successful")
    except Exception:
        logger.exception("Database connection failed")
        return

    # Prepare CSV writers
    range_exists = RANGE_FILE.exists()
    not_found_exists = NOT_FOUND_FILE.exists()

    range_f = open(RANGE_FILE, "a", newline="", encoding="utf-8")
    not_found_f = open(NOT_FOUND_FILE, "a", newline="", encoding="utf-8")

    range_writer = csv.writer(range_f)
    not_found_writer = csv.writer(not_found_f)

    if not range_exists:
        range_writer.writerow(["ReportId", "YearRange", "Context"])

    if not not_found_exists:
        not_found_writer.writerow(["ReportId"])

    query = """
        SELECT ReportId, ReportDesc
        FROM report_desc_master
        WHERE ReportId = %s
    """

    found = 0
    not_found = 0

    for report_id in REPORT_IDS:
        cursor.execute(query, (report_id,))
        row = cursor.fetchone()

        if not row or not row["ReportDesc"]:
            not_found_writer.writerow([report_id])
            not_found += 1
            continue

        desc = row["ReportDesc"]
        year_range, idx = extract_through_range(desc)

        if not year_range:
            not_found_writer.writerow([report_id])
            not_found += 1
            continue

        range_writer.writerow([
            report_id,
            year_range,
            get_snippet(desc, idx)
        ])
        found += 1

    range_f.close()
    not_found_f.close()
    cursor.close()
    conn.close()

    logger.info("===== Extraction Completed =====")
    logger.info(f"Matched     : {found}")
    logger.info(f"Not Found   : {not_found}")

# ================= ENTRY =================

if __name__ == "__main__":
    main()
