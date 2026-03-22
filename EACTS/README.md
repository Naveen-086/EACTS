# E-ACTS Portal
### Energy-Aware Cloud Task Scheduler

A full-stack application that predicts task energy consumption using Machine Learning and schedules tasks efficiently across Virtual Machines to minimize peak load.

---

## 🏗️ Project Structure

```
EACTS/
├── backend/
│   ├── main.py           # FastAPI application (all endpoints)
│   ├── scheduler.py      # FCFS + E-ACTS scheduling algorithms
│   ├── predictor.py      # ML model inference
│   ├── database.py       # SQLite session storage
│   └── models/
│       ├── best_model.pkl    # Trained ML model (generated)
│       └── model_stats.json  # Model comparison stats (generated)
├── ml/
│   └── train_model.py    # ML training script
├── data/
│   └── cloudscheduling.csv   # Dataset (20,000 records)
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TaskSubmission.jsx
│   │   │   └── Results.jsx
│   │   ├── components/
│   │   │   └── Sidebar.jsx
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── index.css
│   ├── index.html
│   └── vite.config.js
├── requirements.txt
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+
- pip

### Step 1 – Install Python dependencies

```powershell
pip install -r requirements.txt
```

### Step 2 – Train the ML model

```powershell
python ml\train_model.py
```

This trains Linear Regression, Random Forest, and MLP Regressor on the 20,000-record dataset and saves the best model to `backend/models/best_model.pkl`.

### Step 3 – Start the Backend

```powershell
cd backend
uvicorn main:app --reload
```

API will be available at **http://localhost:8000**
Interactive docs: **http://localhost:8000/docs**

### Step 4 – Start the Frontend

In a new terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend will be at **http://localhost:5173**

---

## 🔐 Login Credentials

| Username | Password       |
|----------|----------------|
| admin    | eacts@2024     |
| user     | password123    |

---

## 📡 API Endpoints

| Method | Endpoint          | Description                              |
|--------|-------------------|------------------------------------------|
| POST   | `/login`          | Admin authentication                     |
| GET    | `/dashboard-stats`| Historical data analytics + model stats  |
| POST   | `/predict`        | Predict energy for a list of tasks       |
| POST   | `/schedule`       | Run E-ACTS optimizer + FCFS comparison   |
| POST   | `/schedule-fcfs`  | Run FCFS scheduling only                 |
| GET    | `/health`         | API health check                         |

---

## 🧠 ML Models Comparison

| Model             | Target         | Notes                                |
|-------------------|----------------|--------------------------------------|
| Linear Regression | Energy (class) | Fast baseline                        |
| Random Forest     | Energy (class) | 🏆 Best - high accuracy              |
| MLP Regressor     | Energy (class) | Deep learning approach               |

---

## ⚡ Scheduling Algorithms

### FCFS (Baseline)
- Tasks assigned in round-robin to VMs
- Simple, predictable, but unbalanced

### E-ACTS Optimised
1. Predict energy for all tasks via ML
2. Sort tasks by predicted energy (descending)
3. Assign each task to VM with lowest current load
4. Result: balanced load, reduced peak consumption

### Impact Formula
```
Improvement% = (FCFS_Peak - EACTS_Peak) / FCFS_Peak × 100
```

---

## 🎨 UI Pages

1. **Login** – Secure admin login with remember-me
2. **Dashboard** – Historical stats, model comparison charts, weekly trend
3. **Task Submission Hub** – Configure tasks with sliders, build a queue, run scheduling
4. **Database & Logs** – View historical scheduling actions and backend connectivity
5. **System Alerts** – View and dismiss active system notifications
6. **Settings** – Configure dark mode, default prediction model, and auto-scheduling

---

## 📖 How to Use the Portal

1. **Log In**
   Navigate to `http://localhost:5173`. Use credentials `admin` / `eacts@2024`.
2. **Review Historical Context**
   The first page you see is the **Dashboard**. Review the total tasks analyzed, avg execution time, CPU load, and check the bottom left panel to see how accurate the Machine Learning models have performed on your historical dataset (`cloudscheduling.csv`).
3. **Configure Settings (Optional)**
   Click the **Gear icon** in the sidebar. You can switch to Dark Mode or change the 'Default Prediction Model' to Neural Network or Random Forest. Click 'Save Changes'.
4. **Submit a New Batch**
   Navigate to the **Task Hub** (the paper airplane icon). 
   - Use the sliders and dropdowns on the left to configure a task (CPU usage, Memory, Network Traffic, Priority). 
   - Click **+ Add Task to Batch**. Add 3 or 4 tasks to build a queue.
   - On the right side, review your chosen ML model, then click **Submit Batch & Schedule →**.
5. **Analyze Results**
   The backend will use the E-ACTS algorithm to dynamically assign these tasks to Datacenters/VMs securely. 
   - Review the **Prediction Results** (Target Index) to see how much energy the ML model predicted each task will use.
   - Review the **Dynamic Resource Allocation Map** to see how tasks were evenly spread across VMs.
   - Review the **Impact Analysis** to see the total computed energy saved versus a naive FCFS round-robin scheduler.
6. **Export Action Logs**
   Navigate to the **Database Logs** page (database icon). You will see your recent 'BATCH_SCHEDULE' action logged here. Click the blue link at the bottom to download a CSV export of your system actions.

---

## 📊 Dataset

`data/cloudscheduling.csv` – 20,001 rows, 9 columns:

| Column | Description |
|--------|-------------|
| Task_ID | Unique task identifier |
| CPU_Usage (%) | CPU utilisation (normalised 0-1) |
| RAM_Usage (MB) | Memory usage (normalised 0-1) |
| Disk_IO (MB/s) | Disk I/O rate (normalised 0-1) |
| Network_IO (MB/s) | Network I/O rate (normalised 0-1) |
| Priority | Task priority (0=Low, 0.5=Med, 1=High) |
| VM_ID | Virtual machine assignment |
| Execution_Time (s) | Task execution duration (normalised 0-1) |
| Target (Optimal Scheduling) | Target label (0/1) |
