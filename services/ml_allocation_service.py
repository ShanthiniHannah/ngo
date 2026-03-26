"""
ML Volunteer Allocation Service
--------------------------------
Uses a pre-trained Decision Tree model to generate ranked volunteer
SUGGESTIONS for a given beneficiary. HR reviews and approves/rejects.

Features used:
  - skill_match    : 1 if any word in beneficiary needs matches volunteer skills
  - location_match : hardcoded 0 (no location column in current schema)
  - availability   : 1 if volunteer.availability is a non-empty string
  - workload       : number of beneficiaries already assigned to the volunteer
"""

import os
import pickle

# ── Load model at import time (once) ─────────────────────────────────────────
_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml_model", "model.pkl")
_MODEL_PATH = os.path.normpath(_MODEL_PATH)

_payload  = None
_model    = None
_accuracy = None

def _load_model():
    global _payload, _model, _accuracy
    if _model is None:
        if not os.path.exists(_MODEL_PATH):
            print("ML model not found. Training now...")
            try:
                # Run the generation and training logic
                from ml_model.generate_dataset import generate as gen_data
                from ml_model.train_model import train as train_model
                gen_data()
                train_model()
                print("ML model trained successfully during startup.")
            except Exception as e:
                print(f"Failed to auto-train ML model: {e}")
                raise FileNotFoundError(f"ML model missing and auto-train failed: {e}")

        with open(_MODEL_PATH, "rb") as f:
            _payload = pickle.load(f)
        _model    = _payload["model"]
        _accuracy = _payload["accuracy"]


def _skill_match(volunteer, beneficiary) -> int:
    """Return 1 if any keyword from beneficiary needs appears in volunteer skills."""
    needs  = (beneficiary.needs or "").lower()
    skills = (volunteer.skills  or "").lower()
    if not needs or not skills:
        return 0
    # Check each word/phrase in needs against skills string
    for keyword in needs.replace(",", " ").split():
        if len(keyword) > 2 and keyword in skills:
            return 1
    return 0


def predict_score(volunteer, beneficiary) -> int:
    """Return 1 (suitable) or 0 (skip) for this volunteer-beneficiary pair."""
    _load_model()

    skill_match    = _skill_match(volunteer, beneficiary)
    location_match = 0  # No location column in current schema
    availability   = 1 if volunteer.availability else 0
    workload       = len(volunteer.beneficiaries)  # Uses SQLAlchemy backref

    features = [[skill_match, location_match, availability, workload]]
    prediction = _model.predict(features)
    return int(prediction[0])


def get_suggestions(beneficiary, top_n=5):
    """
    Return top-N ranked volunteer suggestions WITHOUT assigning.
    Returns list of dicts: [{volunteer, score, skill_match, workload}, ...]
    
    ML predicts suitability (1/0), then we rank by a composite score:
      - skill_match contributes +2
      - lower workload contributes more (bonus = max(0, 5 - workload))
    """
    from models import Volunteer  # local import to avoid circular imports

    volunteers = Volunteer.query.all()

    candidates = []
    for v in volunteers:
        sm = _skill_match(v, beneficiary)
        wl = len(v.beneficiaries)
        pred = predict_score(v, beneficiary)

        if pred == 1:
            # Composite score: skill match bonus + workload bonus
            score = (sm * 2) + max(0, 5 - wl)
            candidates.append({
                'volunteer': v,
                'score': round(score, 2),
                'skill_match': bool(sm),
                'workload': wl
            })

    # Sort by score descending, then workload ascending
    candidates.sort(key=lambda x: (-x['score'], x['workload']))
    return candidates[:top_n]


def get_model_accuracy() -> float:
    """Return model accuracy percentage (e.g. 92.5)."""
    _load_model()
    return _accuracy
