import os
import json
import time
from datetime import datetime, timezone
import traceback
import logging
from flask import Flask, jsonify, request, g
from werkzeug.exceptions import HTTPException
from pydantic import ValidationError
from flask_cors import CORS
from flask_compress import Compress


def create_app():
    app = Flask(__name__)

    # Configure structured logging level
    log_level = getattr(logging, os.environ.get("LOG_LEVEL", "INFO").upper(), logging.INFO)
    logging.basicConfig(level=log_level)
    app.logger.setLevel(log_level)

    # Configurable CORS — defaults to localhost for dev, override via env var for production
    allowed_origins = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:3001,http://localhost:8080,http://127.0.0.1:3000,http://127.0.0.1:3001"
    ).split(",")
    
    # Enable CORS for frontend clients
    CORS(app, origins=allowed_origins)

    # Enable gzip/brotli compression for JSON and HTML responses
    Compress(app)

    # ── Observability & Request Timing Middleware ────────────────
    @app.before_request
    def start_timer():
        g.start_time = time.time()

    @app.after_request
    def log_request(response):
        duration_ms = round((time.time() - getattr(g, "start_time", time.time())) * 1000, 2)
        response.headers["X-Response-Time"] = f"{duration_ms}ms"

        # Omit repetitive successful health check pings from access logs
        if request.path == "/api/health" and response.status_code == 200:
            return response

        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "method": request.method,
            "path": request.path,
            "status": response.status_code,
            "duration_ms": duration_ms,
            "client_ip": request.headers.get("X-Forwarded-For", request.remote_addr),
            "user_id": getattr(g, "user_id", None)
        }
        app.logger.info(json.dumps(log_data))
        return response

    from .routes.food import food_bp
    from .routes.llm import llm_bp
    from .routes.analytics import analytics_bp
    from .routes.compare import compare_bp
    from .routes.goals import goals_bp
    from .routes.ml import ml_bp
    from .routes.activities import activities_bp
    from .routes.manual_food import manual_food_bp
    from .routes.profile import profile_bp
    from .routes.social import social_bp
    from .routes.strava import strava_bp
    from .routes.chat import chat_bp
    from .routes.water import water_bp
    from .routes.streaks import streaks_bp

    app.register_blueprint(food_bp,        url_prefix="/api")
    app.register_blueprint(llm_bp,         url_prefix="/api")
    app.register_blueprint(analytics_bp,   url_prefix="/api")
    app.register_blueprint(compare_bp,     url_prefix="/api")
    app.register_blueprint(goals_bp,       url_prefix="/api")
    app.register_blueprint(ml_bp,          url_prefix="/api")
    app.register_blueprint(activities_bp,  url_prefix="/api")
    app.register_blueprint(manual_food_bp, url_prefix="/api")
    app.register_blueprint(profile_bp,     url_prefix="/api")
    app.register_blueprint(social_bp,      url_prefix="/api")
    app.register_blueprint(strava_bp,      url_prefix="/api")
    app.register_blueprint(chat_bp,        url_prefix="/api")
    app.register_blueprint(water_bp,       url_prefix="/api")
    app.register_blueprint(streaks_bp,     url_prefix="/api")

    # ── Health Check with DB Connectivity Verification ──────────
    @app.route("/api/health")
    def health():
        health_status = {
            "status": "healthy",
            "service": "NutriTrack AI Backend",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "checks": {
                "database": "unknown"
            }
        }
        status_code = 200

        try:
            from .mongo_client import get_db
            db = get_db()
            db.command("ping")
            health_status["checks"]["database"] = "connected"
        except Exception as e:
            health_status["status"] = "degraded"
            health_status["checks"]["database"] = f"unhealthy: {str(e)}"
            status_code = 503

        return jsonify(health_status), status_code

    # Centralized Error Handlers
    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        """Return JSON instead of HTML for HTTP errors."""
        response = e.get_response()
        response.data = jsonify({
            "error": e.description,
            "code": e.code
        }).data
        response.content_type = "application/json"
        return response

    @app.errorhandler(ValidationError)
    def handle_pydantic_validation_error(e):
        """Return structured 400 Bad Request for Pydantic validation errors."""
        return jsonify({
            "error": "Validation Error",
            "details": e.errors(),
            "code": 400
        }), 400

    @app.errorhandler(Exception)
    def handle_exception(e):
        """Return JSON instead of HTML for unhandled exceptions."""
        app.logger.error(f"Unhandled Exception: {str(e)}")
        app.logger.error(traceback.format_exc())
        
        return jsonify({
            "error": "An internal server error occurred.",
            "code": 500
        }), 500

    return app
