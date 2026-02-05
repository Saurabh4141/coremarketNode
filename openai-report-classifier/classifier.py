import mysql.connector
import logging
import json
from openai import OpenAI
from dotenv import load_dotenv
import os
import sys

# ==================================================
# LOAD ENV
# ==================================================

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

SOURCE_DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
}

TARGET_DB_CONFIG = {
    "host": os.getenv("TARGET_DB_HOST"),
    "user": os.getenv("TARGET_DB_USER"),
    "password": os.getenv("TARGET_DB_PASSWORD"),
    "database": os.getenv("TARGET_DB_NAME"),
}

INDUSTRY_IDS = [int(x) for x in os.getenv("INDUSTRY_IDS", "").split(",") if x]
LIMIT = int(os.getenv("LIMIT", "1"))

INDUSTRY_NAME = os.getenv("INDUSTRY_NAME")

SUB_INDUSTRIES = [
    x.strip()
    for x in os.getenv("SUB_INDUSTRIES", "").split("|")
    if x.strip()
]

# ==================================================
# SAFETY CHECKS
# ==================================================

if not OPENAI_API_KEY:
    sys.exit("OPENAI_API_KEY missing")

if not INDUSTRY_IDS:
    sys.exit("INDUSTRY_IDS missing")

if not INDUSTRY_NAME or not SUB_INDUSTRIES:
    sys.exit("Industry config missing")

# ==================================================
# LOGGING
# ==================================================

os.makedirs("logs", exist_ok=True)

logging.basicConfig(
    filename="logs/debug.log",
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

error_logger = logging.getLogger("error")
error_handler = logging.FileHandler("logs/error.log")
error_handler.setLevel(logging.ERROR)
error_logger.addHandler(error_handler)

logging.debug("===== JOB STARTED =====")

# ==================================================
# HELPERS
# ==================================================

def normalize_title(title: str) -> str:
    if not title:
        return ""
    clean = title.split("|")[0].strip()
    if "market" not in clean.lower():
        clean = f"{clean} Market Analysis"
    return clean

# ==================================================
# OPENAI
# ==================================================

client = OpenAI(api_key=OPENAI_API_KEY)

SYSTEM_PROMPT = """
You are a market research taxonomy classifier.

RULES:
- Choose ONLY from provided sub-industries.
- DO NOT invent anything.
- If unsure, return NOT_FOUND.
- Output valid JSON only.
"""

def classify_report(title: str) -> dict:
    title = normalize_title(title)

    prompt = f"""
Report Title:
"{title}"

Industry: {INDUSTRY_NAME}
Sub-Industries: {", ".join(SUB_INDUSTRIES)}

Return JSON:
{{
  "industry": "",
  "sub_industry": "",
  "confidence": ""
}}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        temperature=0,
        response_format={"type": "json_object"}
    )

    return json.loads(response.choices[0].message.content)

# ==================================================
# SOURCE DB
# ==================================================

def fetch_reports():
    try:
        conn = mysql.connector.connect(**SOURCE_DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        query = f"""
        SELECT Id, Name, Path
        FROM report_master
        WHERE isFetched = false
        AND IndustryId IN ({",".join(map(str, INDUSTRY_IDS))})
        ORDER BY Id DESC
        LIMIT {LIMIT}
        """

        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return rows

    except Exception:
        error_logger.error("SOURCE DB ERROR", exc_info=True)
        return []

def fetch_report_desc(report_id):
    try:
        conn = mysql.connector.connect(**SOURCE_DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT ReportId, Keywords, Title
            FROM report_desc_master
            WHERE ReportId = %s
            """,
            (report_id,)
        )

        row = cursor.fetchone()
        cursor.close()
        conn.close()
        return row

    except Exception:
        error_logger.error("DESC FETCH ERROR", exc_info=True)
        return None

# ==================================================
# TARGET DB LOOKUPS
# ==================================================

def get_industry_id(cursor, industry_name):
    cursor.execute(
        """
        SELECT Id FROM industries_master
        WHERE LOWER(name) = LOWER(%s)
        LIMIT 1
        """,
        (industry_name,)
    )
    row = cursor.fetchone()
    return row[0] if row else None

def get_sub_industry_id(cursor, sub_industry_name):
    cursor.execute(
        """
        SELECT Id, industry_id FROM sub_industries_master
        WHERE LOWER(name) = LOWER(%s)
        LIMIT 1
        """,
        (sub_industry_name,)
    )
    row = cursor.fetchone()
    return (row[0], row[1]) if row else (None, None)

def check_report_exists_by_name(cursor, name):
    cursor.execute(
        """
        SELECT Id FROM report_master
        WHERE LOWER(name) = LOWER(%s)
        LIMIT 1
        """,
        (name,)
    )
    return cursor.fetchone() is not None

# ==================================================
# INSERT TARGET
# ==================================================

def insert_into_target(ref_report_id, industry_id, sub_industry_id, name, description, slug):
    conn = mysql.connector.connect(**TARGET_DB_CONFIG)
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO report_master
        (ref_report_id, industry_id, sub_industry_id, name, description, slug)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (ref_report_id, industry_id, sub_industry_id, name, description, slug)
    )

    conn.commit()
    cursor.close()
    conn.close()


def mark_report_as_fetched(report_id):
    try:
        conn = mysql.connector.connect(**SOURCE_DB_CONFIG)
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE report_master
            SET isFetched = true
            WHERE Id = %s
            """,
            (report_id,)
        )

        conn.commit()
        cursor.close()
        conn.close()

        logging.debug(f"Marked report {report_id} as fetched")

    except Exception:
        error_logger.error(
            f"FAILED TO UPDATE isFetched FOR REPORT {report_id}",
            exc_info=True
        )


# ==================================================
# MAIN
# ==================================================

def main():
    reports = fetch_reports()

    if not reports:
        logging.debug("No reports to process")
        return

    target_conn = mysql.connector.connect(**TARGET_DB_CONFIG)
    target_cursor = target_conn.cursor()

    for r in reports:
        rid = r["Id"]
        clean_name = normalize_title(r["Name"])
        report_slug = r["Path"]

        logging.debug(f"Processing {rid} | {clean_name}")

        try:
            result = classify_report(clean_name)

            if result["industry"] == "NOT_FOUND":
                with open("logs/not_found.log", "a", encoding="utf-8") as f:
                    f.write(f"{rid}, {clean_name}\n")
                continue

            industry_id = get_industry_id(target_cursor, INDUSTRY_NAME)
            sub_id, _ = get_sub_industry_id(
                target_cursor, result["sub_industry"]
            )

            if not industry_id or not sub_id:
                logging.debug(f"Industry/SubIndustry not found in TARGET DB for {rid}")
                continue

            desc = fetch_report_desc(rid)
            if not desc:
                continue

            report_name_to_insert = desc["Keywords"]

            # 🔐 DUPLICATE CHECK
            if check_report_exists_by_name(target_cursor, report_name_to_insert):
                with open("logs/classified.log", "a", encoding="utf-8") as f:
                    f.write(
                        f"{rid}, {clean_name} => SKIPPED_DUPLICATE ({report_name_to_insert})\n"
                    )
                continue

            insert_into_target(
                ref_report_id=rid,
                industry_id=industry_id,
                sub_industry_id=sub_id,
                name=report_name_to_insert,
                description=desc["Title"],
                slug=report_slug,
            )

            with open("logs/classified.log", "a", encoding="utf-8") as f:
                f.write(
                    f"{rid}, {clean_name} => {INDUSTRY_NAME} / {result['sub_industry']} ({result['confidence']})\n"
                )

            # SOURCE UPDATE 
            mark_report_as_fetched(rid)

        except Exception:
            error_logger.error(f"PROCESS ERROR {rid}", exc_info=True)

    target_cursor.close()
    target_conn.close()
    logging.debug("===== JOB FINISHED =====")

# ==================================================
# RUN
# ==================================================

if __name__ == "__main__":
    main()
