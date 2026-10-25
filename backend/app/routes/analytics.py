import os
from datetime import date, timedelta
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
    include_raw = request.args.get("include_raw") == "true"

    food_match = {"user_id": g.user_id, "log_date": {"$gte": from_date}}

    # 1. Server-side daily nutrition aggregation pipeline
    daily_nutrition_pipeline = [
        {"$match": food_match},
        {
            "$group": {
                "_id": "$log_date",
                "calories": {"$sum": "$calories"},
                "protein_g": {"$sum": "$protein_g"},
                "carbs_g": {"$sum": "$carbs_g"},
                "fats_g": {"$sum": "$fats_g"},
                "cost": {"$sum": "$cost"},
            }
        },
        {"$sort": {"_id": 1}},
        {
            "$project": {
                "_id": 0,
                "date": "$_id",
                "calories": {"$round": ["$calories", 1]},
                "protein_g": {"$round": ["$protein_g", 1]},
                "carbs_g": {"$round": ["$carbs_g", 1]},
                "fats_g": {"$round": ["$fats_g", 1]},
                "cost": {"$round": ["$cost", 2]},
            }
        }
    ]
    daily_nutrition = list(db.food_logs.aggregate(daily_nutrition_pipeline))

    # 2. Server-side category breakdown aggregation pipeline
    category_pipeline = [
        {"$match": food_match},
        {
            "$group": {
                "_id": {"$ifNull": ["$category", "Other"]},
                "total_spend": {"$sum": "$cost"}
            }
        }
    ]
    categories = {
        doc["_id"]: round(doc.get("total_spend", 0) or 0, 2)
        for doc in db.food_logs.aggregate(category_pipeline)
    }

    # 3. Server-side daily activities aggregation pipeline
    activity_match = {"user_id": g.user_id, "activity_date": {"$gte": from_date}}
    activity_pipeline = [
        {"$match": activity_match},
        {
            "$group": {
                "_id": "$activity_date",
                "steps": {"$sum": "$steps"},
                "calories_burned": {"$sum": "$calories_burned"},
                "active_minutes": {"$sum": "$duration_minutes"}
            }
        },
        {"$sort": {"_id": 1}},
        {
            "$project": {
                "_id": 0,
                "date": "$_id",
                "steps": 1,
                "calories_burned": {"$round": ["$calories_burned", 1]},
                "active_minutes": {"$round": ["$active_minutes", 1]}
            }
        }
    ]
    daily_activities = list(db.activities.aggregate(activity_pipeline))

    raw_rows_data = {}
    if include_raw:
        rows = list(db.food_logs.find(food_match, {"_id": 0}).sort("log_date", 1))
        raw_rows_data["raw_rows"] = serialize_docs(rows)

    return jsonify({
        "daily_nutrition": daily_nutrition,
        "categories": categories,
        "daily_activities": daily_activities,
        **raw_rows_data
    })


@analytics_bp.route("/analytics/daily-summary", methods=["GET"])
@require_auth
def daily_summary():
    from_date = request.args.get("from")
    to_date = request.args.get("to")
    db = get_db()

    summary_pipeline = [
        {"$match": {"user_id": g.user_id, "log_date": {"$gte": from_date, "$lte": to_date}}},
        {
            "$group": {
                "_id": "$log_date",
                "calories": {"$sum": "$calories"}
            }
        }
    ]
    agg = {doc["_id"]: doc.get("calories", 0) for doc in db.food_logs.aggregate(summary_pipeline)}

    calorie_goal = int(os.environ.get("DEFAULT_DAILY_CALORIE_GOAL", 2000))
    result = {d: {"calories": c, "on_target": c <= calorie_goal} for d, c in agg.items()}
    return jsonify(result)
