import os
import json
import re
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta, datetime
from collections import defaultdict
from flask import Blueprint, request, jsonify, g
from cachetools import TTLCache
from ..mongo_client import get_db, serialize_docs, serialize_doc, new_id, now_iso
from ..auth import require_auth
from ..schemas import GoalSchema
from ..gemini import model, gemini_limiter, cache_key, get_cached, set_cached

goals_bp = Blueprint("goals", __name__)

MEAL_PLAN_PROMPT = """You are a certified nutritionist and AI meal planner.

User's recent 30-day average daily intake:
- Calories: {avg_calories:.0f} kcal
- Protein: {avg_protein:.1f}g
- Carbs: {avg_carbs:.1f}g
- Fat: {avg_fats:.1f}g
- Daily food spend: ${avg_spend:.2f}

User's goals:
- Target daily calories: {calorie_goal} kcal
- Target protein: {protein_goal}g/day
- Target carbs: {carbs_goal}g/day
- Target fat: {fats_goal}g/day
- Daily budget: ${budget}/day
- Goal description: "{goal_description}"
- Target duration: {target_weeks} weeks

Generate a detailed 7-day meal plan to help this user reach their goal.
Return ONLY valid JSON with NO extra text:
{{
  "summary": "brief 2-sentence plan overview",
  "weekly_plan": [
    {{
      "day": "Monday",
      "meals": [
        {{"meal_type": "breakfast", "name": "Meal name", "calories": 400, "protein_g": 25, "carbs_g": 45, "fats_g": 12, "estimated_cost": 4.5}},
        {{"meal_type": "lunch", "name": "Meal name", "calories": 550, "protein_g": 35, "carbs_g": 60, "fats_g": 15, "estimated_cost": 7.0}},
        {{"meal_type": "dinner", "name": "Meal name", "calories": 600, "protein_g": 40, "carbs_g": 55, "fats_g": 18, "estimated_cost": 8.5}},
        {{"meal_type": "snack", "name": "Meal name", "calories": 200, "protein_g": 10, "carbs_g": 20, "fats_g": 8, "estimated_cost": 2.0}}
      ],
      "day_total": {{"calories": 1750, "protein_g": 110, "carbs_g": 180, "fats_g": 53, "cost": 22.0}}
    }}
  ],
  "tips": ["tip 1", "tip 2", "tip 3"],
  "projected_progress": "What the user can expect after {target_weeks} weeks"
}}"""

# Thread-safe LRU cache for meal plans with 24-hour TTL (replaces unbounded dict)
_meal_plan_lock = threading.Lock()
_meal_plan_cache: TTLCache = TTLCache(maxsize=100, ttl=86400)

# Background task executor and job tracking cache for non-blocking meal plan generation
_plan_executor = ThreadPoolExecutor(max_workers=3)
_meal_plan_jobs = TTLCache(maxsize=200, ttl=3600)
_job_lock = threading.Lock()


def _goal_hash(goal: dict) -> str:
    import hashlib
    key_fields = sorted((k, v) for k, v in goal.items() if k not in ("goal_description", "user_id"))
    return hashlib.md5(str(key_fields).encode()).hexdigest()


def _get_avg_intake(user_id: str) -> dict:
    db = get_db()
    from_date = str(date.today() - timedelta(days=30))
    rows = list(db.food_logs.find(
        {"user_id": user_id, "log_date": {"$gte": from_date}},
        {"_id": 0, "log_date": 1, "calories": 1, "protein_g": 1, "carbs_g": 1, "fats_g": 1, "cost": 1}
    ))
    if not rows:
        return {"calories": 2000, "protein": 100, "carbs": 250, "fats": 70, "spend": 20}
    totals = defaultdict(float)
    for r in rows:
        totals["calories"] += r.get("calories", 0) or 0
        totals["protein"]  += r.get("protein_g", 0) or 0
        totals["carbs"]    += r.get("carbs_g", 0) or 0
        totals["fats"]     += r.get("fats_g", 0) or 0
        totals["spend"]    += r.get("cost", 0) or 0
    n = max(len(set(r.get("log_date", "") for r in rows)), 1)
    return {k: v / n for k, v in totals.items()}


def _generate_plan_worker(job_id: str, user_id: str, goal: dict, goal_h: str):
    """Background worker to run AI meal plan generation without blocking the HTTP server."""
    try:
        avg = _get_avg_intake(user_id)
        prompt = MEAL_PLAN_PROMPT.format(
            avg_calories=avg.get("calories", 2000),
            avg_protein=avg.get("protein", 100),
            avg_carbs=avg.get("carbs", 250),
            avg_fats=avg.get("fats", 70),
            avg_spend=avg.get("spend", 20),
            calorie_goal=goal.get("daily_calorie_goal", 2000),
            protein_goal=goal.get("daily_protein_goal_g", 150),
            carbs_goal=goal.get("daily_carbs_goal_g", 250),
            fats_goal=goal.get("daily_fats_goal_g", 65),
            budget=goal.get("daily_budget_usd", 30),
            goal_description=goal.get("goal_description", "Eat healthier"),
            target_weeks=goal.get("target_weeks", 4),
        )

        response = model.generate_content(prompt)
        raw = response.text.strip()
        raw = re.sub(r"^```(?:json)?", "", raw, flags=re.MULTILINE).strip()
        raw = re.sub(r"```$", "", raw, flags=re.MULTILINE).strip()
        plan = json.loads(raw)

        # Cache the plan
        with _meal_plan_lock:
            _meal_plan_cache[goal_h] = plan

        # Persist goal and plan in MongoDB
        db = get_db()
        goal["id"] = new_id()
        goal["user_id"] = user_id
        goal["created_at"] = now_iso()
        db.user_goals.insert_one(goal)

        meal_plan_entry = {
            "id": new_id(),
            "user_id": user_id,
            "goal_id": goal["id"],
            "week_label": f"Week of {date.today()}",
            "plan_json": plan,
            "generated_at": now_iso()
        }
        db.meal_plans.insert_one(meal_plan_entry)

        with _job_lock:
            _meal_plan_jobs[job_id] = {
                "status": "completed",
                "user_id": user_id,
                "plan": plan,
                "goal_id": goal["id"]
            }
    except Exception as e:
        with _job_lock:
            _meal_plan_jobs[job_id] = {
                "status": "failed",
                "user_id": user_id,
                "error": str(e)
            }


@goals_bp.route("/goals", methods=["POST"])
@require_auth
def set_goals():
    goal_schema = GoalSchema(**request.get_json())
    goal = goal_schema.model_dump()
    goal["id"] = new_id()
    goal["user_id"] = g.user_id
    goal["created_at"] = now_iso()
    db = get_db()
    db.user_goals.insert_one(goal)
    return jsonify(serialize_doc(goal))


@goals_bp.route("/goals", methods=["GET"])
@require_auth
def get_current_goals():
    db = get_db()
    goal = db.user_goals.find_one({"user_id": g.user_id}, sort=[("created_at", -1)])
    return jsonify(serialize_doc(goal) if goal else {})


@goals_bp.route("/goals/meal-plan", methods=["POST"])
@require_auth
def generate_meal_plan():
    goal_schema = GoalSchema(**request.get_json())
    goal = goal_schema.model_dump()
    db = get_db()

    # Check meal plan cache
    goal_h = _goal_hash(goal)
    with _meal_plan_lock:
        cached_plan = _meal_plan_cache.get(goal_h)
    if cached_plan:
        goal["id"] = new_id()
        goal["user_id"] = g.user_id
        goal["created_at"] = now_iso()
        db.user_goals.insert_one(goal)
        goal_id = goal["id"]
        return jsonify({"plan": cached_plan, "goal_id": goal_id, "cached": True, "status": "completed"})

    # Rate limit check
    if not gemini_limiter.allow():
        return jsonify({"error": "Rate limit reached. Please wait a moment."}), 429

    # Check if async generation is requested
    is_async = request.args.get("async") == "true" or request.headers.get("X-Async") == "true"

    if is_async:
        job_id = new_id()
        with _job_lock:
            _meal_plan_jobs[job_id] = {
                "status": "processing",
                "user_id": g.user_id,
                "created_at": now_iso()
            }
        _plan_executor.submit(_generate_plan_worker, job_id, g.user_id, goal, goal_h)
        return jsonify({"job_id": job_id, "status": "processing"}), 202

    # Synchronous path (fallback)
    job_id = new_id()
    _generate_plan_worker(job_id, g.user_id, goal, goal_h)
    with _job_lock:
        result = _meal_plan_jobs.get(job_id, {})
    if result.get("status") == "completed":
        return jsonify({"plan": result["plan"], "goal_id": result["goal_id"], "status": "completed"})
    return jsonify({"error": result.get("error", "Failed to generate meal plan")}), 500


@goals_bp.route("/goals/meal-plan/status/<job_id>", methods=["GET"])
@require_auth
def meal_plan_job_status(job_id):
    """Poll status of background meal plan generation."""
    with _job_lock:
        job = _meal_plan_jobs.get(job_id)
    if not job:
        return jsonify({"error": "Job not found or expired"}), 404
    if job.get("user_id") != g.user_id:
        return jsonify({"error": "Unauthorized"}), 403

    return jsonify(job)


@goals_bp.route("/goals/meal-plans", methods=["GET"])
@require_auth
def list_meal_plans():
    db = get_db()
    plans = db.meal_plans.find({"user_id": g.user_id}).sort("generated_at", -1).limit(10)
    return jsonify(serialize_docs(plans))
