import os
from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException
from pydantic import ValidationError
import traceback
import logging
from flask_cors import CORS


def create_app():
    app = Flask(__name__)

    # Configurable CORS — defaults to localhost for dev, override via env var for production
    allowed_origins = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:3001,http://localhost:8080,http://127.0.0.1:3000,http://127.0.0.1:3001"
    ).split(",")
    
    # Enable CORS for frontend clients
    CORS(app, origins=allowed_origins)

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

    app.register_blueprint(food_bp,      url_prefix="/api")
    app.register_blueprint(llm_bp,       url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api")
    app.register_blueprint(compare_bp,   url_prefix="/api")
    app.register_blueprint(goals_bp,     url_prefix="/api")
    app.register_blueprint(ml_bp,        url_prefix="/api")
    app.register_blueprint(activities_bp, url_prefix="/api")
    app.register_blueprint(manual_food_bp, url_prefix="/api")
    app.register_blueprint(profile_bp,    url_prefix="/api")
    app.register_blueprint(social_bp,     url_prefix="/api")
    app.register_blueprint(strava_bp,     url_prefix="/api")
    app.register_blueprint(chat_bp,       url_prefix="/api")
    app.register_blueprint(water_bp,      url_prefix="/api")
    app.register_blueprint(streaks_bp,    url_prefix="/api")

    @app.route("/api/health")
    def health():
        return {"status": "ok", "service": "NutriTrack AI Backend"}

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
        # Log the exception stack trace to server logs
        app.logger.error(f"Unhandled Exception: {str(e)}")
        app.logger.error(traceback.format_exc())
        
        # Return a generic error message to the client
        return jsonify({
            "error": "An internal server error occurred.",
            "code": 500
        }), 500

    return app
