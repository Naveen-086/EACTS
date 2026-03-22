"""
E-ACTS Portal - Database Module
SQLite database for storing task history and results.
"""

import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "eacts.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cur = conn.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS scheduling_sessions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at  TEXT NOT NULL,
            task_count  INTEGER NOT NULL,
            n_vms       INTEGER NOT NULL,
            fcfs_peak   REAL,
            eacts_peak  REAL,
            improvement REAL,
            tasks_json  TEXT,
            fcfs_json   TEXT,
            eacts_json  TEXT
        );
        CREATE TABLE IF NOT EXISTS system_logs (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp   TEXT NOT NULL,
            action_type TEXT NOT NULL,
            details     TEXT NOT NULL,
            status      TEXT NOT NULL
        );
    """)
    conn.commit()
    conn.close()


def save_session(data: dict) -> int:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO scheduling_sessions
            (created_at, task_count, n_vms, fcfs_peak, eacts_peak,
             improvement, tasks_json, fcfs_json, eacts_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        datetime.utcnow().isoformat(),
        data.get("task_count", 0),
        data.get("n_vms", 3),
        data.get("fcfs_peak"),
        data.get("eacts_peak"),
        data.get("improvement"),
        json.dumps(data.get("tasks", [])),
        json.dumps(data.get("fcfs_result", {})),
        json.dumps(data.get("eacts_result", {})),
    ))
    conn.commit()
    session_id = cur.lastrowid
    conn.close()
    return session_id


def get_recent_sessions(limit: int = 10):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, created_at, task_count, n_vms,
               fcfs_peak, eacts_peak, improvement
        FROM scheduling_sessions
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


def get_recent_session_tasks(limit: int = 100):
    """Return flattened task payloads from the most recent scheduling sessions."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT tasks_json
        FROM scheduling_sessions
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))

    tasks = []
    for row in cur.fetchall():
        try:
            parsed = json.loads(row["tasks_json"] or "[]")
            if isinstance(parsed, list):
                tasks.extend(parsed)
        except json.JSONDecodeError:
            continue

    conn.close()
    return tasks

def add_log(action_type: str, details: str, status: str = 'SUCCESS'):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO system_logs (timestamp, action_type, details, status)
        VALUES (?, ?, ?, ?)
    """, (datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"), action_type, details, status))
    conn.commit()
    conn.close()

def get_system_logs(limit: int = 50):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, timestamp as time, action_type as action, details, status
        FROM system_logs
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows
