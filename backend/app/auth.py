"""
Authentication middleware for NutriTrack AI backend.
Verifies Supabase JWT tokens and extracts user_id.
"""
import os
from functools import wraps
from flask import request, jsonify, g


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
            import jwt
            jwt_secret = os.environ.get("SUPABASE_JWT_SECRET")
            if not jwt_secret:
                raise ValueError("SUPABASE_JWT_SECRET is missing. Cannot validate token locally.")
                
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                audience="authenticated"
            )
            g.user_id = payload["sub"]
            g.user_token = token
        except jwt.ExpiredSignatureError:
            from werkzeug.exceptions import Unauthorized
            raise Unauthorized("Token expired")
        except Exception as e:
            from werkzeug.exceptions import Unauthorized
            import logging
            logging.error(f"Authentication failed: {str(e)}")
            raise Unauthorized("Authentication failed")

        return f(*args, **kwargs)
    return decorated
