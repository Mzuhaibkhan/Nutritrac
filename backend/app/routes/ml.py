import os
import joblib
import numpy as np
from flask import Blueprint, request, jsonify
from ..auth import require_auth

ml_bp = Blueprint("ml", __name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../ml/model.pkl")
_model = None


def load_model():
    global _model
    if _model is None:
        try:
            _model = joblib.load(MODEL_PATH)
        except FileNotFoundError:
            _model = None
    return _model


CATEGORY_MAP = {
    "Fast Food": 0, "Snack": 1, "Other": 2, "Beverage": 3,
    "Grain": 4, "Dairy": 5, "Fruit": 6, "Vegetable": 7,
    "Protein": 8, "Healthy": 9,
}

SCORE_LABELS = [(75, "Excellent"), (55, "Good"), (35, "Fair"), (0, "Needs Work")]


def score_to_label(score: float) -> tuple[str, str]:
    for threshold, label in SCORE_LABELS:
        if score >= threshold:
            break
    advice_map = {
        "Excellent": "Great choice! This meal aligns well with your health goals.",
        "Good": "Solid pick. Consider pairing with more vegetables for better balance.",
        "Fair": "Moderate choice. Watch your portions and aim for more whole foods.",
        "Needs Work": "This meal may not align with your goals. Consider a healthier alternative.",
    }
    return label, advice_map[label]


@ml_bp.route("/predict", methods=["POST"])
@require_auth
def predict():
    data = request.get_json()
    calories = float(data.get("calories", 500))
    cost     = float(data.get("cost", 10))
    category = data.get("category", "Other")

    cat_code = CATEGORY_MAP.get(category, 2)
    features = np.array([[calories, cost, cat_code]])

    model_inst = load_model()
    if model_inst is not None:
        score = float(np.clip(model_inst.predict(features)[0], 0, 100))
    else:
        # Fallback heuristic if model not trained yet
        healthy_cats = {"Vegetable", "Fruit", "Protein", "Healthy"}
        base = 70 if category in healthy_cats else 40
        cal_penalty = max(0, (calories - 600) / 20)
        cost_penalty = max(0, (cost - 15) / 3)
        score = float(np.clip(base - cal_penalty - cost_penalty, 0, 100))

    label, advice = score_to_label(score)
    return jsonify({"score": round(score, 1), "label": label, "advice": advice})
