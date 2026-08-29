"""Activity tracking CRUD + aggregations using MongoDB."""
from datetime import date, timedelta
from collections import defaultdict
from flask import Blueprint, request, jsonify, g
from ..mongo_client import get_db, serialize_docs, serialize_doc, new_id, now_iso
from ..auth import require_auth
from ..schemas import ActivitySchema

activities_bp = Blueprint("activities", __name__)

VALID_ACTIVITY_TYPES = {
    "walking", "running", "cycling", "gym", "yoga",
    "swimming", "hiking", "sports", "other"
}


@activities_bp.route("/activities", methods=["POST"])
@require_auth
def create_activity():
    """Log a new activity."""
    data = ActivitySchema(**request.get_json())
    db = get_db()

    activity_type = data.activity_type.lower()
    if activity_type not in VALID_ACTIVITY_TYPES:
        activity_type = "other"

    entry = {
        "id": new_id(),
        "user_id": g.user_id,
        "activity_type": activity_type,
        "title": data.title.strip() if data.title else f"{activity_type.title()} session",
        "steps": data.steps,
        "distance_km": data.distance_km,
        "duration_minutes": data.duration_minutes,
        "calories_burned": data.calories_burned,
        "heart_rate_avg": data.heart_rate_avg,
        "activity_date": data.activity_date,
        "start_time": data.start_time,
        "end_time": data.end_time,
        "source": data.source,
        "source_id": data.source_id,
        "notes": data.notes.strip() if data.notes else None,
        "created_at": now_iso()
    }

    db.activities.insert_one(entry)
    return jsonify(serialize_doc(entry))


@activities_bp.route("/activities", methods=["GET"])
@require_auth
def list_activities():
    """List activities with optional date filters."""
    date_filter = request.args.get("date")
    from_date = request.args.get("from")
    to_date = request.args.get("to")
    activity_type = request.args.get("type")
    db = get_db()

    query = {"user_id": g.user_id}
    if date_filter:
        query["activity_date"] = date_filter
    elif from_date and to_date:
        query["activity_date"] = {"$gte": from_date, "$lte": to_date}
    if activity_type:
        query["activity_type"] = activity_type
        
    docs = db.activities.find(query).sort([("activity_date", -1), ("created_at", -1)]).limit(100)
    return jsonify(serialize_docs(docs))


@activities_bp.route("/activities/<activity_id>", methods=["DELETE"])
@require_auth
def delete_activity(activity_id):
    """Delete an activity owned by the current user."""
    db = get_db()
    db.activities.delete_one({"id": activity_id, "user_id": g.user_id})
    return jsonify({"success": True})


@activities_bp.route("/activities/summary", methods=["GET"])
@require_auth
def activity_summary():
    """Get aggregated activity data for a time range."""
    range_ = request.args.get("range", "week")
    range_days = {"day": 1, "week": 7, "month": 30, "3m": 90, "6m": 180, "year": 365}
    days = range_days.get(range_, 7)
    from_date = str(date.today() - timedelta(days=days))
    db = get_db()

    rows = list(db.activities.find({
        "user_id": g.user_id,
        "activity_date": {"$gte": from_date}
    }).sort("activity_date", 1))

    # Daily aggregation
    daily = {}
    type_counts = defaultdict(int)
    totals = {"steps": 0, "distance_km": 0, "active_minutes": 0, "calories_burned": 0, "count": 0}

    for r in rows:
        d = r["activity_date"]
        if d not in daily:
            daily[d] = {"date": d, "steps": 0, "distance_km": 0, "active_minutes": 0, "calories_burned": 0, "count": 0}
        daily[d]["steps"] += r.get("steps", 0) or 0
        daily[d]["distance_km"] += r.get("distance_km", 0) or 0
        daily[d]["active_minutes"] += r.get("duration_minutes", 0) or 0
        daily[d]["calories_burned"] += r.get("calories_burned", 0) or 0
        daily[d]["count"] += 1

        type_counts[r.get("activity_type", "other")] += 1

        totals["steps"] += r.get("steps", 0) or 0
        totals["distance_km"] += r.get("distance_km", 0) or 0
        totals["active_minutes"] += r.get("duration_minutes", 0) or 0
        totals["calories_burned"] += r.get("calories_burned", 0) or 0
        totals["count"] += 1

    return jsonify({
        "daily": sorted(daily.values(), key=lambda x: x["date"]),
        "type_counts": dict(type_counts),
        "totals": totals,
    })
