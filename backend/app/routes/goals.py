import os
import json
import re
from datetime import date, timedelta, datetime
from collections import defaultdict
from flask import Blueprint, request, jsonify, g
from ..mongo_client import get_db, serialize_docs, serialize_doc, new_id, now_iso
from ..auth import require_auth
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

# Cache for meal plans by goal hash
_meal_plan_cache = {}


def _goal_hash(goal: dict) -> str:
    import hashlib
    key_fields = sorted((k, v) for k, v in goal.items() if k not in ("goal_description", "user_id"))
    return hashlib.md5(str(key_fields).encode()).hexdigest()


def _get_avg_intake(user_id: str) -> dict:
    db = get_db()
    from_date = str(date.today() - timedelta(days=30))
    rows = list(db.food_logs.find({
        "user_id": user_id,
        "log_date": {"$gte": from_date}
    }))
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


@goals_bp.route("/goals", methods=["POST"])
@require_auth
def save_goal():
    data = request.get_json()
    db = get_db()
    
    goal_id = new_id()
    data["id"] = goal_id
    data["user_id"] = g.user_id
    data["created_at"] = now_iso()
    
    db.user_goals.insert_one(data)
    return jsonify(serialize_doc(data))


@goals_bp.route("/goals", methods=["GET"])
@require_auth
def get_goal():
    db = get_db()
    goal = db.user_goals.find_one({"user_id": g.user_id}, sort=[("created_at", -1)])
    return jsonify(serialize_doc(goal) if goal else {})


@goals_bp.route("/goals/meal-plan", methods=["POST"])
@require_auth
def generate_meal_plan():
    goal = request.get_json()
    db = get_db()

    # Check meal plan cache
    goal_h = _goal_hash(goal)
    if goal_h in _meal_plan_cache:
        cached_plan = _meal_plan_cache[goal_h]
        # Still save to DB
        goal["id"] = new_id()
        goal["user_id"] = g.user_id
        goal["created_at"] = now_iso()
        db.user_goals.insert_one(goal)
        goal_id = goal["id"]
        return jsonify({"plan": cached_plan, "goal_id": goal_id, "cached": True})

    # Rate limit
    if not gemini_limiter.allow():
        return jsonify({"error": "Rate limit reached. Please wait a moment."}), 429

    avg = _get_avg_intake(g.user_id)

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
    _meal_plan_cache[goal_h] = plan

    # Save goal + plan
    goal["id"] = new_id()
    goal["user_id"] = g.user_id
    goal["created_at"] = now_iso()
    db.user_goals.insert_one(goal)
    
    meal_plan_entry = {
        "id": new_id(),
        "user_id": g.user_id,
        "goal_id": goal["id"],
        "week_label": f"Week of {date.today()}",
        "plan_json": plan,
        "generated_at": now_iso()
    }
    db.meal_plans.insert_one(meal_plan_entry)

    return jsonify({"plan": plan, "goal_id": goal["id"]})


@goals_bp.route("/goals/meal-plans", methods=["GET"])
@require_auth
def list_meal_plans():
    db = get_db()
    plans = db.meal_plans.find({"user_id": g.user_id}).sort("generated_at", -1).limit(10)
    return jsonify(serialize_docs(plans))
