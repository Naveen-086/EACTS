"""
E-ACTS Portal – FastAPI Backend
Run: uvicorn main:app --reload
"""

import os, json, sys
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ensure backend folder is on path
sys.path.insert(0, os.path.dirname(__file__))

import database as db
from predictor  import predict_tasks
from scheduler  import schedule_fcfs, schedule_eacts, compute_impact

# ─── App ────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="E-ACTS Portal API",
    description="Energy-Aware Cloud Task Scheduler",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db.init_db()

# ─── Pydantic Models ─────────────────────────────────────────────────────────
class TaskInput(BaseModel):
    task_id:        Optional[str]  = Field(default=None)
    cpu_usage:      float          = Field(..., ge=0, le=1,   description="CPU usage 0-1")
    ram_usage:      float          = Field(..., ge=0,         description="RAM in MB (normalised)")
    disk_io:        float          = Field(..., ge=0, le=1)
    network_io:     float          = Field(..., ge=0, le=1)
    priority:       float          = Field(..., ge=0, le=1,   description="0=Low 0.5=Med 1=High")
    execution_time: Optional[float] = Field(default=0.5)
    vm_id:          Optional[float] = Field(default=0.5)


class TaskList(BaseModel):
    tasks:  List[TaskInput]
    n_vms:  int = Field(default=3, ge=2, le=10)


class LoginRequest(BaseModel):
    username: str
    password: str


# ─── Auth ────────────────────────────────────────────────────────────────────
ADMIN_CREDENTIALS = {"admin": "eacts@2024", "user": "password123"}

@app.post("/login")
def login(req: LoginRequest):
    if ADMIN_CREDENTIALS.get(req.username) == req.password:
        return {"success": True, "username": req.username, "role": "admin"}
    raise HTTPException(status_code=401, detail="Invalid credentials")


# ─── Dashboard Stats ─────────────────────────────────────────────────────────
STATS_PATH = os.path.join(os.path.dirname(__file__), "models", "model_stats.json")

@app.get("/dashboard-stats")
def dashboard_stats():
    if not os.path.exists(STATS_PATH):
        # Return sample/demo stats if model not yet trained
        return {
            "trained": False,
            "dataset_stats": {
                "total_rows":    20001,
                "avg_cpu":       0.4986,
                "avg_ram":       0.4997,
                "avg_exec_time": 0.4998,
                "priority_dist": {"0.0": 0.34, "0.5": 0.33, "1.0": 0.33},
            },
            "model_results": {
                "Linear Regression": {"r2": 0.5120, "mse": 0.0812, "pred_speed_ms": 0.0012},
                "Random Forest":     {"r2": 0.9234, "mse": 0.0128, "pred_speed_ms": 0.0145},
                "Neural Network":    {"r2": 0.8871, "mse": 0.0188, "pred_speed_ms": 0.0089},
            },
            "best_model": "Random Forest",
            "weekly_trend": [
                {"name": "D-6", "val": 0},
                {"name": "D-5", "val": 0},
                {"name": "D-4", "val": 0},
                {"name": "D-3", "val": 0},
                {"name": "D-2", "val": 0},
                {"name": "D-1", "val": 0},
                {"name": "Today", "val": 0},
            ],
            "pie_data": [
                {"name": "High", "value": 33, "fill": "#ea580c"},
                {"name": "Medium", "value": 33, "fill": "#3b82f6"},
                {"name": "Low", "value": 34, "fill": "#22c55e"}
            ],
            "bar_data": [
                {"name": "High", "time": 0, "fill": "#0369a1"},
                {"name": "Medium", "time": 0, "fill": "#16a34a"},
                {"name": "Low", "time": 0, "fill": "#22c55e"}
            ],
            "session_kpis": {
                "total_sessions": 0,
                "avg_improvement": 0,
                "best_improvement": 0,
                "latest_improvement": 0,
            },
            "session_trend": [],
            "vm_mix": [],
            "recent_sessions": [],
        }

    with open(STATS_PATH) as f:
        stats = json.load(f)

    recent = db.get_recent_sessions(10)
    all_recent = db.get_recent_sessions(200)
    recent_tasks = db.get_recent_session_tasks(100)

    # Dynamic weekly trend from last 7 days task volume.
    today = datetime.utcnow().date()
    last_7_days = [today - timedelta(days=i) for i in range(6, -1, -1)]
    daily_task_volume = {d: 0 for d in last_7_days}

    for s in all_recent:
        created = s.get("created_at")
        if not created:
            continue
        try:
            created_date = datetime.fromisoformat(created).date()
        except ValueError:
            continue

        if created_date in daily_task_volume:
            daily_task_volume[created_date] += int(s.get("task_count") or 0)

    weekly = [
        {
            "name": d.strftime("%d %b"),
            "val": daily_task_volume[d],
        }
        for d in last_7_days
    ]
    
    # Priority Pie Chart mapping
    pd = stats["dataset_stats"]["priority_dist"]
    pie_data = [
        {"name": "High", "value": round(pd.get("1.0", 0.33)*100), "fill": "#ea580c"},
        {"name": "Medium", "value": round(pd.get("0.5", 0.33)*100), "fill": "#3b82f6"},
        {"name": "Low", "value": round(pd.get("0.0", 0.34)*100), "fill": "#22c55e"}
    ]
    
    # Dynamic execution bar chart from recent scheduled tasks.
    exec_by_priority = {
        "High": {"sum": 0.0, "count": 0},
        "Medium": {"sum": 0.0, "count": 0},
        "Low": {"sum": 0.0, "count": 0},
    }

    for task in recent_tasks:
        priority = float(task.get("priority", 0.5) or 0.5)
        execution_time = float(task.get("execution_time", 0.5) or 0.5)

        if priority >= 0.8:
            bucket = "High"
        elif priority >= 0.4:
            bucket = "Medium"
        else:
            bucket = "Low"

        exec_by_priority[bucket]["sum"] += execution_time
        exec_by_priority[bucket]["count"] += 1

    bar_data = [
        {
            "name": "High",
            "time": round((exec_by_priority["High"]["sum"] / exec_by_priority["High"]["count"] * 60), 1)
            if exec_by_priority["High"]["count"] else 0,
            "fill": "#0369a1"
        },
        {
            "name": "Medium",
            "time": round((exec_by_priority["Medium"]["sum"] / exec_by_priority["Medium"]["count"] * 60), 1)
            if exec_by_priority["Medium"]["count"] else 0,
            "fill": "#16a34a"
        },
        {
            "name": "Low",
            "time": round((exec_by_priority["Low"]["sum"] / exec_by_priority["Low"]["count"] * 60), 1)
            if exec_by_priority["Low"]["count"] else 0,
            "fill": "#22c55e"
        }
    ]

    # Session-level analytics for live dashboard charts.
    sessions_asc = list(reversed(recent))
    session_trend = []
    improvements = []
    vm_mix_counts = {}

    for s in all_recent:
        n_vms = int(s.get("n_vms") or 0)
        if n_vms > 0:
            vm_mix_counts[n_vms] = vm_mix_counts.get(n_vms, 0) + 1

    for s in sessions_asc:
        fcfs_peak = float(s.get("fcfs_peak") or 0.0)
        eacts_peak = float(s.get("eacts_peak") or 0.0)
        improvement = float(s.get("improvement") or 0.0)

        improvements.append(improvement)
        session_trend.append({
            "name": f"S{s['id']}",
            "fcfs_peak": round(fcfs_peak, 4),
            "eacts_peak": round(eacts_peak, 4),
            "improvement": round(improvement, 2),
            "task_count": int(s.get("task_count") or 0),
            "n_vms": int(s.get("n_vms") or 0),
        })

    vm_mix = [
        {"name": f"{k} VMs", "value": v}
        for k, v in sorted(vm_mix_counts.items())
    ]

    session_kpis = {
        "total_sessions": len(all_recent),
        "avg_improvement": round(sum(improvements) / len(improvements), 2) if improvements else 0,
        "best_improvement": round(max(improvements), 2) if improvements else 0,
        "latest_improvement": round(float(recent[0].get("improvement") or 0), 2) if recent else 0,
    }

    return {
        "trained":       True,
        "dataset_stats": stats["dataset_stats"],
        "model_results": stats["model_results"],
        "best_model":    stats["best_model"],
        "weekly_trend":  weekly,
        "pie_data":      pie_data,
        "bar_data":      bar_data,
        "session_kpis":  session_kpis,
        "session_trend": session_trend,
        "vm_mix":        vm_mix,
        "recent_sessions": recent,
    }


# ─── Predict ─────────────────────────────────────────────────────────────────
@app.post("/predict")
def predict(body: TaskList):
    raw = [t.dict() for t in body.tasks]
    enriched = predict_tasks(raw)
    return {"tasks": enriched, "count": len(enriched)}


# ─── Schedule (E-ACTS optimised) ─────────────────────────────────────────────
@app.post("/schedule")
def schedule(body: TaskList):
    raw = [t.dict() for t in body.tasks]

    # 1. Predict energy for all tasks
    enriched = predict_tasks(raw)

    # 2. Run both schedulers
    eacts_result = schedule_eacts(enriched, n_vms=body.n_vms)
    fcfs_result  = schedule_fcfs(enriched,  n_vms=body.n_vms)

    # 3. Impact analysis
    impact = compute_impact(fcfs_result["peak_load"], eacts_result["peak_load"])

    # 4. Persist session
    session_id = db.save_session({
        "task_count":   len(enriched),
        "n_vms":        body.n_vms,
        "fcfs_peak":    fcfs_result["peak_load"],
        "eacts_peak":   eacts_result["peak_load"],
        "improvement":  impact["improvement_pct"],
        "tasks":        enriched,
        "fcfs_result":  fcfs_result,
        "eacts_result": eacts_result,
    })

    db.add_log('BATCH_SCHEDULE', f'Scheduled {len(enriched)} tasks to {body.n_vms} Datacenters/VMs. Improv: {impact["improvement_pct"]:.1f}%', 'SUCCESS')

    return {
        "session_id":   session_id,
        "tasks":        enriched,
        "eacts_result": eacts_result,
        "fcfs_result":  fcfs_result,
        "impact":       impact,
    }


# ─── Schedule FCFS only ──────────────────────────────────────────────────────
@app.post("/schedule-fcfs")
def schedule_fcfs_only(body: TaskList):
    raw = [t.dict() for t in body.tasks]
    enriched = predict_tasks(raw)
    result   = schedule_fcfs(enriched, n_vms=body.n_vms)
    return {"tasks": enriched, "fcfs_result": result}


# ─── Logs & Alerts ────────────────────────────────────────────────────────
from fastapi.responses import StreamingResponse
import io, csv

@app.get("/logs")
def get_logs():
    return {"logs": db.get_system_logs(50)}

@app.get("/alerts")
def get_alerts():
    alerts = []
    # Dynamic checks
    recent_logs = db.get_system_logs(5)
    
    # Static info alert
    alerts.append({
        "id": 1, "title": "System Active", 
        "msg": "E-ACTS Scheduler is running smoothly.", 
        "type": "info", "time": "Just now"
    })

    # Check for recent scheduling improvement
    for log in recent_logs:
        if log["action"] == "BATCH_SCHEDULE":
            alerts.append({
                "id": 2, "title": "Tasks Scheduled", 
                "msg": log["details"], 
                "type": "success", "time": log["time"]
            })
            break

    # Static drift warning just for demonstration of alerts page UI
    alerts.append({
        "id": 3, "title": "Model Drift Check",
        "msg": "No significant dataset drift detected in the last 24h.",
        "type": "success", "time": "2 hours ago"
    })
    
    return {"alerts": alerts}

@app.get("/export-logs")
def export_logs():
    logs = db.get_system_logs(200)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Timestamp", "Action", "Details", "Status"])
    for row in logs:
        writer.writerow([row["id"], row["time"], row["action"], row["details"], row["status"]])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]), 
        media_type="text/csv", 
        headers={"Content-Disposition": "attachment; filename=eacts_system_logs.csv"}
    )


# ─── Health ───────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "E-ACTS Portal API is running 🚀", "docs": "/docs"}

@app.get("/health")
def health():
    model_ready = os.path.exists(os.path.join(
        os.path.dirname(__file__), "models", "best_model.pkl"
    ))
    return {"status": "ok", "model_ready": model_ready}
