import os
from datetime import date, timedelta
from collections import defaultdict
from flask import Blueprint, request, jsonify, g
from ..mongo_client import get_db, serialize_docs
from ..auth import require_auth

analytics_bp = Blueprint("analytics", __name__)

RANGE_DAYS = {"day": 1, "week": 7, "month": 30, "3m": 90, "6m": 180, "year": 365}


@analytics_bp.route("/analytics", methods=["GET"])
@require_auth
def analytics():
    range_ = request.args.get("range", "week")
    days = RANGE_DAYS.get(range_, 7)
    from_date = str(date.today() - timedelta(days=days))
    db = get_db()

    rows = list(db.food_logs.find({
        "user_id": g.user_id,
        "log_date": {"$gte": from_date}
    }).sort("log_date", 1))

    # Aggregate by date for chart-ready data
    daily = {}
    for r in rows:
        d = r["log_date"]
        if d not in daily:
            daily[d] = {"date": d, "calories": 0, "protein_g": 0, "carbs_g": 0, "fats_g": 0, "cost": 0}
        daily[d]["calories"] += r.get("calories", 0) or 0
        daily[d]["protein_g"] += r.get("protein_g", 0) or 0
        daily[d]["carbs_g"] += r.get("carbs_g", 0) or 0
        daily[d]["fats_g"] += r.get("fats_g", 0) or 0
        daily[d]["cost"] += r.get("cost", 0) or 0

    # Category breakdown
    categories = defaultdict(float)
    for r in rows:
        categories[r.get("category", "Other")] += r.get("cost", 0) or 0

    # Activity data
    activity_daily = {}
    activity_rows = list(db.activities.find({
        "user_id": g.user_id,
        "activity_date": {"$gte": from_date}
    }).sort("activity_date", 1))

    for r in activity_rows:
        d = r["activity_date"]
        if d not in activity_daily:
            activity_daily[d] = {"date": d, "steps": 0, "calories_burned": 0, "active_minutes": 0}
        activity_daily[d]["steps"] += r.get("steps", 0) or 0
        activity_daily[d]["calories_burned"] += r.get("calories_burned", 0) or 0
        activity_daily[d]["active_minutes"] += r.get("duration_minutes", 0) or 0

    return jsonify({
        "daily_nutrition": sorted(daily.values(), key=lambda x: x["date"]),
        "categories": dict(categories),
        "daily_activities": sorted(activity_daily.values(), key=lambda x: x["date"]),
        "raw_rows": serialize_docs(rows),
    })


@analytics_bp.route("/analytics/daily-summary", methods=["GET"])
@require_auth
def daily_summary():
    from_date = request.args.get("from")
    to_date = request.args.get("to")
    db = get_db()

    rows = list(db.food_logs.find({
        "user_id": g.user_id,
        "log_date": {"$gte": from_date, "$lte": to_date}
    }))

    calorie_goal = int(os.environ.get("DEFAULT_DAILY_CALORIE_GOAL", 2000))

    # Aggregate calories per day
    agg = {}
    for r in rows:
        d = r["log_date"]
        agg[d] = agg.get(d, 0) + (r.get("calories") or 0)

    result = {d: {"calories": c, "on_target": c <= calorie_goal} for d, c in agg.items()}
    return jsonify(result)
