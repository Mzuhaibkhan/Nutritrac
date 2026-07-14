"""Streak tracking route using MongoDB."""
from datetime import date, timedelta
from flask import Blueprint, jsonify, g
from ..mongo_client import get_db
from ..auth import require_auth

streaks_bp = Blueprint("streaks", __name__)


@streaks_bp.route("/streaks", methods=["GET"])
@require_auth
def get_streaks():
    """Calculate logging streaks for the user."""
    db = get_db()
    try:
        # Get unique logging dates from food_logs and activities
        food_dates = db.food_logs.distinct("log_date", {"user_id": g.user_id})
        activity_dates = db.activities.distinct("activity_date", {"user_id": g.user_id})
        water_dates = db.water_logs.distinct("log_date", {"user_id": g.user_id}) if hasattr(db, "water_logs") else []

        # Combine and sort unique dates (newest first)
        all_dates = sorted(list(set(food_dates + activity_dates + water_dates)), reverse=True)

        if not all_dates:
            return jsonify({
                "current_streak": 0,
                "longest_streak": 0,
                "total_active_days": 0
            })

        parsed_dates = []
        for d in all_dates:
            try:
                parsed_dates.append(date.fromisoformat(d))
            except (ValueError, TypeError):
                pass

        if not parsed_dates:
            return jsonify({
                "current_streak": 0,
                "longest_streak": 0,
                "total_active_days": 0
            })

        # Calculate current streak (must have logged today or yesterday to continue)
        today = date.today()
        yesterday = today - timedelta(days=1)

        current_streak = 0
        if parsed_dates[0] in (today, yesterday):
            current_streak = 1
            expected = parsed_dates[0] - timedelta(days=1)
            for d in parsed_dates[1:]:
                if d == expected:
                    current_streak += 1
                    expected -= timedelta(days=1)
                elif d > expected:
                    continue
                else:
                    break

        # Calculate longest streak
        asc_dates = sorted(parsed_dates)
        longest_streak = 1
        temp_streak = 1
        for i in range(1, len(asc_dates)):
            diff = (asc_dates[i] - asc_dates[i-1]).days
            if diff == 1:
                temp_streak += 1
            elif diff > 1:
                longest_streak = max(longest_streak, temp_streak)
                temp_streak = 1
        longest_streak = max(longest_streak, temp_streak)

        return jsonify({
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "total_active_days": len(parsed_dates)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
