"""Strava OAuth + activity sync integration using MongoDB."""
import os
import requests
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g, redirect
from ..mongo_client import get_db, serialize_doc, new_id, now_iso
from ..auth import require_auth

strava_bp = Blueprint("strava", __name__)

STRAVA_CLIENT_ID = os.environ.get("STRAVA_CLIENT_ID", "")
STRAVA_CLIENT_SECRET = os.environ.get("STRAVA_CLIENT_SECRET", "")
STRAVA_REDIRECT_URI = os.environ.get("STRAVA_REDIRECT_URI", "http://localhost:5000/api/strava/callback")

STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize"
STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"
STRAVA_API_BASE = "https://www.strava.com/api/v3"

# Map Strava sport types to our activity types
STRAVA_TYPE_MAP = {
    "Run": "running",
    "Walk": "walking",
    "Ride": "cycling",
    "Swim": "swimming",
    "Hike": "hiking",
    "Yoga": "yoga",
    "WeightTraining": "gym",
    "Workout": "gym",
}


@strava_bp.route("/strava/connect", methods=["GET"])
@require_auth
def strava_connect():
    """Initiate Strava OAuth flow."""
    if not STRAVA_CLIENT_ID:
        return jsonify({"error": "Strava integration not configured. Set STRAVA_CLIENT_ID."}), 503

    auth_url = (
        f"{STRAVA_AUTH_URL}?"
        f"client_id={STRAVA_CLIENT_ID}&"
        f"redirect_uri={STRAVA_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=activity:read_all&"
        f"state={g.user_id}"
    )
    return jsonify({"auth_url": auth_url})


@strava_bp.route("/strava/callback", methods=["GET"])
def strava_callback():
    """Handle Strava OAuth callback — exchange code for tokens."""
    code = request.args.get("code")
    user_id = request.args.get("state")
    db = get_db()

    if not code or not user_id:
        return jsonify({"error": "Missing code or state"}), 400

    try:
        resp = requests.post(STRAVA_TOKEN_URL, data={
            "client_id": STRAVA_CLIENT_ID,
            "client_secret": STRAVA_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
        })
        resp.raise_for_status()
        tokens = resp.json()

        # Store tokens in MongoDB
        db.connected_apps.update_one(
            {"user_id": user_id, "provider": "strava"},
            {"$set": {
                "access_token": tokens["access_token"],
                "refresh_token": tokens["refresh_token"],
                "token_expires_at": datetime.fromtimestamp(tokens["expires_at"], timezone.utc).isoformat(),
                "athlete_id": str(tokens.get("athlete", {}).get("id", "")),
                "connected_at": now_iso()
            }},
            upsert=True
        )

        # Redirect to settings page
        frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
        return redirect(f"{frontend_url}/settings?strava=connected")

    except Exception as e:
        return jsonify({"error": f"Strava auth failed: {str(e)}"}), 500


def _refresh_strava_token(connection: dict) -> str | None:
    """Refresh an expired Strava access token."""
    db = get_db()
    try:
        resp = requests.post(STRAVA_TOKEN_URL, data={
            "client_id": STRAVA_CLIENT_ID,
            "client_secret": STRAVA_CLIENT_SECRET,
            "refresh_token": connection["refresh_token"],
            "grant_type": "refresh_token",
        })
        resp.raise_for_status()
        tokens = resp.json()

        db.connected_apps.update_one(
            {"_id": connection["_id"]},
            {"$set": {
                "access_token": tokens["access_token"],
                "refresh_token": tokens["refresh_token"],
                "token_expires_at": datetime.fromtimestamp(tokens["expires_at"], timezone.utc).isoformat(),
            }}
        )

        return tokens["access_token"]
    except Exception:
        return None


@strava_bp.route("/strava/sync", methods=["POST"])
@require_auth
def strava_sync():
    """Sync recent Strava activities into the activities table."""
    db = get_db()
    try:
        connection = db.connected_apps.find_one({"user_id": g.user_id, "provider": "strava"})
        if not connection:
            return jsonify({"error": "Strava not connected"}), 400

        access_token = connection["access_token"]

        # Check if token needs refresh
        expires_at = datetime.fromisoformat(connection["token_expires_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) >= expires_at:
            access_token = _refresh_strava_token(connection)
            if not access_token:
                return jsonify({"error": "Failed to refresh Strava token. Please reconnect."}), 401

        # Fetch activities from last 30 days
        after = int((datetime.now(timezone.utc).timestamp()) - 30 * 86400)
        resp = requests.get(
            f"{STRAVA_API_BASE}/athlete/activities",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"after": after, "per_page": 100},
        )
        resp.raise_for_status()
        strava_activities = resp.json()

        synced = 0
        for act in strava_activities:
            strava_id = str(act["id"])

            # Skip if already synced
            existing = db.activities.find_one({
                "user_id": g.user_id,
                "source": "strava",
                "source_id": strava_id
            })
            if existing:
                continue

            # Map to our schema
            activity_type = STRAVA_TYPE_MAP.get(act.get("sport_type", ""), "other")
            start_dt = datetime.fromisoformat(act["start_date_local"].replace("Z", "+00:00"))

            entry = {
                "id": new_id(),
                "user_id": g.user_id,
                "activity_type": activity_type,
                "title": act.get("name", "Strava Activity"),
                "steps": 0,
                "distance_km": round((act.get("distance", 0) or 0) / 1000, 2),
                "duration_minutes": round((act.get("moving_time", 0) or 0) / 60, 1),
                "calories_burned": float(act.get("calories", 0) or 0),
                "heart_rate_avg": int(act.get("average_heartrate", 0) or 0) or None,
                "activity_date": start_dt.strftime("%Y-%m-%d"),
                "start_time": start_dt.strftime("%H:%M:%S"),
                "source": "strava",
                "source_id": strava_id,
                "created_at": now_iso()
            }

            db.activities.insert_one(entry)
            synced += 1

        return jsonify({"synced": synced, "total_found": len(strava_activities)})

    except Exception as e:
        return jsonify({"error": f"Sync failed: {str(e)}"}), 500


@strava_bp.route("/strava/status", methods=["GET"])
@require_auth
def strava_status():
    """Check if Strava is connected for the current user."""
    db = get_db()
    try:
        connection = db.connected_apps.find_one({"user_id": g.user_id, "provider": "strava"})
        if connection:
            return jsonify({"connected": True, "connected_at": connection.get("connected_at"), "athlete_id": connection.get("athlete_id")})
        return jsonify({"connected": False})
    except Exception:
        return jsonify({"connected": False})


@strava_bp.route("/strava/disconnect", methods=["DELETE"])
@require_auth
def strava_disconnect():
    """Disconnect Strava integration."""
    db = get_db()
    try:
        db.connected_apps.delete_one({"user_id": g.user_id, "provider": "strava"})
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
