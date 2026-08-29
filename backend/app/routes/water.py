"""Water intake tracker route using MongoDB."""
from datetime import date
from flask import Blueprint, request, jsonify, g
from ..mongo_client import get_db, serialize_docs, serialize_doc, new_id, now_iso
from ..auth import require_auth
from ..schemas import WaterLogSchema

water_bp = Blueprint("water", __name__)


@water_bp.route("/water", methods=["POST"])
@require_auth
def log_water():
    data = WaterLogSchema(**request.get_json())

    db = get_db()
    entry = {
        "id": new_id(),
        "user_id": g.user_id,
        "amount_ml": data.amount_ml,
        "log_date": data.log_date,
        "logged_at": now_iso()
    }

    db.water_logs.insert_one(entry)
    return jsonify(serialize_doc(entry))


@water_bp.route("/water", methods=["GET"])
@require_auth
def get_water():
    """Get total logged water intake for a date or date range."""
    date_filter = request.args.get("date") or str(date.today())
    db = get_db()

    # Sum today's logs
    logs = list(db.water_logs.find({
        "user_id": g.user_id,
        "log_date": date_filter
    }))
    total_ml = sum(l.get("amount_ml", 0) for l in logs)

    # Get target goal from profile settings, default to 3000ml
    profile = db.user_profiles.find_one({"user_id": g.user_id}) or {}
    goal_ml = profile.get("daily_water_goal_ml", 3000)

    return jsonify({
        "date": date_filter,
        "total_ml": total_ml,
        "goal_ml": goal_ml,
        "logs": serialize_docs(logs)
    })
