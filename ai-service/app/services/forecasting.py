"""Demand forecasting engine with baseline comparison, time-based split, and insufficient data guardrails."""

from datetime import datetime, timedelta
import math
from typing import List, Tuple
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, root_mean_squared_error

from app.schemas import (
    ForecastRequest,
    ForecastResponse,
    DemandForecastPoint,
    ModelEvaluationMetrics,
)

MIN_PERIODS_FOR_EVALUATION = 5


def generate_demand_forecast(request: ForecastRequest) -> ForecastResponse:
    """
    Produce explainable demand forecasts from historical order transactions.
    
    If fewer than 5 historical intervals exist, marks status as INSUFFICIENT_DATA,
    returns naive baseline fallback, and surfaces explicit limitations.
    """
    crop_id = request.crop_id
    crop_name = request.crop_name
    horizon = request.horizon_days
    raw_orders = request.historical_orders

    # 1. Edge Case: Zero historical orders
    if not raw_orders:
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        fallback_points = [
            DemandForecastPoint(
                date=(datetime.now() + timedelta(days=i + 1)).strftime("%Y-%m-%d"),
                predicted_demand_kg=0.0,
                is_fallback=True,
            )
            for i in range(horizon)
        ]
        return ForecastResponse(
            crop_id=crop_id,
            crop_name=crop_name,
            status="INSUFFICIENT_DATA",
            has_sufficient_data=False,
            historical_points_count=0,
            minimum_points_required=MIN_PERIODS_FOR_EVALUATION,
            forecast_horizon_days=horizon,
            forecast=fallback_points,
            baseline_model=ModelEvaluationMetrics(
                name="Naive Zero Baseline",
                mae=None,
                rmse=None,
                sample_size=0,
                description="Zero demand assumption due to absence of transaction history."
            ),
            evaluated_model=ModelEvaluationMetrics(
                name="Ridge Autoregressive Model",
                mae=None,
                rmse=None,
                sample_size=0,
                description="Model execution skipped due to zero historical records."
            ),
            data_limitations=[
                "No completed customer orders exist for this crop listing yet.",
                f"At least {MIN_PERIODS_FOR_EVALUATION} distinct chronological order intervals are required to train and evaluate demand models."
            ]
        )

    # 2. Parse and Aggregate Historical Orders by Day
    df_raw = pd.DataFrame([
        {
            "order_date": o.order_date.date(),
            "quantity_kg": float(o.quantity_kg),
        }
        for o in raw_orders
    ])

    # Group by date to aggregate daily demand
    df_daily = df_raw.groupby("order_date")["quantity_kg"].sum().reset_index()
    df_daily["order_date"] = pd.to_datetime(df_daily["order_date"])
    df_daily = df_daily.sort_values("order_date")

    # Complete the date range with zero-fill for missing intermediate days
    min_date = df_daily["order_date"].min()
    max_date = df_daily["order_date"].max()
    full_idx = pd.date_range(min_date, max_date, freq="D")
    df_filled = (
        df_daily.set_index("order_date")
        .reindex(full_idx, fill_value=0.0)
        .rename_axis("order_date")
        .reset_index()
    )

    distinct_points = len(df_filled)
    non_zero_days = int((df_filled["quantity_kg"] > 0).sum())

    # 3. Guard against insufficient historical sample size
    if distinct_points < MIN_PERIODS_FOR_EVALUATION or non_zero_days < 2:
        # Provide transparent naive average fallback
        daily_mean = round(float(df_filled["quantity_kg"].mean()), 2)
        last_date = max_date.to_pydatetime()
        fallback_points = [
            DemandForecastPoint(
                date=(last_date + timedelta(days=i + 1)).strftime("%Y-%m-%d"),
                predicted_demand_kg=max(0.0, daily_mean),
                is_fallback=True,
            )
            for i in range(horizon)
        ]

        return ForecastResponse(
            crop_id=crop_id,
            crop_name=crop_name,
            status="INSUFFICIENT_DATA",
            has_sufficient_data=False,
            historical_points_count=distinct_points,
            minimum_points_required=MIN_PERIODS_FOR_EVALUATION,
            forecast_horizon_days=horizon,
            forecast=fallback_points,
            baseline_model=ModelEvaluationMetrics(
                name="Historical Moving Average Baseline",
                mae=None,
                rmse=None,
                sample_size=distinct_points,
                description=f"Fallback projection using arithmetic mean ({daily_mean} kg/day) across available points."
            ),
            evaluated_model=ModelEvaluationMetrics(
                name="Ridge Autoregressive Model",
                mae=None,
                rmse=None,
                sample_size=distinct_points,
                description=f"Evaluation withheld: dataset contains only {distinct_points} chronological interval(s)."
            ),
            data_limitations=[
                f"Historical transaction sequence has {distinct_points} daily observation(s) ({non_zero_days} active order day(s)).",
                f"Minimum {MIN_PERIODS_FOR_EVALUATION} distinct intervals are required for statistical train/test splits without leakage.",
                "Projection shown is a naive fallback based on average order volume and should not be considered an ML prediction."
            ]
        )

    # 4. Feature Engineering for Time-Series (Lags + Day-of-Week)
    df_filled["lag_1"] = df_filled["quantity_kg"].shift(1)
    df_filled["lag_2"] = df_filled["quantity_kg"].shift(2)
    df_filled["day_of_week"] = df_filled["order_date"].dt.dayofweek
    df_filled["rolling_3d_mean"] = df_filled["quantity_kg"].shift(1).rolling(3, min_periods=1).mean()

    # Drop initial rows with NaN from lags
    df_clean = df_filled.dropna().copy()

    if len(df_clean) < MIN_PERIODS_FOR_EVALUATION:
        # If dropping lags left fewer rows than required
        daily_mean = round(float(df_filled["quantity_kg"].mean()), 2)
        last_date = max_date.to_pydatetime()
        fallback_points = [
            DemandForecastPoint(
                date=(last_date + timedelta(days=i + 1)).strftime("%Y-%m-%d"),
                predicted_demand_kg=max(0.0, daily_mean),
                is_fallback=True,
            )
            for i in range(horizon)
        ]
        return ForecastResponse(
            crop_id=crop_id,
            crop_name=crop_name,
            status="INSUFFICIENT_DATA",
            has_sufficient_data=False,
            historical_points_count=distinct_points,
            minimum_points_required=MIN_PERIODS_FOR_EVALUATION,
            forecast_horizon_days=horizon,
            forecast=fallback_points,
            baseline_model=ModelEvaluationMetrics(
                name="Historical Moving Average Baseline",
                mae=None,
                rmse=None,
                sample_size=distinct_points,
                description=f"Fallback mean projection ({daily_mean} kg/day)."
            ),
            evaluated_model=ModelEvaluationMetrics(
                name="Ridge Autoregressive Model",
                mae=None,
                rmse=None,
                sample_size=len(df_clean),
                description="Insufficient continuous points post lag alignment."
            ),
            data_limitations=[
                f"Only {len(df_clean)} aligned historical points available after computing autoregressive lag features.",
                f"A minimum of {MIN_PERIODS_FOR_EVALUATION} aligned points is required to evaluate time-series models."
            ]
        )

    # 5. Time-based Chronological Train / Test Split (Prevent Temporal Data Leakage)
    train_size = max(3, int(len(df_clean) * 0.8))
    train_df = df_clean.iloc[:train_size]
    test_df = df_clean.iloc[train_size:]

    feature_cols = ["lag_1", "lag_2", "day_of_week", "rolling_3d_mean"]
    X_train = train_df[feature_cols]
    y_train = train_df["quantity_kg"]

    # Evaluated Model: Ridge Regression (L2 regularization to avoid overfitting small samples)
    model = Ridge(alpha=1.0)
    model.fit(X_train, y_train)

    # Evaluation on Test Split (or Train if test is too small)
    eval_target_df = test_df if len(test_df) >= 1 else train_df
    X_eval = eval_target_df[feature_cols]
    y_eval = eval_target_df["quantity_kg"].values

    # Baseline Model: Naive persistence (predicts lag_1 directly)
    y_baseline_pred = eval_target_df["lag_1"].values
    baseline_mae = float(round(mean_absolute_error(y_eval, y_baseline_pred), 3))
    baseline_rmse = float(round(root_mean_squared_error(y_eval, y_baseline_pred), 3))

    # Evaluated Model Predictions
    y_model_pred = np.maximum(0.0, model.predict(X_eval))
    model_mae = float(round(mean_absolute_error(y_eval, y_model_pred), 3))
    model_rmse = float(round(root_mean_squared_error(y_eval, y_model_pred), 3))

    # 6. Recursive Out-of-Sample Forecasting for Horizon
    forecast_points: List[DemandForecastPoint] = []
    current_series = list(df_filled["quantity_kg"].values)
    current_date = max_date.to_pydatetime()

    for step in range(1, horizon + 1):
        next_date = current_date + timedelta(days=step)
        next_dow = next_date.weekday()
        lag_1 = current_series[-1]
        lag_2 = current_series[-2] if len(current_series) >= 2 else lag_1
        rolling_3d = float(np.mean(current_series[-3:])) if len(current_series) >= 3 else lag_1

        X_next = pd.DataFrame([{
            "lag_1": lag_1,
            "lag_2": lag_2,
            "day_of_week": next_dow,
            "rolling_3d_mean": rolling_3d,
        }])

        pred_val = float(model.predict(X_next)[0])
        pred_val = max(0.0, round(pred_val, 2))
        current_series.append(pred_val)

        forecast_points.append(
            DemandForecastPoint(
                date=next_date.strftime("%Y-%m-%d"),
                predicted_demand_kg=pred_val,
                is_fallback=False,
            )
        )

    # Compile data limitations and validation commentary
    limitations = [
        f"Model trained on {train_size} time intervals and evaluated on {len(eval_target_df)} chronological holdout interval(s).",
        "Linear autoregression does not account for macro-weather events or regional crop market interventions.",
        f"Baseline persistence achieved MAE: {baseline_mae} kg, while Ridge model achieved MAE: {model_mae} kg."
    ]

    return ForecastResponse(
        crop_id=crop_id,
        crop_name=crop_name,
        status="SUFFICIENT_DATA",
        has_sufficient_data=True,
        historical_points_count=distinct_points,
        minimum_points_required=MIN_PERIODS_FOR_EVALUATION,
        forecast_horizon_days=horizon,
        forecast=forecast_points,
        baseline_model=ModelEvaluationMetrics(
            name="Naive Previous-Period Persistence",
            mae=baseline_mae,
            rmse=baseline_rmse,
            sample_size=len(eval_target_df),
            description="Predicts the immediate previous interval demand directly."
        ),
        evaluated_model=ModelEvaluationMetrics(
            name="Ridge Autoregressive Regularized Regression",
            mae=model_mae,
            rmse=model_rmse,
            sample_size=len(eval_target_df),
            description="L2 regularized lag regression utilizing previous demand and weekday dynamics."
        ),
        data_limitations=limitations
    )
