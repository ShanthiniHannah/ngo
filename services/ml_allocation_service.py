"""
ML Volunteer Allocation Service
--------------------------------
Uses a pre-trained Decision Tree model to predict the best volunteer
for a given beneficiary based on:

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
    """Return 1 (assign) or 0 (skip) for this volunteer-beneficiary pair."""
    _load_model()

    skill_match    = _skill_match(volunteer, beneficiary)
    location_match = 0  # No location column in current schema
    availability   = 1 if volunteer.availability else 0
    workload       = len(volunteer.beneficiaries)  # Uses SQLAlchemy backref

    features = [[skill_match, location_match, availability, workload]]
    prediction = _model.predict(features)
    return int(prediction[0])


def assign_volunteer_ml(beneficiary):
    """
    Iterate over all volunteers and return the first predicted as suitable.
    Returns a Volunteer object, or None if no match is found.
    """
    from models import Volunteer  # local import to avoid circular imports

    volunteers = Volunteer.query.all()

    # Score every volunteer, pick the one predicted=1 with lowest workload
    candidates = []
    for v in volunteers:
        if predict_score(v, beneficiary) == 1:
            candidates.append((len(v.beneficiaries), v))

    if not candidates:
        return None

    # Return the candidate with the smallest existing workload
    candidates.sort(key=lambda x: x[0])
    return candidates[0][1]


def get_model_accuracy() -> float:
    """Return model accuracy percentage (e.g. 92.5)."""
    _load_model()
    return _accuracy
