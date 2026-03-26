"""
AI Allocation Routes — Suggestion-Based Workflow
-------------------------------------------------
ML generates ranked volunteer suggestions → HR reviews → approves/rejects.

Endpoints:
  POST /ai-suggest/<beneficiary_id>           Generate ML suggestions
  GET  /ai-suggestions                        List all pending suggestions
  GET  /ai-suggestions/<beneficiary_id>       Suggestions for one beneficiary
  POST /ai-suggestions/<id>/approve           HR approves → assigns volunteer
  POST /ai-suggestions/<id>/reject            HR rejects with optional reason
  GET  /ai-accuracy                           ML model accuracy
"""

from flask import Blueprint, request, jsonify
from models import Beneficiary, AllocationSuggestion
from database import db
from helpers import log_activity
from routes.auth import token_required
from datetime import datetime

ai_bp = Blueprint('ai', __name__)


@ai_bp.route('/ai-suggest/<int:beneficiary_id>', methods=['POST'])
@token_required
def ai_suggest(current_user, beneficiary_id):
    """
    Generate ML suggestions for a beneficiary — does NOT auto-assign.
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
        description: Volunteer suggestions generated
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
        from services.ml_allocation_service import get_suggestions, get_model_accuracy
        candidates = get_suggestions(beneficiary, top_n=5)
        accuracy   = get_model_accuracy()
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 503
    except Exception as e:
        return jsonify({'error': f'AI service error: {str(e)}'}), 500

    if not candidates:
        return jsonify({
            'message': 'No suitable volunteers found by AI',
            'suggestions': [],
            'accuracy': accuracy,
            'decision_type': 'Machine Learning Suggestion'
        }), 200

    # Clear old pending suggestions for this beneficiary
    AllocationSuggestion.query.filter_by(
        beneficiary_id=beneficiary_id, status='Pending'
    ).delete()

    # Save new suggestions
    suggestions = []
    for c in candidates:
        s = AllocationSuggestion(
            beneficiary_id = beneficiary_id,
            volunteer_id   = c['volunteer'].id,
            score          = c['score'],
            skill_match    = c['skill_match'],
            workload       = c['workload'],
            status         = 'Pending'
        )
        db.session.add(s)
        suggestions.append(s)

    db.session.commit()

    log_activity(current_user.id, "AI_SUGGEST",
        f"Generated {len(suggestions)} ML suggestions for Beneficiary '{beneficiary.name}'")

    return jsonify({
        'message': f'{len(suggestions)} volunteer suggestions generated',
        'suggestions': [{
            'id': s.id,
            'volunteer_id': s.volunteer_id,
            'volunteer_name': s.volunteer.name,
            'volunteer_skills': s.volunteer.skills,
            'volunteer_availability': s.volunteer.availability,
            'score': s.score,
            'skill_match': s.skill_match,
            'workload': s.workload,
            'status': s.status
        } for s in suggestions],
        'accuracy': accuracy,
        'decision_type': 'Machine Learning Suggestion'
    }), 200


@ai_bp.route('/ai-suggestions', methods=['GET'])
@token_required
def list_suggestions(current_user):
    """
    List all AI suggestions (HR dashboard).
    ---
    tags:
      - AI Allocation
    parameters:
      - in: query
        name: status
        type: string
        default: Pending
        description: Filter by status (Pending, Approved, Rejected, all)
    responses:
      200:
        description: List of suggestions
    """
    if current_user.role.name not in ['Admin', 'HR']:
        return jsonify({'error': 'Access denied'}), 403

    status_filter = request.args.get('status', 'Pending')
    q = AllocationSuggestion.query
    if status_filter != 'all':
        q = q.filter_by(status=status_filter)

    suggestions = q.order_by(AllocationSuggestion.suggested_at.desc()).all()
    return jsonify([{
        'id': s.id,
        'beneficiary_id': s.beneficiary_id,
        'beneficiary_name': s.beneficiary.name,
        'beneficiary_needs': s.beneficiary.needs,
        'volunteer_id': s.volunteer_id,
        'volunteer_name': s.volunteer.name,
        'volunteer_skills': s.volunteer.skills,
        'score': s.score,
        'skill_match': s.skill_match,
        'workload': s.workload,
        'status': s.status,
        'suggested_at': s.suggested_at.strftime('%Y-%m-%d %H:%M') if s.suggested_at else None
    } for s in suggestions])


@ai_bp.route('/ai-suggestions/<int:beneficiary_id>', methods=['GET'])
@token_required
def get_beneficiary_suggestions(current_user, beneficiary_id):
    """
    Get suggestions for a specific beneficiary.
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
        description: Suggestions for the beneficiary
    """
    if current_user.role.name not in ['Admin', 'HR']:
        return jsonify({'error': 'Access denied'}), 403

    suggestions = AllocationSuggestion.query.filter_by(
        beneficiary_id=beneficiary_id
    ).order_by(AllocationSuggestion.score.desc()).all()

    return jsonify([{
        'id': s.id,
        'volunteer_id': s.volunteer_id,
        'volunteer_name': s.volunteer.name,
        'volunteer_skills': s.volunteer.skills,
        'volunteer_availability': s.volunteer.availability,
        'score': s.score,
        'skill_match': s.skill_match,
        'workload': s.workload,
        'status': s.status,
        'reason': s.reason,
        'suggested_at': s.suggested_at.strftime('%Y-%m-%d %H:%M') if s.suggested_at else None
    } for s in suggestions])


@ai_bp.route('/ai-suggestions/<int:suggestion_id>/approve', methods=['POST'])
@token_required
def approve_suggestion(current_user, suggestion_id):
    """
    HR approves a suggestion → assigns volunteer to beneficiary.
    ---
    tags:
      - AI Allocation
    parameters:
      - in: path
        name: suggestion_id
        type: integer
        required: true
    responses:
      200:
        description: Volunteer assigned successfully
      404:
        description: Suggestion not found
    """
    if current_user.role.name not in ['Admin', 'HR']:
        return jsonify({'error': 'Access denied'}), 403

    suggestion = AllocationSuggestion.query.get(suggestion_id)
    if not suggestion:
        return jsonify({'error': 'Suggestion not found'}), 404
    if suggestion.status != 'Pending':
        return jsonify({'error': f'Suggestion already {suggestion.status}'}), 400

    # Approve and assign
    suggestion.status      = 'Approved'
    suggestion.reviewed_by = current_user.id
    suggestion.reviewed_at = datetime.utcnow()

    beneficiary = Beneficiary.query.get(suggestion.beneficiary_id)
    beneficiary.assigned_volunteer_id = suggestion.volunteer_id

    # Auto-reject other pending suggestions for same beneficiary
    AllocationSuggestion.query.filter(
        AllocationSuggestion.beneficiary_id == suggestion.beneficiary_id,
        AllocationSuggestion.id != suggestion_id,
        AllocationSuggestion.status == 'Pending'
    ).update({
        'status': 'Rejected',
        'reason': 'Another suggestion was approved',
        'reviewed_by': current_user.id,
        'reviewed_at': datetime.utcnow()
    })

    try:
        db.session.commit()
        log_activity(current_user.id, "AI_APPROVE",
            f"Approved ML suggestion: Volunteer '{suggestion.volunteer.name}' → Beneficiary '{beneficiary.name}'")
        return jsonify({
            'message': f'Volunteer {suggestion.volunteer.name} assigned to {beneficiary.name}',
            'volunteer_name': suggestion.volunteer.name,
            'volunteer_id': suggestion.volunteer_id
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ai_bp.route('/ai-suggestions/<int:suggestion_id>/reject', methods=['POST'])
@token_required
def reject_suggestion(current_user, suggestion_id):
    """
    HR rejects a suggestion with optional reason.
    ---
    tags:
      - AI Allocation
    parameters:
      - in: path
        name: suggestion_id
        type: integer
        required: true
    responses:
      200:
        description: Suggestion rejected
      404:
        description: Suggestion not found
    """
    if current_user.role.name not in ['Admin', 'HR']:
        return jsonify({'error': 'Access denied'}), 403

    suggestion = AllocationSuggestion.query.get(suggestion_id)
    if not suggestion:
        return jsonify({'error': 'Suggestion not found'}), 404
    if suggestion.status != 'Pending':
        return jsonify({'error': f'Suggestion already {suggestion.status}'}), 400

    data = request.get_json() or {}
    suggestion.status      = 'Rejected'
    suggestion.reason      = data.get('reason', '')
    suggestion.reviewed_by = current_user.id
    suggestion.reviewed_at = datetime.utcnow()

    try:
        db.session.commit()
        log_activity(current_user.id, "AI_REJECT",
            f"Rejected ML suggestion #{suggestion_id} for Beneficiary '{suggestion.beneficiary.name}'")
        return jsonify({'message': 'Suggestion rejected'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


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
