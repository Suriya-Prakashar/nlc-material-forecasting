"""
Material demand forecasting — ported from FINAL OUTPUT CHANGE 111.ipynb
ARIMA forecasts per plant (M001, M002) and 6-month budget projection.
"""

import os
import pandas as pd
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
from app.utils.pdf_reader import read_pdf_to_dataframe
import warnings

warnings.filterwarnings("ignore")

FORECAST_STEPS = 6
PLANT_CODES = ("M001", "M002")
PLANT_NAMES = {"M001": "Mine I", "M002": "Mine II"}

COLUMN_ALIASES = {
    "plant": ("plant",),
    "month_year": ("month_year", "month", "monthyear", "period", "date"),
    "total_qty": (
        "total_qty",
        "total_qty_kg",
        "totalqty",
        "totalqty_kg",
        "quantity",
        "qty",
        "total_quantity",
    ),
    "total_amount": (
        "total_amount",
        "total_amount_inr",
        "totalamount",
        "totalamount_inr",
        "amount",
        "total_cost",
        "cost",
    ),
    "records": ("records", "record_count", "count"),
}


def _load_dataframe(file_path: str) -> tuple[pd.DataFrame, dict | None]:
    _, ext = os.path.splitext(file_path)
    ext = ext.lower()
    if ext == ".csv":
        return pd.read_csv(file_path), {"format": "csv"}
    if ext in (".xls", ".xlsx"):
        return pd.read_excel(file_path), {"format": "excel"}
    if ext == ".pdf":
        df, meta = read_pdf_to_dataframe(file_path)
        return df, meta
    raise ValueError(
        "Unsupported file format. Please upload CSV, Excel (.xlsx/.xls), or PDF."
    )


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    rename = {}
    lower_cols = {c: str(c).strip().lower().replace(" ", "_") for c in df.columns}
    for canonical, aliases in COLUMN_ALIASES.items():
        for col, lowered in lower_cols.items():
            if lowered in aliases:
                rename[col] = canonical
                break
    df = df.rename(columns=rename)
    required = ("plant", "month_year", "total_qty", "total_amount")
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(
            "Dataset must include: Plant, Month_Year, Total_Qty_KG (or Total_Qty), "
            "Total_Amount_INR (or Total_Amount). "
            f"Missing: {', '.join(missing)}"
        )
    if "records" not in df.columns:
        df["records"] = 1
    df["plant"] = df["plant"].astype(str).str.strip().str.upper()
    df["total_qty"] = pd.to_numeric(df["total_qty"], errors="coerce")
    df["total_amount"] = pd.to_numeric(df["total_amount"], errors="coerce")
    df = df.dropna(subset=["total_qty", "total_amount"])
    if df.empty:
        raise ValueError("No valid numeric rows found after parsing the file.")
    return df


def _build_dataset_table(df: pd.DataFrame) -> list[dict]:
    """Export rows using NLC filtered CSV column names for the dashboard table."""
    sorted_df = df.copy()
    sorted_df["_sort_month"] = pd.to_datetime(
        sorted_df["month_year"].astype(str), format="%Y-%m", errors="coerce"
    )
    sorted_df = sorted_df.sort_values(["plant", "_sort_month"]).drop(columns=["_sort_month"])

    return [
        {
            "Plant": row["plant"],
            "Month_Year": str(row["month_year"]),
            "Total_Qty_KG": float(round(row["total_qty"], 2)),
            "Total_Amount_INR": float(round(row["total_amount"], 2)),
            "Records": int(row["records"]),
        }
        for _, row in sorted_df.iterrows()
    ]


def _sort_by_month(plant_df: pd.DataFrame) -> pd.DataFrame:
    ordered = plant_df.copy()
    ordered["_sort_month"] = pd.to_datetime(
        ordered["month_year"].astype(str), format="%Y-%m", errors="coerce"
    )
    ordered = ordered.sort_values("_sort_month").drop(columns=["_sort_month"])
    return ordered.reset_index(drop=True)


def _prepare_plant(df: pd.DataFrame, plant_code: str) -> pd.DataFrame:
    plant_df = _sort_by_month(df[df["plant"] == plant_code].copy())
    if plant_df.empty:
        raise ValueError(
            f"No rows found for plant '{plant_code}'. "
            f"Expected plants: {', '.join(PLANT_CODES)}"
        )
    if len(plant_df) < 4:
        raise ValueError(
            f"Plant {plant_code} needs at least 4 monthly records for ARIMA; found {len(plant_df)}."
        )
    return plant_df


def _plant_statistics(plant_df: pd.DataFrame) -> dict:
    qty = plant_df["total_qty"]
    return {
        "total_months": int(len(plant_df)),
        "total_qty_kg": float(round(qty.sum(), 2)),
        "total_amount_inr": float(round(plant_df["total_amount"].sum(), 2)),
        "avg_monthly_qty_kg": float(round(qty.mean(), 2)),
        "max_monthly_qty_kg": float(round(qty.max(), 2)),
        "min_monthly_qty_kg": float(round(qty.min(), 2)),
    }


def _arima_forecast_m001(series: pd.Series, steps: int = FORECAST_STEPS):
    model = ARIMA(series.astype(float), order=(1, 1, 1))
    result = model.fit()
    forecast = result.forecast(steps=steps)
    return np.asarray(forecast, dtype=float), "(1,1,1)"


def _arima_forecast_m002(series: pd.Series, steps: int = FORECAST_STEPS):
    try:
        model = ARIMA(series.astype(float), order=(1, 1, 1))
        result = model.fit()
        return np.asarray(result.forecast(steps=steps), dtype=float), "(1,1,1)"
    except Exception:
        model = ARIMA(series.astype(float), order=(1, 0, 0))
        result = model.fit()
        return np.asarray(result.forecast(steps=steps), dtype=float), "(1,0,0)"


def _build_plant_payload(plant_df: pd.DataFrame, plant_code: str) -> dict:
    series = plant_df["total_qty"]
    if plant_code == "M001":
        forecast_vals, arima_order = _arima_forecast_m001(series)
    else:
        forecast_vals, arima_order = _arima_forecast_m002(series)

    avg_price = float(plant_df["total_amount"].sum() / plant_df["total_qty"].sum())
    budgets = [float(q * avg_price) for q in forecast_vals]

    return {
        "name": PLANT_NAMES[plant_code],
        "statistics": _plant_statistics(plant_df),
        "labels": [str(m) for m in plant_df["month_year"].tolist()],
        "historical_qty": [float(round(v, 2)) for v in plant_df["total_qty"]],
        "historical_amount": [float(round(v, 2)) for v in plant_df["total_amount"]],
        "forecast_qty": [float(round(v, 2)) for v in forecast_vals],
        "forecast_labels": [f"Month {i}" for i in range(1, FORECAST_STEPS + 1)],
        "avg_price_per_kg": float(round(avg_price, 2)),
        "budget_forecast": [float(round(b, 2)) for b in budgets],
        "total_budget": float(round(sum(budgets), 2)),
        "arima_order": arima_order,
    }


def process_and_forecast(file_path: str) -> dict:
    raw_df, source_meta = _load_dataframe(file_path)
    df = _normalize_columns(raw_df)

    plants = {}
    for code in PLANT_CODES:
        plant_df = _prepare_plant(df, code)
        plants[code] = _build_plant_payload(plant_df, code)

    monthly_results = []
    for i in range(FORECAST_STEPS):
        m001_budget = plants["M001"]["budget_forecast"][i]
        m002_budget = plants["M002"]["budget_forecast"][i]
        monthly_results.append(
            {
                "month": f"Month {i + 1}",
                "m001_forecast_kg": plants["M001"]["forecast_qty"][i],
                "m001_budget_inr": m001_budget,
                "m002_forecast_kg": plants["M002"]["forecast_qty"][i],
                "m002_budget_inr": m002_budget,
                "combined_budget_inr": float(round(m001_budget + m002_budget, 2)),
            }
        )

    m001_total = plants["M001"]["total_budget"]
    m002_total = plants["M002"]["total_budget"]
    grand_total = float(round(m001_total + m002_total, 2))

    summary = {
        "grand_total_budget": grand_total,
        "grand_total_budget_formatted": f"{grand_total:,.2f}",
        "m001_total_budget": m001_total,
        "m002_total_budget": m002_total,
        "m001_total_budget_formatted": f"{m001_total:,.2f}",
        "m002_total_budget_formatted": f"{m002_total:,.2f}",
        "forecast_horizon_months": FORECAST_STEPS,
    }
    if source_meta:
        summary["data_source"] = source_meta

    summary["column_labels"] = {
        "plant": "Plant",
        "month_year": "Month_Year",
        "quantity": "Total_Qty_KG",
        "amount": "Total_Amount_INR",
        "records": "Records",
    }

    return {
        "plants": plants,
        "monthly_results": monthly_results,
        "dataset_table": _build_dataset_table(df),
        "summary": summary,
    }
