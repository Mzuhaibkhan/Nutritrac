"""Water intake tracker route using MongoDB."""
from datetime import date
from flask import Blueprint, request, jsonify, g
from ..mongo_client import get_db, serialize_docs, serialize_doc, new_id, now_iso
from ..auth import require_auth

water_bp = Blueprint("water", __name__)


@water_bp.route("/water", methods=["POST"])
@require_auth
def log_water():
    """Log water intake in ml."""
    data = request.get_json()
    if not data or not data.get("amount_ml"):
        return jsonify({"error": "amount_ml is required"}), 400

    try:
        amount_ml = int(data["amount_ml"])
        if amount_ml <= 0 or amount_ml > 5000:
            return jsonify({"error": "Invalid water amount"}), 400
    except ValueError:
        return jsonify({"error": "amount_ml must be an integer"}), 400

    db = get_db()
    entry = {
        "id": new_id(),
        "user_id": g.user_id,
        "amount_ml": amount_ml,
        "log_date": data.get("log_date", str(date.today())),
        "logged_at": now_iso()
    }

    try:
        db.water_logs.insert_one(entry)
        return jsonify(serialize_doc(entry))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@water_bp.route("/water", methods=["GET"])
@require_auth
def get_water():
    """Get total logged water intake for a date or date range."""
    date_filter = request.args.get("date") or str(date.today())
    db = get_db()

    try:
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
    except Exception as e:
        return jsonify({"error": str(e)}), 500
