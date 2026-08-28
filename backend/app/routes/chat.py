"""AI NutriBot Chat route using MongoDB and Gemini."""
import json
from datetime import date
from flask import Blueprint, request, jsonify, g
from ..mongo_client import get_db
from ..auth import require_auth
from ..gemini import model

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/chat", methods=["POST"])
@require_auth
def chat():
    data = request.get_json()
    if not data or not data.get("message"):
        return jsonify({"error": "Message is required"}), 400

    user_msg = data["message"]
    db = get_db()

    # 1. Fetch profile/goals
    profile = db.user_profiles.find_one({"user_id": g.user_id}) or {}

    # 2. Fetch today's food logs
    today_str = str(date.today())
    food_logs = list(db.food_logs.find({"user_id": g.user_id, "log_date": today_str}))

    # 3. Fetch today's activities
    activities = list(db.activities.find({"user_id": g.user_id, "activity_date": today_str}))

    context = f"""You are NutriBot, a helpful AI health & nutrition coach.
You give encouraging, actionable, and personalized advice based on the user's daily goals, logged meals, and workouts.

User Profile / Daily Goals:
- Target Calories: {profile.get('daily_calorie_goal', 2000)} kcal
- Target Protein: {profile.get('daily_protein_goal_g', 150)}g
- Target Carbs: {profile.get('daily_carbs_goal_g', 250)}g
- Target Fat: {profile.get('daily_fats_goal_g', 65)}g
- Daily Budget: {profile.get('daily_budget_usd', 500)} (INR)
- Target Steps: {profile.get('daily_step_goal', 10000)}
- Target Active Minutes: {profile.get('daily_active_minutes_goal', 30)}

Today's Logged Meals:
{json.dumps([{ 'food_item': f['food_item'], 'calories': f['calories'], 'protein': f.get('protein_g', 0), 'carbs': f.get('carbs_g', 0), 'fats': f.get('fats_g', 0), 'cost_inr': f.get('cost_inr', 0) } for f in food_logs], indent=2)}

Today's Logged Physical Activities:
{json.dumps([{ 'title': a['title'], 'calories_burned': a['calories_burned'], 'distance_km': a.get('distance_km', 0), 'duration_minutes': a['duration_minutes'] } for a in activities], indent=2)}

Answer the user's question concisely in markdown.
User's message: "{user_msg}"
"""

    response = model.generate_content(context)
    return jsonify({"reply": response.text})
