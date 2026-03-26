from flask import Blueprint, request, jsonify
from database import db
from models import ServiceAcknowledgment, Beneficiary, Volunteer
from routes.auth import token_required
from datetime import datetime

acknowledgment_bp = Blueprint('acknowledgment', __name__)


@acknowledgment_bp.route('/acknowledgment', methods=['POST'])
@token_required
def submit_acknowledgment(current_user):
    """Beneficiary submits feedback on their assigned volunteer."""
    data = request.json or {}

    # Verify the user is a beneficiary
    if current_user.role.name != 'Beneficiary':
        return jsonify({'error': 'Only beneficiaries can submit acknowledgments'}), 403

    # Find the beneficiary profile
    ben = Beneficiary.query.filter_by(email=current_user.email).first()
    if not ben:
        return jsonify({'error': 'Beneficiary profile not found'}), 404

    if not ben.assigned_volunteer_id:
        return jsonify({'error': 'No volunteer assigned to you yet'}), 400

    rating = data.get('rating')
    if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400

    ack = ServiceAcknowledgment(
        beneficiary_id=ben.id,
        volunteer_id=ben.assigned_volunteer_id,
        rating=rating,
        feedback=data.get('feedback', '').strip() or None,
        service_type=data.get('service_type', '').strip() or None,
        status=data.get('status', 'Satisfied'),
        acknowledged_at=datetime.utcnow()
    )
    db.session.add(ack)
    db.session.commit()

    return jsonify({
        'message': 'Acknowledgment submitted successfully',
        'id': ack.id
    }), 201


@acknowledgment_bp.route('/acknowledgments', methods=['GET'])
@token_required
def list_acknowledgments(current_user):
    """List acknowledgments — HR/Admin see all, others see their own."""
    role = current_user.role.name

    if role in ('Admin', 'HR'):
        acks = ServiceAcknowledgment.query.order_by(ServiceAcknowledgment.acknowledged_at.desc()).all()
    elif role == 'Beneficiary':
        ben = Beneficiary.query.filter_by(email=current_user.email).first()
        if not ben:
            return jsonify([])
        acks = ServiceAcknowledgment.query.filter_by(beneficiary_id=ben.id).order_by(
            ServiceAcknowledgment.acknowledged_at.desc()).all()
    elif role == 'Volunteer':
        vol = Volunteer.query.filter_by(email=current_user.email).first()
        if not vol:
            return jsonify([])
        acks = ServiceAcknowledgment.query.filter_by(volunteer_id=vol.id).order_by(
            ServiceAcknowledgment.acknowledged_at.desc()).all()
    else:
        return jsonify([])

    return jsonify([{
        'id': a.id,
        'beneficiary_id': a.beneficiary_id,
        'beneficiary_name': a.beneficiary.name if a.beneficiary else 'Unknown',
        'volunteer_id': a.volunteer_id,
        'volunteer_name': a.volunteer.name if a.volunteer else 'Unknown',
        'rating': a.rating,
        'feedback': a.feedback,
        'service_type': a.service_type,
        'status': a.status,
        'acknowledged_at': a.acknowledged_at.strftime('%Y-%m-%d %H:%M') if a.acknowledged_at else None
    } for a in acks])


@acknowledgment_bp.route('/acknowledgments/volunteer/<int:volunteer_id>', methods=['GET'])
@token_required
def volunteer_acknowledgments(current_user, volunteer_id):
    """Get acknowledgment summary for a specific volunteer."""
    acks = ServiceAcknowledgment.query.filter_by(volunteer_id=volunteer_id).order_by(
        ServiceAcknowledgment.acknowledged_at.desc()).all()

    avg_rating = 0
    if acks:
        avg_rating = round(sum(a.rating for a in acks) / len(acks), 1)

    return jsonify({
        'volunteer_id': volunteer_id,
        'total': len(acks),
        'average_rating': avg_rating,
        'acknowledgments': [{
            'id': a.id,
            'beneficiary_name': a.beneficiary.name if a.beneficiary else 'Unknown',
            'rating': a.rating,
            'feedback': a.feedback,
            'service_type': a.service_type,
            'status': a.status,
            'acknowledged_at': a.acknowledged_at.strftime('%Y-%m-%d %H:%M') if a.acknowledged_at else None
        } for a in acks]
    })
