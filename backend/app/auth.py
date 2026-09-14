"""
Authentication middleware for NutriTrack AI backend.
Verifies Supabase JWT tokens and extracts user_id.
"""
from functools import wraps
from flask import request, jsonify, g
from .supabase_client import get_supabase

def require_auth(f):
    """Decorator that enforces JWT authentication on a route.

    Extracts the Bearer token from the Authorization header,
    verifies it with Supabase, and sets g.user_id for the route handler.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid authorization header"}), 401

        token = auth_header.split(" ", 1)[1]
        try:
            supabase = get_supabase()
            user_res = supabase.auth.get_user(token)
            if not user_res or not user_res.user:
                raise ValueError("Invalid user session")
                
            g.user_id = user_res.user.id
            g.user_token = token
        except Exception as e:
            from werkzeug.exceptions import Unauthorized
            import logging
            logging.error(f"Authentication failed: {str(e)}")
            raise Unauthorized("Authentication failed")

        return f(*args, **kwargs)
    return decorated
