"""
Shared Gemini AI client with caching and rate limiting.
Consolidates the two separate model instances from llm.py and goals.py.
"""
import os
import time
import hashlib
import threading
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

# Safety settings: Ensure Gemini doesn't block nutrition analysis
SAFETY_SETTINGS = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
]

class MockResponse:
    def __init__(self, text: str):
        self.text = text

class GenerativeModelWrapper:
    def generate_content(self, prompt: str) -> MockResponse:
        gemini_key = os.environ.get("GEMINI_API_KEY", "")
        openai_key = os.environ.get("OPENAI_API_KEY", "") or os.environ.get("GPT_API_KEY", "")
        grok_key = os.environ.get("GROK_API_KEY", "") or os.environ.get("XAI_API_KEY", "")

        # 1. Try Gemini
        if gemini_key:
            try:
                genai.configure(api_key=gemini_key)
                gemini_model = genai.GenerativeModel(
                    model_name="gemini-2.0-flash-lite",
                    safety_settings=SAFETY_SETTINGS
                )
                return gemini_model.generate_content(prompt)
            except Exception as e:
                print(f"Gemini failed: {e}. Trying other providers...")

    def generate_content_with_image(self, prompt: str, image_bytes: bytes, mime_type: str) -> MockResponse:
        gemini_key = os.environ.get("GEMINI_API_KEY", "")
        openai_key = os.environ.get("OPENAI_API_KEY", "") or os.environ.get("GPT_API_KEY", "")

        # 1. Try Gemini
        if gemini_key:
            try:
                genai.configure(api_key=gemini_key)
                gemini_model = genai.GenerativeModel(
                    model_name="gemini-2.0-flash-lite",
                    safety_settings=SAFETY_SETTINGS
                )
                return gemini_model.generate_content([
                    prompt,
                    {
                        "mime_type": mime_type,
                        "data": image_bytes
                    }
                ])
            except Exception as e:
                print(f"Gemini Vision failed: {e}. Trying other providers...")

        # 2. Try OpenAI (GPT)
        if openai_key:
            try:
                import base64
                import requests
                base64_image = base64.b64encode(image_bytes).decode("utf-8")
                headers = {
                    "Authorization": f"Bearer {openai_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:{mime_type};base64,{base64_image}"
                                    }
                                }
                            ]
                        }
                    ]
                }
                if "json" in prompt.lower():
                    payload["response_format"] = { "type": "json_object" }

                resp = requests.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers, timeout=30)
                resp.raise_for_status()
                res_json = resp.json()
                text = res_json["choices"][0]["message"]["content"]
                return MockResponse(text)
            except Exception as e:
                print(f"OpenAI Vision failed: {e}.")

        return self._generate_fallback(prompt)

        # 2. Try OpenAI (GPT)
        if openai_key:
            try:
                import requests
                headers = {
                    "Authorization": f"Bearer {openai_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}]
                }
                if "json" in prompt.lower():
                    payload["response_format"] = { "type": "json_object" }

                resp = requests.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers, timeout=30)
                resp.raise_for_status()
                res_json = resp.json()
                text = res_json["choices"][0]["message"]["content"]
                return MockResponse(text)
            except Exception as e:
                print(f"OpenAI GPT failed: {e}. Trying other providers...")

        # 3. Try xAI (Grok)
        if grok_key:
            try:
                import requests
                headers = {
                    "Authorization": f"Bearer {grok_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "grok-2-1212",
                    "messages": [{"role": "user", "content": prompt}]
                }
                if "json" in prompt.lower():
                    payload["response_format"] = { "type": "json_object" }

                resp = requests.post("https://api.x.ai/v1/chat/completions", json=payload, headers=headers, timeout=30)
                resp.raise_for_status()
                res_json = resp.json()
                text = res_json["choices"][0]["message"]["content"]
                return MockResponse(text)
            except Exception as e:
                print(f"xAI Grok failed: {e}.")

        # 4. Fallback (Offline Heuristics)
        return self._generate_fallback(prompt)

    def _generate_fallback(self, prompt: str) -> MockResponse:
        import re
        import json
        
        # Check if nutrition extraction or meal plan
        if "nutrition extraction" in prompt.lower() or "food description:" in prompt.lower():
            # Parse description & meal type
            food_text = ""
            meal_type = "lunch"
            
            desc_match = re.search(r'Food description:\s*"(.*?)"', prompt)
            if desc_match:
                food_text = desc_match.group(1)
            else:
                desc_match = re.search(r'Food description:\s*(.*)', prompt)
                if desc_match:
                    food_text = desc_match.group(1).strip()
                    
            type_match = re.search(r'Meal type hint:\s*"(.*?)"', prompt)
            if type_match:
                meal_type = type_match.group(1)
                
            if not food_text:
                food_text = "Healthy meal"
                
            nutrition = self._heuristic_parse_nutrition(food_text, meal_type)
            return MockResponse(json.dumps(nutrition))
            
        else:
            # Meal plan generation
            calorie_goal = 2000
            protein_goal = 150
            carbs_goal = 250
            fats_goal = 65
            budget = 30
            
            cal_match = re.search(r'calorie_goal:\s*([0-9]+)', prompt) or re.search(r'calorie target:\s*([0-9]+)', prompt, re.IGNORECASE) or re.search(r'daily_calorie_goal:\s*([0-9]+)', prompt)
            if cal_match:
                calorie_goal = int(cal_match.group(1))
                
            prot_match = re.search(r'protein_goal_g:\s*([0-9]+)', prompt) or re.search(r'protein target:\s*([0-9]+)', prompt, re.IGNORECASE) or re.search(r'daily_protein_goal_g:\s*([0-9]+)', prompt)
            if prot_match:
                protein_goal = int(prot_match.group(1))
                
            carbs_match = re.search(r'carbs_goal_g:\s*([0-9]+)', prompt) or re.search(r'carbs target:\s*([0-9]+)', prompt, re.IGNORECASE) or re.search(r'daily_carbs_goal_g:\s*([0-9]+)', prompt)
            if carbs_match:
                carbs_goal = int(carbs_match.group(1))
                
            fats_match = re.search(r'fats_goal_g:\s*([0-9]+)', prompt) or re.search(r'fat target:\s*([0-9]+)', prompt, re.IGNORECASE) or re.search(r'daily_fats_goal_g:\s*([0-9]+)', prompt)
            if fats_match:
                fats_goal = int(fats_match.group(1))
                
            budget_match = re.search(r'budget:\s*([0-9]+)', prompt) or re.search(r'budget_usd:\s*([0-9]+)', prompt) or re.search(r'daily_budget_usd:\s*([0-9]+)', prompt)
            if budget_match:
                budget = int(budget_match.group(1))
                
            plan = self._meal_plan_fallback(calorie_goal, protein_goal, carbs_goal, fats_goal, budget)
            return MockResponse(json.dumps(plan))

    def _heuristic_parse_nutrition(self, text: str, meal_type: str) -> dict:
        text_lower = text.lower()
        
        db = {
            "chicken": {"calories": 220, "protein": 30.0, "carbs": 0.0, "fats": 9.0, "category": "Protein", "cost": 6.0},
            "rice": {"calories": 200, "protein": 4.0, "carbs": 45.0, "fats": 0.5, "category": "Grain", "cost": 2.0},
            "egg": {"calories": 70, "protein": 6.0, "carbs": 0.6, "fats": 5.0, "category": "Dairy", "cost": 0.5},
            "apple": {"calories": 95, "protein": 0.5, "carbs": 25.0, "fats": 0.3, "category": "Fruit", "cost": 1.0},
            "banana": {"calories": 105, "protein": 1.3, "carbs": 27.0, "fats": 0.3, "category": "Fruit", "cost": 1.0},
            "salad": {"calories": 150, "protein": 3.0, "carbs": 10.0, "fats": 10.0, "category": "Vegetable", "cost": 5.0},
            "burger": {"calories": 550, "protein": 25.0, "carbs": 45.0, "fats": 28.0, "category": "Fast Food", "cost": 8.0},
            "pizza": {"calories": 300, "protein": 12.0, "carbs": 35.0, "fats": 11.0, "category": "Fast Food", "cost": 4.0},
            "salmon": {"calories": 200, "protein": 22.0, "carbs": 0.0, "fats": 13.0, "category": "Protein", "cost": 9.0},
            "oats": {"calories": 150, "protein": 5.0, "carbs": 27.0, "fats": 2.5, "category": "Grain", "cost": 1.5},
            "milk": {"calories": 120, "protein": 8.0, "carbs": 12.0, "fats": 5.0, "category": "Dairy", "cost": 1.0},
            "coffee": {"calories": 5, "protein": 0.0, "carbs": 0.0, "fats": 0.0, "category": "Beverage", "cost": 3.0},
            "soda": {"calories": 150, "protein": 0.0, "carbs": 39.0, "fats": 0.0, "category": "Beverage", "cost": 2.0},
            "cookie": {"calories": 150, "protein": 2.0, "carbs": 20.0, "fats": 7.0, "category": "Snack", "cost": 1.5},
            "chips": {"calories": 160, "protein": 2.0, "carbs": 15.0, "fats": 10.0, "category": "Snack", "cost": 2.0},
        }
        
        calories = 0
        protein = 0.0
        carbs = 0.0
        fats = 0.0
        cost = 0.0
        categories = []
        
        matched = False
        for key, val in db.items():
            if key in text_lower:
                matched = True
                calories += val["calories"]
                protein += val["protein"]
                carbs += val["carbs"]
                fats += val["fats"]
                cost += val["cost"]
                categories.append(val["category"])
                
        if not matched:
            if meal_type == "breakfast":
                calories, protein, carbs, fats, cost = 300, 10.0, 45.0, 8.0, 4.0
                categories = ["Grain"]
            elif meal_type == "snack":
                calories, protein, carbs, fats, cost = 150, 3.0, 20.0, 5.0, 2.0
                categories = ["Snack"]
            else:
                calories, protein, carbs, fats, cost = 500, 25.0, 60.0, 15.0, 10.0
                categories = ["Healthy"]
                
        # Extract cost from description if present
        import re
        cost_match = re.search(r'\b(?:₹|rs\.?|rs|usd|\$)\s*([0-9]+(?:\.[0-9]+)?)', text_lower)
        if not cost_match:
            cost_match = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*(?:usd|dollars|rupees|rs|₹)', text_lower)
        if cost_match:
            try:
                cost = float(cost_match.group(1))
            except ValueError:
                pass
                
        main_category = categories[0] if categories else "Other"
        
        return {
            "food_item": text.title() + " (Offline Heuristics)",
            "calories": int(calories),
            "protein_g": round(protein, 1),
            "carbs_g": round(carbs, 1),
            "fats_g": round(fats, 1),
            "fiber_g": round(max(0.0, carbs * 0.1), 1),
            "sugar_g": round(max(0.0, carbs * 0.2), 1),
            "sodium_mg": round(calories * 1.2, 1),
            "category": main_category,
            "meal_type": meal_type,
            "cost": round(cost, 2)
        }

    def _meal_plan_fallback(self, calorie_goal: int, protein_goal: int, carbs_goal: int, fats_goal: int, budget: int) -> dict:
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        
        meal_templates = {
            "breakfast": [
                {"name": "Oatmeal with almonds & banana", "cal_pct": 0.25, "p_pct": 0.2, "c_pct": 0.3, "f_pct": 0.25, "cost_pct": 0.2},
                {"name": "Scrambled eggs with whole wheat toast", "cal_pct": 0.25, "p_pct": 0.3, "c_pct": 0.2, "f_pct": 0.3, "cost_pct": 0.25},
                {"name": "Greek yogurt parfait with mixed berries", "cal_pct": 0.25, "p_pct": 0.35, "c_pct": 0.25, "f_pct": 0.15, "cost_pct": 0.3},
                {"name": "Paneer bhurji with roti", "cal_pct": 0.25, "p_pct": 0.28, "c_pct": 0.24, "f_pct": 0.24, "cost_pct": 0.2},
                {"name": "Moong dal chilla with mint chutney", "cal_pct": 0.25, "p_pct": 0.25, "c_pct": 0.28, "f_pct": 0.22, "cost_pct": 0.15},
                {"name": "Avocado toast with boiled egg", "cal_pct": 0.25, "p_pct": 0.22, "c_pct": 0.22, "f_pct": 0.32, "cost_pct": 0.35},
                {"name": "Fruit smoothie with whey protein", "cal_pct": 0.25, "p_pct": 0.4, "c_pct": 0.2, "f_pct": 0.15, "cost_pct": 0.3}
            ],
            "lunch": [
                {"name": "Grilled chicken breast with brown rice & broccoli", "cal_pct": 0.35, "p_pct": 0.4, "c_pct": 0.35, "f_pct": 0.25, "cost_pct": 0.35},
                {"name": "Tofu stir-fry with quinoa and mixed veggies", "cal_pct": 0.35, "p_pct": 0.3, "c_pct": 0.38, "f_pct": 0.3, "cost_pct": 0.3},
                {"name": "Lentil soup (tadka dal) with jeera rice & spinach", "cal_pct": 0.35, "p_pct": 0.25, "c_pct": 0.45, "f_pct": 0.25, "cost_pct": 0.2},
                {"name": "Chickpea salad with olive oil & lemon dressing", "cal_pct": 0.35, "p_pct": 0.25, "c_pct": 0.4, "f_pct": 0.35, "cost_pct": 0.25},
                {"name": "Fish curry with steamed rice", "cal_pct": 0.35, "p_pct": 0.38, "c_pct": 0.32, "f_pct": 0.28, "cost_pct": 0.4},
                {"name": "Paneer butter masala (low fat) with laccha paratha", "cal_pct": 0.35, "p_pct": 0.28, "c_pct": 0.38, "f_pct": 0.32, "cost_pct": 0.35},
                {"name": "Turkey breast sandwich on multigrain bread", "cal_pct": 0.35, "p_pct": 0.35, "c_pct": 0.35, "f_pct": 0.25, "cost_pct": 0.3}
            ],
            "dinner": [
                {"name": "Baked salmon with asparagus & sweet potato", "cal_pct": 0.3, "p_pct": 0.35, "c_pct": 0.3, "f_pct": 0.35, "cost_pct": 0.45},
                {"name": "Egg curry with roti and cucumber salad", "cal_pct": 0.3, "p_pct": 0.3, "c_pct": 0.32, "f_pct": 0.28, "cost_pct": 0.2},
                {"name": "Stir-fried beef/lamb with bell peppers & cauliflower rice", "cal_pct": 0.3, "p_pct": 0.38, "c_pct": 0.15, "f_pct": 0.4, "cost_pct": 0.4},
                {"name": "Mixed vegetable khichdi with roasted papad & curd", "cal_pct": 0.3, "p_pct": 0.2, "c_pct": 0.5, "f_pct": 0.2, "cost_pct": 0.15},
                {"name": "Soya chunks stir-fry with mixed greens & chapati", "cal_pct": 0.3, "p_pct": 0.35, "c_pct": 0.35, "f_pct": 0.2, "cost_pct": 0.2},
                {"name": "Mushroom risotto with grilled asparagus", "cal_pct": 0.3, "p_pct": 0.22, "c_pct": 0.48, "f_pct": 0.25, "cost_pct": 0.35},
                {"name": "Shrimp skewers with quinoa & bell peppers", "cal_pct": 0.3, "p_pct": 0.4, "c_pct": 0.3, "f_pct": 0.2, "cost_pct": 0.4}
            ],
            "snack": [
                {"name": "Mixed nuts & dark chocolate", "cal_pct": 0.1, "p_pct": 0.1, "c_pct": 0.1, "f_pct": 0.2, "cost_pct": 0.15},
                {"name": "Roasted chana (chickpeas)", "cal_pct": 0.1, "p_pct": 0.15, "c_pct": 0.15, "f_pct": 0.05, "cost_pct": 0.05},
                {"name": "Peanut butter with apple slices", "cal_pct": 0.1, "p_pct": 0.12, "c_pct": 0.12, "f_pct": 0.18, "cost_pct": 0.1},
                {"name": "Protein bar", "cal_pct": 0.1, "p_pct": 0.25, "c_pct": 0.1, "f_pct": 0.1, "cost_pct": 0.2},
                {"name": "Hummus with baby carrots & cucumber", "cal_pct": 0.1, "p_pct": 0.1, "c_pct": 0.12, "f_pct": 0.12, "cost_pct": 0.15},
                {"name": "Cottage cheese (paneer) cubes with black pepper", "cal_pct": 0.1, "p_pct": 0.18, "c_pct": 0.05, "f_pct": 0.15, "cost_pct": 0.15},
                {"name": "Boiled eggs (two)", "cal_pct": 0.1, "p_pct": 0.2, "c_pct": 0.02, "f_pct": 0.16, "cost_pct": 0.1}
            ]
        }

        from datetime import date
        weekly_plan = []
        for i, day in enumerate(days):
            day_meals = []
            day_cal, day_p, day_c, day_f, day_cost = 0, 0, 0, 0, 0
            
            for mtype in ["breakfast", "lunch", "dinner", "snack"]:
                tmpl = meal_templates[mtype][i % len(meal_templates[mtype])]
                
                meal_cal = int(calorie_goal * tmpl["cal_pct"])
                meal_p = round(protein_goal * tmpl["cal_pct"], 1)
                meal_c = round(carbs_goal * tmpl["cal_pct"], 1)
                meal_f = round(fats_goal * tmpl["cal_pct"], 1)
                meal_cost = round(budget * tmpl["cost_pct"], 1)
                
                day_cal += meal_cal
                day_p += meal_p
                day_c += meal_c
                day_f += meal_f
                day_cost += meal_cost
                
                day_meals.append({
                    "meal_type": mtype,
                    "name": tmpl["name"],
                    "calories": meal_cal,
                    "protein_g": meal_p,
                    "carbs_g": meal_c,
                    "fats_g": meal_f,
                    "estimated_cost": meal_cost
                })
                
            weekly_plan.append({
                "day": day,
                "meals": day_meals,
                "day_total": {
                    "calories": int(day_cal),
                    "protein_g": round(day_p, 1),
                    "carbs_g": round(day_c, 1),
                    "fats_g": round(day_f, 1),
                    "cost": round(day_cost, 2)
                }
            })
            
        tips = [
            f"API Key not configured. Using standard plan adjusted to your target of {calorie_goal} kcal and daily budget of ₹{budget}.",
            "Stay hydrated: drink at least 3-4 liters of water daily.",
            "Try to eat meals at consistent times each day to support digestive health.",
            "You can replace brown rice with whole wheat chapatis/roti of equivalent portion sizes.",
            "Pre-cook your protein sources (chicken, beans, tofu) twice a week to save meal preparation time."
        ]
        
        return {
            "summary": f"Your custom 7-Day Plan (Offline Heuristics) optimized for {calorie_goal} kcal/day and a daily budget of ₹{budget}. This plan focuses on clean ingredients, high protein efficiency, and cost-effective food choices.",
            "weekly_plan": weekly_plan,
            "tips": tips
        }

model = GenerativeModelWrapper()


# ── Rate Limiter ──────────────────────────────────────────────
class RateLimiter:
    """Simple token-bucket rate limiter for Gemini API calls."""

    def __init__(self, max_calls: int, period: float):
        self.max_calls = max_calls
        self.period = period
        self.calls: list[float] = []
        self.lock = threading.Lock()

    def allow(self) -> bool:
        now = time.time()
        with self.lock:
            self.calls = [t for t in self.calls if now - t < self.period]
            if len(self.calls) >= self.max_calls:
                return False
            self.calls.append(now)
            return True


# 10 calls per minute (well under 15 RPM free tier limit)
gemini_limiter = RateLimiter(max_calls=10, period=60)


# ── In-Memory Cache ───────────────────────────────────────────
_nutrition_cache: dict[str, dict] = {}
MAX_CACHE_SIZE = 500


def cache_key(text: str, meal_type: str = "") -> str:
    """Generate a normalized cache key from food description."""
    normalized = text.strip().lower()
    return hashlib.md5(f"{normalized}|{meal_type}".encode()).hexdigest()


def get_cached(key: str) -> dict | None:
    """Get a cached nutrition result."""
    return _nutrition_cache.get(key)


def set_cached(key: str, value: dict) -> None:
    """Store a nutrition result in cache."""
    if len(_nutrition_cache) >= MAX_CACHE_SIZE:
        # Remove oldest 100 entries
        oldest_keys = list(_nutrition_cache.keys())[:100]
        for k in oldest_keys:
            _nutrition_cache.pop(k, None)
    _nutrition_cache[key] = value
