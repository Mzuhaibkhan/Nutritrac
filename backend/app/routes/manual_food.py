"""Manual food logging — no Gemini API calls required."""
from flask import Blueprint, request, jsonify, g
from ..mongo_client import get_db, new_id, now_iso, serialize_doc
from ..auth import require_auth
from ..schemas import ManualFoodSchema
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
    data = ManualFoodSchema(**request.get_json())

    entry = {
        "id": new_id(),
        "user_id": g.user_id,
        "food_item": data.food_item.strip(),
        "calories": int(data.calories),
        "protein_g": float(data.protein_g),
        "carbs_g": float(data.carbs_g),
        "fats_g": float(data.fats_g),
        "fiber_g": float(data.fiber_g),
        "sugar_g": float(data.sugar_g),
        "sodium_mg": float(data.sodium_mg),
        "category": data.category if data.category in VALID_CATEGORIES else "Other",
        "meal_type": data.meal_type if data.meal_type in VALID_MEAL_TYPES else "lunch",
        "cost": float(data.cost),
        "log_date": data.log_date,
        "logged_at": now_iso(),
    }

    db = get_db()
    db.food_logs.insert_one(entry)
    return jsonify(serialize_doc(entry))
