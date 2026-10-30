"""
Authentication middleware for NutriTrack AI backend.
Verifies Clerk session JWT tokens and extracts user_id.
Supports local PEM public key verification and cached JWKS verification.
"""
import os
import logging
import threading
from functools import wraps
from flask import request, jsonify, g
import jwt
from jwt import PyJWKClient
from cachetools import TTLCache
from werkzeug.exceptions import Unauthorized

# Cache authenticated sessions for 60 seconds to eliminate repeat network verification
_token_cache = TTLCache(maxsize=1000, ttl=60)
_token_lock = threading.Lock()

_jwks_client: PyJWKClient | None = None
_jwks_lock = threading.Lock()


def _get_jwks_client() -> PyJWKClient | None:
    global _jwks_client
    if _jwks_client is not None:
        return _jwks_client

    with _jwks_lock:
        if _jwks_client is not None:
            return _jwks_client

        jwks_url = os.environ.get("CLERK_JWKS_URL")
        if not jwks_url:
            frontend_api = os.environ.get("CLERK_FRONTEND_API", "")
            if frontend_api:
                if not frontend_api.startswith("http"):
                    frontend_api = f"https://{frontend_api}"
                jwks_url = f"{frontend_api.rstrip('/')}/.well-known/jwks.json"

        if jwks_url:
            _jwks_client = PyJWKClient(jwks_url, cache_keys=True, lifespan=3600)

    return _jwks_client


def require_auth(f):
    """Decorator that enforces Clerk JWT authentication on a route.

    Extracts the Bearer token from the Authorization header,
    verifies it with CLERK_JWT_KEY (PEM) or Clerk JWKS endpoint,
    caches verified sessions in-memory for 60 seconds,
    and sets g.user_id = payload['sub'].
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

        # 2. Verify with Clerk PEM Public Key (if CLERK_JWT_KEY is set)
        clerk_jwt_key = os.environ.get("CLERK_JWT_KEY")
        if clerk_jwt_key:
            try:
                pem_key = clerk_jwt_key.strip()
                if not pem_key.startswith("-----BEGIN"):
                    pem_key = f"-----BEGIN PUBLIC KEY-----\n{pem_key}\n-----END PUBLIC KEY-----"
                payload = jwt.decode(
                    token,
                    pem_key,
                    algorithms=["RS256"],
                    options={"verify_exp": True, "verify_signature": True},
                )
                user_id = payload.get("sub")
            except jwt.ExpiredSignatureError:
                raise Unauthorized("Token expired")
            except Exception as err:
                logging.debug(f"Clerk PEM verification failed, falling back to JWKS: {err}")

        # 3. Verify with JWKS Client
        if not user_id:
            client = _get_jwks_client()
            if client:
                try:
                    signing_key = client.get_signing_key_from_jwt(token)
                    payload = jwt.decode(
                        token,
                        signing_key.key,
                        algorithms=["RS256"],
                        options={"verify_exp": True, "verify_signature": True},
                    )
                    user_id = payload.get("sub")
                except jwt.ExpiredSignatureError:
                    raise Unauthorized("Token expired")
                except Exception as err:
                    logging.error(f"Clerk JWKS verification failed: {err}")
                    raise Unauthorized("Invalid user token")

        if not user_id:
            logging.error("Authentication failed: No valid Clerk key configured or token invalid")
            raise Unauthorized("Authentication failed")

        # Cache valid session
        with _token_lock:
            _token_cache[token] = user_id

        g.user_id = user_id
        g.user_token = token
        return f(*args, **kwargs)

    return decorated
