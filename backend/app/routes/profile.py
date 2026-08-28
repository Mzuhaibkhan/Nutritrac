"""User profile settings CRUD using MongoDB with currency preferences."""
from flask import Blueprint, request, jsonify, g
from ..mongo_client import get_db, serialize_doc, now_iso
from ..auth import require_auth

profile_bp = Blueprint("profile", __name__)


@profile_bp.route("/profile", methods=["GET"])
@require_auth
def get_profile():
    """Retrieve user health targets and settings."""
    db = get_db()
    profile = db.user_profiles.find_one({"user_id": g.user_id})
    if not profile:
        # Create default profile
        profile = {
            "user_id": g.user_id,
            "display_name": g.user_id[:8],
            "daily_calorie_goal": 2000,
            "daily_protein_goal_g": 150,
            "daily_carbs_goal_g": 250,
            "daily_fats_goal_g": 65,
            "daily_budget_usd": 500,  # Actually stores amount in user's currency preference
            "preferred_currency": "INR",  # Defaults to INR
            "daily_step_goal": 10000,
            "daily_active_minutes_goal": 30,
            "daily_water_goal_ml": 3000,
            "created_at": now_iso(),
            "updated_at": now_iso()
        }
        db.user_profiles.insert_one(profile)
    return jsonify(serialize_doc(profile))


@profile_bp.route("/profile", methods=["POST"])
@require_auth
def save_profile():
    """Save user health targets."""
    data = request.get_json()
    db = get_db()

    preferred_currency = data.get("preferred_currency", "INR")
    if preferred_currency not in ("INR", "USD"):
        preferred_currency = "INR"

    update_fields = {
        "daily_calorie_goal": int(data.get("daily_calorie_goal", 2000)),
        "daily_protein_goal_g": int(data.get("daily_protein_goal_g", 150)),
        "daily_carbs_goal_g": int(data.get("daily_carbs_goal_g", 250)),
        "daily_fats_goal_g": int(data.get("daily_fats_goal_g", 65)),
        "daily_budget_usd": float(data.get("daily_budget_usd", 500)),
        "preferred_currency": preferred_currency,
        "daily_step_goal": int(data.get("daily_step_goal", 10000)),
        "daily_active_minutes_goal": int(data.get("daily_active_minutes_goal", 30)),
        "daily_water_goal_ml": int(data.get("daily_water_goal_ml", 3000)),
        "display_name": data.get("display_name", "").strip() or g.user_id[:8],
        "updated_at": now_iso()
    }

    db.user_profiles.update_one(
        {"user_id": g.user_id},
        {"$set": update_fields},
        upsert=True
    )
    return jsonify({"success": True, "profile": update_fields})
