from datetime import date, timedelta
from collections import defaultdict
from flask import Blueprint, request, jsonify, g
from ..mongo_client import get_db
from ..auth import require_auth

compare_bp = Blueprint("compare", __name__)


def _sum_period(user_id: str, from_d: str, to_d: str) -> dict:
    db = get_db()
    rows = list(db.food_logs.find({
        "user_id": user_id,
        "log_date": {"$gte": from_d, "$lte": to_d}
    }))
    totals = defaultdict(float)
    for r in rows:
        totals["calories"] += r.get("calories", 0) or 0
        totals["protein"]  += r.get("protein_g", 0) or 0
        totals["carbs"]    += r.get("carbs_g", 0) or 0
        totals["fats"]     += r.get("fats_g", 0) or 0
        totals["spend"]    += r.get("cost", 0) or 0
    return dict(totals)


def _sum_activities(user_id: str, from_d: str, to_d: str) -> dict:
    db = get_db()
    rows = list(db.activities.find({
        "user_id": user_id,
        "activity_date": {"$gte": from_d, "$lte": to_d}
    }))
    totals = defaultdict(float)
    for r in rows:
        totals["steps"] += r.get("steps", 0) or 0
        totals["calories_burned"] += r.get("calories_burned", 0) or 0
        totals["active_minutes"] += r.get("duration_minutes", 0) or 0
        totals["distance_km"] += r.get("distance_km", 0) or 0
    return dict(totals)


@compare_bp.route("/compare", methods=["GET"])
@require_auth
def compare():
    mode = request.args.get("mode", "week")
    today = date.today()

    if mode == "week":
        this_start = today - timedelta(days=today.weekday())
        this_end   = today
        last_start = this_start - timedelta(weeks=1)
        last_end   = this_start - timedelta(days=1)
    elif mode == "year":
        this_start = today.replace(month=1, day=1)
        this_end   = today
        last_start = (this_start - timedelta(days=1)).replace(month=1, day=1)
        last_end   = this_start - timedelta(days=1)
    else:  # month
        this_start = today.replace(day=1)
        this_end   = today
        last_month = (this_start - timedelta(days=1)).replace(day=1)
        last_start = last_month
        last_end   = this_start - timedelta(days=1)

    this_nutrition = _sum_period(g.user_id, str(this_start), str(this_end))
    last_nutrition = _sum_period(g.user_id, str(last_start), str(last_end))

    this_activities = _sum_activities(g.user_id, str(this_start), str(this_end))
    last_activities = _sum_activities(g.user_id, str(last_start), str(last_end))

    return jsonify({
        "this_period": this_nutrition,
        "last_period": last_nutrition,
        "this_activities": this_activities,
        "last_activities": last_activities,
        "period": mode,
        "this_range": f"{this_start} to {this_end}",
        "last_range": f"{last_start} to {last_end}",
    })
