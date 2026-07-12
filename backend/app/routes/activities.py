"""Activity tracking CRUD + aggregations using MongoDB."""
from datetime import date, timedelta
from collections import defaultdict
from flask import Blueprint, request, jsonify, g
from ..mongo_client import get_db, serialize_docs, serialize_doc, new_id, now_iso
from ..auth import require_auth

activities_bp = Blueprint("activities", __name__)

VALID_ACTIVITY_TYPES = {
    "walking", "running", "cycling", "gym", "yoga",
    "swimming", "hiking", "sports", "other"
}


@activities_bp.route("/activities", methods=["POST"])
@require_auth
def create_activity():
    """Log a new activity."""
    data = request.get_json()
    db = get_db()

    activity_type = (data.get("activity_type") or "other").lower()
    if activity_type not in VALID_ACTIVITY_TYPES:
        activity_type = "other"

    entry = {
        "id": new_id(),
        "user_id": g.user_id,
        "activity_type": activity_type,
        "title": data.get("title", "").strip() or f"{activity_type.title()} session",
        "steps": int(data.get("steps", 0) or 0),
        "distance_km": float(data.get("distance_km", 0) or 0),
        "duration_minutes": float(data.get("duration_minutes", 0) or 0),
        "calories_burned": float(data.get("calories_burned", 0) or 0),
        "heart_rate_avg": int(data.get("heart_rate_avg", 0) or 0) or None,
        "activity_date": data.get("activity_date", str(date.today())),
        "start_time": data.get("start_time") or None,
        "end_time": data.get("end_time") or None,
        "source": data.get("source", "manual"),
        "source_id": data.get("source_id") or None,
        "notes": data.get("notes", "").strip() or None,
        "created_at": now_iso()
    }

    try:
        db.activities.insert_one(entry)
        return jsonify(serialize_doc(entry))
    except Exception as e:
        return jsonify({"error": f"Failed to save activity: {str(e)}"}), 500


@activities_bp.route("/activities", methods=["GET"])
@require_auth
def list_activities():
    """List activities with optional date filters."""
    date_filter = request.args.get("date")
    from_date = request.args.get("from")
    to_date = request.args.get("to")
    activity_type = request.args.get("type")
    db = get_db()

    try:
        query = {"user_id": g.user_id}
        if date_filter:
            query["activity_date"] = date_filter
        elif from_date and to_date:
            query["activity_date"] = {"$gte": from_date, "$lte": to_date}
        if activity_type:
            query["activity_type"] = activity_type
            
        docs = db.activities.find(query).sort([("activity_date", -1), ("created_at", -1)]).limit(100)
        return jsonify(serialize_docs(docs))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@activities_bp.route("/activities/<activity_id>", methods=["DELETE"])
@require_auth
def delete_activity(activity_id):
    """Delete an activity owned by the current user."""
    try:
        db = get_db()
        db.activities.delete_one({"id": activity_id, "user_id": g.user_id})
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@activities_bp.route("/activities/summary", methods=["GET"])
@require_auth
def activity_summary():
    """Get aggregated activity data for a time range."""
    range_ = request.args.get("range", "week")
    range_days = {"day": 1, "week": 7, "month": 30, "3m": 90, "6m": 180, "year": 365}
    days = range_days.get(range_, 7)
    from_date = str(date.today() - timedelta(days=days))
    db = get_db()

    try:
        rows = list(db.activities.find({
            "user_id": g.user_id,
            "activity_date": {"$gte": from_date}
        }).sort("activity_date", 1))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
