"""
Extract plant/month consumption from NLC material movement PDF exports.
Supports raw movement logs (parsed & aggregated) and pre-aggregated tables.
"""

import re
from collections import defaultdict
from datetime import datetime

import pandas as pd
import pdfplumber

# Movement log line: Plant ... Amount Qty KG ... EntryDate PostingDate
MOVEMENT_LINE_RE = re.compile(
    r"^(M00[12])\s+\S+\s+\S+\s+\S+\s+"
    r"([-]?[\d,]+\.\d{2})\s+"
    r"([-]?[\d,]+(?:\.\d+)?)\s+KG\s+"
    r".+\s+"
    r"(\d{1,2}/\d{1,2}/\d{4})\s+(\d{1,2}/\d{1,2}/\d{4})\s*$"
)

AGG_COLUMN_MAP = {
    "plant": ("plant",),
    "month_year": ("month_year", "month", "period", "monthyear"),
    "total_qty": ("total_qty", "total_qty_kg", "totalqty", "quantity", "qty"),
    "total_amount": ("total_amount", "total_amount_inr", "totalamount", "amount", "amt.in_loc.cur."),
    "records": ("records", "record_count", "count"),
}


def _parse_number(value) -> float:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return float("nan")
    text = str(value).strip().replace(",", "")
    if not text or text in ("-", "—"):
        return float("nan")
    return float(text)


def _month_key_from_value(value: str) -> str:
    text = str(value).strip()
    for fmt in ("%Y-%m", "%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%b-%Y", "%B-%Y"):
        try:
            return datetime.strptime(text, fmt).strftime("%Y-%m")
        except ValueError:
            continue
    if re.match(r"^\d{4}-\d{2}$", text):
        return text
    raise ValueError(f"Could not parse month/year value: {value}")


def _table_to_dataframe(table: list[list]) -> pd.DataFrame | None:
    if not table or len(table) < 2:
        return None
    header = [str(c or "").strip() for c in table[0]]
    if not any(h.lower().startswith("plant") for h in header):
        return None
    rows = []
    for raw in table[1:]:
        if not raw or not any(cell for cell in raw):
            continue
        row = {header[i]: raw[i] if i < len(raw) else None for i in range(len(header))}
        rows.append(row)
    if not rows:
        return None
    return pd.DataFrame(rows)


def _normalize_agg_frame(df: pd.DataFrame) -> pd.DataFrame:
    rename = {}
    lower_cols = {c: str(c).strip().lower().replace(" ", "_") for c in df.columns}
    for canonical, aliases in AGG_COLUMN_MAP.items():
        for col, lowered in lower_cols.items():
            if lowered in aliases or any(a in lowered for a in aliases):
                rename[col] = canonical
                break
    df = df.rename(columns=rename)
    required = ("plant", "month_year", "total_qty", "total_amount")
    if any(c not in df.columns for c in required):
        return None
    df["plant"] = df["plant"].astype(str).str.strip().str.upper()
    df["month_year"] = df["month_year"].apply(_month_key_from_value)
    df["total_qty"] = df["total_qty"].apply(_parse_number)
    df["total_amount"] = df["total_amount"].apply(_parse_number)
    if "records" not in df.columns:
        df["records"] = 1
    else:
        df["records"] = pd.to_numeric(df["records"], errors="coerce").fillna(1).astype(int)
    df = df.dropna(subset=["total_qty", "total_amount"])
    return df if not df.empty else None


def _extract_aggregated_tables(file_path: str) -> pd.DataFrame | None:
    frames = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables() or []:
                frame = _table_to_dataframe(table)
                if frame is None:
                    continue
                normalized = _normalize_agg_frame(frame)
                if normalized is not None:
                    frames.append(normalized)
    if not frames:
        return None
    combined = pd.concat(frames, ignore_index=True)
    combined = (
        combined.groupby(["plant", "month_year"], as_index=False)
        .agg(total_qty=("total_qty", "sum"), total_amount=("total_amount", "sum"), records=("records", "sum"))
    )
    return combined


def _parse_movement_lines(file_path: str) -> tuple[pd.DataFrame, int]:
    buckets: dict[tuple[str, str], dict] = defaultdict(
        lambda: {"total_qty": 0.0, "total_amount": 0.0, "records": 0}
    )
    parsed_count = 0
    skipped = 0

    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            for line in text.split("\n"):
                line = line.strip()
                if not line.startswith(("M001", "M002")):
                    continue
                match = MOVEMENT_LINE_RE.match(line)
                if not match:
                    skipped += 1
                    continue
                plant, amount, qty, _entry, posting = match.groups()
                month_year = datetime.strptime(posting, "%m/%d/%Y").strftime("%Y-%m")
                key = (plant, month_year)
                buckets[key]["total_qty"] += abs(_parse_number(qty))
                buckets[key]["total_amount"] += abs(_parse_number(amount))
                buckets[key]["records"] += 1
                parsed_count += 1

    if parsed_count == 0:
        raise ValueError(
            "Could not read material movement rows from the PDF. "
            "Ensure it is an NLC movement export with M001/M002 lines, "
            "or upload a CSV/Excel file with Plant, Month_Year, Total_Qty, Total_Amount."
        )

    rows = [
        {
            "plant": plant,
            "month_year": month_year,
            "total_qty": round(data["total_qty"], 2),
            "total_amount": round(data["total_amount"], 2),
            "records": int(data["records"]),
        }
        for (plant, month_year), data in sorted(buckets.items())
    ]
    df = pd.DataFrame(rows)
    df.attrs["pdf_transactions_parsed"] = parsed_count
    df.attrs["pdf_lines_skipped"] = skipped
    return df, parsed_count


def read_pdf_to_dataframe(file_path: str) -> tuple[pd.DataFrame, dict]:
    """
    Returns (dataframe, metadata) ready for the forecasting pipeline.
    """
    aggregated = _extract_aggregated_tables(file_path)
    if aggregated is not None and not aggregated.empty:
        plants = set(aggregated["plant"].unique())
        if {"M001", "M002"}.issubset(plants) or len(aggregated) >= 4:
            meta = {
                "format": "pdf",
                "parse_mode": "aggregated_table",
                "rows": int(len(aggregated)),
            }
            return aggregated, meta

    df, parsed_count = _parse_movement_lines(file_path)
    meta = {
        "format": "pdf",
        "parse_mode": "movement_log",
        "transactions_parsed": parsed_count,
        "monthly_rows": int(len(df)),
        "lines_skipped": int(df.attrs.get("pdf_lines_skipped", 0)),
        "message": (
            f"Parsed {parsed_count} PDF movement lines into "
            f"{len(df)} monthly plant records."
        ),
    }
    return df, meta
