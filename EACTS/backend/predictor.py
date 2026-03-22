"""
E-ACTS Portal - Predictor Module
# Auto-reload trigger 2
Loads trained model and predicts energy / scheduling target for tasks.
"""

import os
import joblib
import numpy as np
from typing import List, Dict, Any

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "best_model.pkl")

_package = None


def _load():
    global _package
    if _package is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model not found at {MODEL_PATH}. "
                "Run 'python ml/train_model.py' first."
            )
        _package = joblib.load(MODEL_PATH)
    return _package


def predict_tasks(tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Predict optimal scheduling score (proxy for energy) for each task.

    Expected keys per task dict:
        cpu_usage, ram_usage, disk_io, network_io, priority, execution_time
    Returns original task dicts enriched with:
        predicted_energy  (float, 0-1 range – higher = more costly)
    """
    pkg = _load()
    model        = pkg["model"]
    scaler       = pkg["scaler"]
    feature_cols = pkg["feature_cols"]

    # Build feature matrix in the same column order as training
    col_map = {
        "cpu_usage (%)"         : "cpu_usage",
        "ram_usage (mb)"        : "ram_usage",
        "disk_io (mb/s)"        : "disk_io",
        "network_io (mb/s)"     : "network_io",
        "priority"              : "priority",
        "vm_id"                 : "vm_id",
        "execution_time (s)"    : "execution_time",
    }

    rows = []
    for t in tasks:
        row = []
        for col in feature_cols:
            key = col_map.get(col.lower(), col.lower())
            val = t.get(key, t.get(col.lower(), 0.5))
            row.append(float(val))
        rows.append(row)

    X = np.array(rows)
    X_scaled = scaler.transform(X)
    preds = model.predict(X_scaled)

    enriched = []
    for i, t in enumerate(tasks):
        enriched.append({
            **t,
            "predicted_energy": round(float(np.clip(preds[i], 0.0, 1.0)), 4),
        })
    return enriched
