"""
Authentication middleware for NutriTrack AI backend.
Verifies Supabase JWT tokens and extracts user_id.
Supports fast local JWT verification with PyJWT and cached fallback to Supabase API.
"""
import os
import logging
import threading
from functools import wraps
from flask import request, jsonify, g
import jwt
from cachetools import TTLCache
from werkzeug.exceptions import Unauthorized
from .supabase_client import get_supabase

# Cache authenticated sessions for 60 seconds to eliminate repeat network verification
_token_cache = TTLCache(maxsize=1000, ttl=60)
_token_lock = threading.Lock()


def require_auth(f):
    """Decorator that enforces JWT authentication on a route.

    Extracts the Bearer token from the Authorization header,
    verifies it locally if SUPABASE_JWT_SECRET is set, caches verified
    sessions to reduce latency, or falls back to Supabase API.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid authorization header"}), 401

        token = auth_header.split(" ", 1)[1]

        # 1. Fast-path: Check TTL session cache
        with _token_lock:
            cached_user_id = _token_cache.get(token)
        if cached_user_id:
            g.user_id = cached_user_id
            g.user_token = token
            return f(*args, **kwargs)

        user_id = None
        jwt_secret = os.environ.get("SUPABASE_JWT_SECRET")

        # 2. Local JWT verification if secret is configured
        if jwt_secret:
            try:
                payload = jwt.decode(
                    token,
                    jwt_secret,
                    algorithms=["HS256", "HS384", "HS512"],
                    options={"verify_signature": True, "verify_exp": True},
                )
                user_id = payload.get("sub")
            except jwt.ExpiredSignatureError:
                raise Unauthorized("Token expired")
            except jwt.InvalidTokenError as err:
                # Fallback to Supabase API in case of asymmetric key (e.g. ES256)
                logging.debug(f"Local JWT decode failed, attempting remote fallback: {err}")

        # 3. Fallback: Verify with Supabase API
        if not user_id:
            try:
                supabase = get_supabase()
                user_res = supabase.auth.get_user(token)
                if not user_res or not user_res.user:
                    raise ValueError("Invalid user session")
                user_id = user_res.user.id
            except Exception as e:
                logging.error(f"Authentication failed: {str(e)}")
                raise Unauthorized("Authentication failed")

        # Cache valid session
        with _token_lock:
            _token_cache[token] = user_id

        g.user_id = user_id
        g.user_token = token
        return f(*args, **kwargs)

    return decorated
