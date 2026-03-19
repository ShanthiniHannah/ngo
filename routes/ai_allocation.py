from flask import Blueprint, jsonify
from models import Beneficiary
from helpers import log_activity
from routes.auth import token_required

ai_bp = Blueprint('ai', __name__)


@ai_bp.route('/ai-assign/<int:beneficiary_id>', methods=['POST'])
@token_required
def ai_assign(current_user, beneficiary_id):
    """
    AI-powered volunteer assignment for a beneficiary.
    Uses a pre-trained Decision Tree model to find the best-fit volunteer.
    ---
    tags:
      - AI Allocation
    parameters:
      - in: path
        name: beneficiary_id
        type: integer
        required: true
    responses:
      200:
        description: Volunteer assigned successfully by AI
      404:
        description: Beneficiary not found
      503:
        description: ML model not loaded
    """
    if current_user.role.name not in ['Admin', 'HR']:
        return jsonify({'error': 'Access denied'}), 403

    beneficiary = Beneficiary.query.get(beneficiary_id)
    if not beneficiary:
        return jsonify({'error': 'Beneficiary not found'}), 404

    try:
        from services.ml_allocation_service import assign_volunteer_ml, get_model_accuracy
        volunteer = assign_volunteer_ml(beneficiary)
        accuracy  = get_model_accuracy()
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 503
    except Exception as e:
        return jsonify({'error': f'AI service error: {str(e)}'}), 500

    if not volunteer:
        return jsonify({
            'message'       : 'No suitable volunteer found by AI',
            'volunteer'     : None,
            'accuracy'      : accuracy if 'accuracy' in dir() else None,
            'decision_type' : 'Machine Learning'
        }), 200

    # Persist the assignment in the database
    from database import db
    beneficiary.assigned_volunteer_id = volunteer.id
    db.session.commit()

    log_activity(
        current_user.id,
        "AI_ASSIGN",
        f"AI assigned Volunteer '{volunteer.name}' to Beneficiary '{beneficiary.name}'"
    )

    return jsonify({
        'message'       : f'AI assigned volunteer successfully',
        'volunteer'     : volunteer.name,
        'volunteer_id'  : volunteer.id,
        'accuracy'      : accuracy,
        'decision_type' : 'Machine Learning'
    }), 200


@ai_bp.route('/ai-accuracy', methods=['GET'])
def ai_accuracy():
    """
    Returns the current ML model accuracy.
    ---
    tags:
      - AI Allocation
    responses:
      200:
        description: Model accuracy percentage
    """
    try:
        from services.ml_allocation_service import get_model_accuracy
        accuracy = get_model_accuracy()
        return jsonify({'accuracy': accuracy, 'model': 'Decision Tree Classifier'})
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 503
