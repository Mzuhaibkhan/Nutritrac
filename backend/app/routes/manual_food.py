"""Manual food logging — no Gemini API calls required."""
from flask import Blueprint, request, jsonify, g
from ..mongo_client import get_db, new_id, now_iso, serialize_doc
from ..auth import require_auth
from datetime import date

manual_food_bp = Blueprint("manual_food", __name__)

VALID_CATEGORIES = {
    "Fast Food", "Healthy", "Protein", "Fruit", "Vegetable",
    "Dairy", "Grain", "Snack", "Beverage", "Other"
}
VALID_MEAL_TYPES = {"breakfast", "lunch", "dinner", "snack"}


@manual_food_bp.route("/food/manual", methods=["POST"])
@require_auth
def manual_log():
    """Log a meal with manually entered nutrition data — zero API cost."""
    data = request.get_json()

    food_item = (data.get("food_item") or "").strip()
    if not food_item:
        return jsonify({"error": "Food item name is required"}), 400

    calories = data.get("calories")
    if calories is None or not isinstance(calories, (int, float)) or calories < 0:
        return jsonify({"error": "Valid calorie count is required"}), 400

    entry = {
        "id": new_id(),
        "user_id": g.user_id,
        "food_item": food_item,
        "calories": int(calories),
        "protein_g": float(data.get("protein_g", 0) or 0),
        "carbs_g": float(data.get("carbs_g", 0) or 0),
        "fats_g": float(data.get("fats_g", 0) or 0),
        "fiber_g": float(data.get("fiber_g", 0) or 0),
        "sugar_g": float(data.get("sugar_g", 0) or 0),
        "sodium_mg": float(data.get("sodium_mg", 0) or 0),
        "category": data.get("category", "Other") if data.get("category") in VALID_CATEGORIES else "Other",
        "meal_type": data.get("meal_type", "lunch") if data.get("meal_type") in VALID_MEAL_TYPES else "lunch",
        "cost": float(data.get("cost", 0) or 0),
        "log_date": data.get("log_date", str(date.today())),
        "logged_at": now_iso(),
    }

    db = get_db()
    db.food_logs.insert_one(entry)
    return jsonify(serialize_doc(entry))
