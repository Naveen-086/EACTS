"""
E-ACTS Portal - Scheduling Algorithms
FCFS baseline and E-ACTS energy-aware optimised scheduler.
"""

from typing import List, Dict, Any


# ────────────────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────────────────

def _init_vms(n: int = 3) -> Dict[str, float]:
    return {f"VM{i+1}": 0.0 for i in range(n)}


def _peak_load(vms: Dict[str, float]) -> float:
    return max(vms.values())


# ────────────────────────────────────────────────────────────────────────────
# 1. FCFS – First Come First Served
# ────────────────────────────────────────────────────────────────────────────

def schedule_fcfs(tasks: List[Dict[str, Any]], n_vms: int = 3) -> Dict[str, Any]:
    """
    Assign tasks to VMs in round-robin (FCFS) order.
    Returns assignment list + per-VM load + peak load.
    """
    vms = _init_vms(n_vms)
    vm_keys = list(vms.keys())
    assignments = []

    for idx, task in enumerate(tasks):
        vm = vm_keys[idx % n_vms]
        energy = task.get("predicted_energy", 0.5)
        vms[vm] += energy
        assignments.append({
            **task,
            "assigned_vm":  vm,
            "algorithm":    "FCFS",
        })

    return {
        "assignments":  assignments,
        "vm_loads":     {k: round(v, 4) for k, v in vms.items()},
        "peak_load":    round(_peak_load(vms), 4),
        "algorithm":    "FCFS",
    }


# ────────────────────────────────────────────────────────────────────────────
# 2. E-ACTS Optimised Scheduler
# ────────────────────────────────────────────────────────────────────────────

def schedule_eacts(tasks: List[Dict[str, Any]], n_vms: int = 3) -> Dict[str, Any]:
    """
    E-ACTS Energy-Aware Cloud Task Scheduler:
      1. Sort tasks by predicted_energy DESC (heaviest first)
      2. Assign each task to the VM with the LOWEST current load
    """
    vms = _init_vms(n_vms)

    # Sort descending so heaviest tasks go first (better load balancing)
    sorted_tasks = sorted(
        tasks,
        key=lambda t: t.get("predicted_energy", 0.5),
        reverse=True,
    )

    assignments = []
    for task in sorted_tasks:
        # Pick VM with lowest load (greedy bin-packing)
        vm = min(vms, key=vms.get)
        energy = task.get("predicted_energy", 0.5)
        vms[vm] += energy
        assignments.append({
            **task,
            "assigned_vm":  vm,
            "algorithm":    "E-ACTS",
        })

    return {
        "assignments":  assignments,
        "vm_loads":     {k: round(v, 4) for k, v in vms.items()},
        "peak_load":    round(_peak_load(vms), 4),
        "algorithm":    "E-ACTS",
    }


# ────────────────────────────────────────────────────────────────────────────
# 3. Impact Calculator
# ────────────────────────────────────────────────────────────────────────────

def compute_impact(fcfs_peak: float, eacts_peak: float) -> Dict[str, Any]:
    if fcfs_peak == 0:
        improvement = 0.0
    else:
        improvement = (fcfs_peak - eacts_peak) / fcfs_peak * 100

    return {
        "fcfs_peak_load":    round(fcfs_peak,    4),
        "eacts_peak_load":   round(eacts_peak,   4),
        "improvement_pct":   round(improvement,  2),
        "summary":           f"System Load {'Reduced' if improvement >= 0 else 'Increased'} by {abs(improvement):.1f}%",
    }
