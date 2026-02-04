import re
import csv
import logging
import mysql.connector
from db_config import DB_CONFIG
from pathlib import Path

# ================= CONFIG =================
OUTPUT_DIR = Path("output")
BATCH_SIZE = 5000
FETCH_SIZE = 1000
LOG_FILE = "extractor.log"
NOT_FOUND_FILE = OUTPUT_DIR / "year_ranges_not_found.csv"

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
    """Normalize broken dash characters."""
    return (
        text.replace("ÔÇô", "-")
            .replace("–", "-")
            .replace("—", "-")
    )

def extract_year_range(text: str):
    """
    Extract year range from text.
    Returns (year_range, match_index)
    """
    text = normalize_text(text)

    # 1️⃣ between 2025 and 2035
    match = re.search(r'between\s+(\d{4})\s+and\s+(\d{4})', text, re.IGNORECASE)
    if match:
        return f"{match.group(1)} to {match.group(2)}", match.start()

    # 2️⃣ 2023 to 2030
    match = re.search(r'(\d{4})\s+to\s+(\d{4})', text, re.IGNORECASE)
    if match:
        return f"{match.group(1)} to {match.group(2)}", match.start()

    # 3️⃣ 2025-2035
    match = re.search(r'(\d{4})-(\d{4})', text)
    if match:
        return f"{match.group(1)} to {match.group(2)}", match.start()

    # 4️⃣ in 2023 ... by 2035
    in_match = re.search(r'in\s+(\d{4})', text, re.IGNORECASE)
    by_match = re.search(r'by\s+(\d{4})', text, re.IGNORECASE)

    if in_match and by_match:
        return f"{in_match.group(1)} to {by_match.group(1)}", in_match.start()

    # 5️⃣ ONLY by 2035 (fallback)
    if by_match and not in_match:
        return f"to {by_match.group(1)}", by_match.start()

    return None, None

def get_snippet(text: str, index: int) -> str:
    """Extract 50–100 chars around the matched year."""
    start = max(index - 50, 0)
    end = min(index + 100, len(text))
    return text[start:end].strip()

def write_found_file(file_number: int, rows: list):
    file_path = OUTPUT_DIR / f"year_ranges_{file_number}.csv"
    with open(file_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["ReportId", "YearRange", "Context"])
        writer.writerows(rows)
    logger.info(f"Created {file_path} with {len(rows)} records")

def append_not_found(rows: list):
    file_exists = NOT_FOUND_FILE.exists()
    with open(NOT_FOUND_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["ReportId"])
        writer.writerows([[r] for r in rows])

# ================= MAIN =================

def main():
    logger.info("===== Year Range Extraction Started =====")
    OUTPUT_DIR.mkdir(exist_ok=True)

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        logger.info("Database connection successful")
    except Exception:
        logger.exception("Database connection failed")
        return

    last_id = 0
    total_processed = 0
    total_matched = 0
    total_not_found = 0

    file_count = 1
    found_rows = []
    not_found_ids = []

    while True:
        query = """
            SELECT ReportId, ReportDesc
            FROM report_desc_master
            WHERE ReportDesc IS NOT NULL
              AND ReportId > %s
            ORDER BY ReportId
            LIMIT %s
        """
        cursor.execute(query, (last_id, FETCH_SIZE))
        rows = cursor.fetchall()

        if not rows:
            break

        for row in rows:
            total_processed += 1
            report_id = row["ReportId"]
            desc = row["ReportDesc"]
            last_id = report_id

            year_range, idx = extract_year_range(desc)

            if not year_range:
                not_found_ids.append(report_id)
                total_not_found += 1

                if len(not_found_ids) >= BATCH_SIZE:
                    append_not_found(not_found_ids)
                    not_found_ids.clear()
                continue

            found_rows.append([
                report_id,
                year_range,
                get_snippet(desc, idx)
            ])
            total_matched += 1

            if len(found_rows) >= BATCH_SIZE:
                write_found_file(file_count, found_rows)
                file_count += 1
                found_rows.clear()

        logger.info(
            f"Processed up to ReportId={last_id} | "
            f"Processed={total_processed} | "
            f"Matched={total_matched} | "
            f"NotFound={total_not_found}"
        )

    if found_rows:
        write_found_file(file_count, found_rows)

    if not_found_ids:
        append_not_found(not_found_ids)

    cursor.close()
    conn.close()

    logger.info("===== Extraction Completed =====")
    logger.info(f"Total processed : {total_processed}")
    logger.info(f"Total matched   : {total_matched}")
    logger.info(f"Total not found : {total_not_found}")
    logger.info(f"Total files created : {file_count}")

# ================= ENTRY =================

if __name__ == "__main__":
    main()
