import os
import json
import re
from datetime import date
from flask import Blueprint, request, jsonify, g
from ..mongo_client import get_db, new_id, now_iso, serialize_doc
from ..auth import require_auth
from ..gemini import model, gemini_limiter, cache_key, get_cached, set_cached

llm_bp = Blueprint("llm", __name__)

NUTRITION_PROMPT = """You are a precise nutrition extraction API.
Given a food description or meal image analysis, extract nutritional data and return ONLY valid JSON.

Schema:
{{
  "food_item": "string",
  "calories": integer,
  "protein_g": float,
  "carbs_g": float,
  "fats_g": float,
  "fiber_g": float,
  "sugar_g": float,
  "sodium_mg": float,
  "category": "one of: Fast Food, Healthy, Protein, Fruit, Vegetable, Dairy, Grain, Snack, Beverage, Other",
  "meal_type": "one of: breakfast, lunch, dinner, snack",
  "cost": float (estimated cost in USD),
  "cost_inr": float (estimated cost in INR)
}}

Food description: "{text}"
Meal type hint: "{meal_type}"
"""

def extract_json(text):
    """Robustly extract JSON from a string that might contain markdown."""
    try:
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return json.loads(text)
    except Exception:
        clean = re.sub(r'```json|```', '', text).strip()
        return json.loads(clean)

@llm_bp.route("/analyze", methods=["POST"])
@require_auth
def analyze():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No description provided"}), 400

    text = data.get("text", "").strip()
    meal_type = data.get("meal_type", "lunch")

    if not text:
        return jsonify({"error": "No description provided"}), 400

    # Check cache first
    key = cache_key(text, meal_type)
    cached = get_cached(key)
    if cached:
        nutrition = dict(cached)
        nutrition["id"] = new_id()
        nutrition["user_id"] = g.user_id
        nutrition["meal_type"] = meal_type
        nutrition["log_date"] = str(date.today())
        nutrition["logged_at"] = now_iso()

        # Add default INR cost if missing
        if "cost_inr" not in nutrition:
            nutrition["cost_inr"] = round(nutrition.get("cost", 0.0) * 83.5, 2)

        try:
            db = get_db()
            db.food_logs.insert_one(nutrition)
        except Exception as db_err:
            print(f"Database error (skipping save): {db_err}")
        return jsonify(serialize_doc(nutrition))

    # Rate limit check
    if not gemini_limiter.allow():
        return jsonify({"error": "Rate limit reached. Please wait a moment before trying again."}), 429

    try:
        response = model.generate_content(NUTRITION_PROMPT.format(text=text, meal_type=meal_type))
        if not response.text:
            return jsonify({"error": "Gemini returned an empty response."}), 500

        nutrition = extract_json(response.text)
        nutrition["id"] = new_id()
        nutrition["user_id"] = g.user_id
        nutrition["meal_type"] = meal_type
        nutrition["log_date"] = str(date.today())
        nutrition["logged_at"] = now_iso()

        if "cost" not in nutrition:
            nutrition["cost"] = 0.0
        if "cost_inr" not in nutrition:
            nutrition["cost_inr"] = round(nutrition["cost"] * 83.5, 2)

        # Cache the result (without user_id, id, dates)
        cache_data = {k: v for k, v in nutrition.items() if k not in ("user_id", "id", "log_date", "logged_at")}
        set_cached(key, cache_data)

        # Save to MongoDB
        db = get_db()
        db.food_logs.insert_one(nutrition)

        return jsonify(serialize_doc(nutrition))

    except Exception as e:
        return jsonify({"error": f"Gemini Error: {str(e)}"}), 500


@llm_bp.route("/analyze-image", methods=["POST"])
@require_auth
def analyze_image():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    meal_type = request.form.get("meal_type", "lunch")

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    image_bytes = file.read()
    mime_type = file.mimetype or "image/jpeg"

    # Rate limit check
    if not gemini_limiter.allow():
        return jsonify({"error": "Rate limit reached. Please wait a moment."}), 429

    prompt = NUTRITION_PROMPT.format(
        text="Extract nutritional information from the food present in this image.",
        meal_type=meal_type
    )

    try:
        response = model.generate_content_with_image(prompt, image_bytes, mime_type)
        if not response.text:
            return jsonify({"error": "Gemini Vision returned an empty response."}), 500

        nutrition = extract_json(response.text)
        nutrition["id"] = new_id()
        nutrition["user_id"] = g.user_id
        nutrition["meal_type"] = meal_type
        nutrition["log_date"] = str(date.today())
        nutrition["logged_at"] = now_iso()

        if "cost" not in nutrition:
            nutrition["cost"] = 0.0
        if "cost_inr" not in nutrition:
            nutrition["cost_inr"] = round(nutrition["cost"] * 83.5, 2)

        # Save to MongoDB
        db = get_db()
        db.food_logs.insert_one(nutrition)

        return jsonify(serialize_doc(nutrition))

    except Exception as e:
        return jsonify({"error": f"Gemini Vision Error: {str(e)}"}), 500
