import os
import json
import re
from flask import Blueprint, request, jsonify, g
from ..supabase_client import supabase
from ..auth import require_auth
from ..gemini import model, gemini_limiter, cache_key, get_cached, set_cached

llm_bp = Blueprint("llm", __name__)

NUTRITION_PROMPT = """You are a precise nutrition extraction API.
Given a food description, extract nutritional data and return ONLY valid JSON.

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
  "cost": float (USD)
}}

Food description: "{text}"
Meal type hint: "{meal_type}"
"""

def extract_json(text):
    """Robustly extract JSON from a string that might contain markdown."""
    try:
        # Find anything between { and }
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return json.loads(text)
    except Exception:
        # Fallback: remove markdown backticks manually
        clean = re.sub(r'```json|```', '', text).strip()
        return json.loads(clean)

@llm_bp.route("/analyze", methods=["POST"])
@require_auth
def analyze():
    data = request.get_json()
    text = data.get("text", "").strip()
    meal_type = data.get("meal_type", "lunch")

    if not text:
        return jsonify({"error": "No description provided"}), 400

    # Check cache first
    key = cache_key(text, meal_type)
    cached = get_cached(key)
    if cached:
        # Return cached result but still save a new log entry
        nutrition = dict(cached)
        nutrition["meal_type"] = meal_type
        nutrition["user_id"] = g.user_id
        try:
            supabase.table("food_logs").insert(nutrition).execute()
        except Exception as db_err:
            print(f"Database error (skipping save): {db_err}")
        return jsonify(nutrition)

    # Rate limit check
    if not gemini_limiter.allow():
        return jsonify({"error": "Rate limit reached. Please wait a moment before trying again."}), 429

    try:
        # Call Gemini
        response = model.generate_content(NUTRITION_PROMPT.format(text=text, meal_type=meal_type))

        if not response.text:
            return jsonify({"error": "Gemini returned an empty response. Check your API key or quota."}), 500

        nutrition = extract_json(response.text)
        nutrition["meal_type"] = meal_type
        nutrition["user_id"] = g.user_id

        # Cache the result (without user_id)
        cache_data = {k: v for k, v in nutrition.items() if k != "user_id"}
        set_cached(key, cache_data)

        # Attempt to save to Supabase
        try:
            supabase.table("food_logs").insert(nutrition).execute()
        except Exception as db_err:
            print(f"Database error (skipping save): {db_err}")
            # We still return the data even if DB save fails for this demo

        return jsonify(nutrition)

    except Exception as e:
        # Return the actual error message for debugging
        return jsonify({"error": f"Gemini Error: {str(e)}"}), 500
