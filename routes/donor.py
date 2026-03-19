from flask import Blueprint, request, jsonify
from database import db
from models import db, Donor, User, Role
from .auth import token_required
from helpers import log_activity
from werkzeug.security import generate_password_hash
import secrets

donor_bp = Blueprint('donor', __name__)


@donor_bp.route('/donor', methods=['GET'])
def get_donors():
    donors = Donor.query.all()
    return jsonify([{
        'id'             : d.id,
        'name'           : d.name,
        'email'          : d.email,
        'phone'          : d.phone,
        'address'        : d.address,
        'donation_amount': d.donation_amount
    } for d in donors])


@donor_bp.route('/donor', methods=['POST'])
@token_required
def add_donor(current_user):
    data  = request.get_json()
    name  = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()

    if not name or not email:
        return jsonify({'error': 'Name and Email required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already connected to an account'}), 400

    donor_role = Role.query.filter_by(name='Donor').first()
    if not donor_role:
        return jsonify({'error': 'Donor role not found'}), 500

    try:
        new_user = User(
            name     = name,
            email    = email,
            password = generate_password_hash(secrets.token_urlsafe(32)),
            role_id  = donor_role.id
        )
        db.session.add(new_user)
        db.session.flush()

        new_donor = Donor(
            name            = name,
            email           = email,
            phone           = data.get('phone'),
            address         = data.get('address'),
            donation_amount = data.get('donation_amount', 0.0),
            user_id         = new_user.id
        )
        db.session.add(new_donor)

        # Send ONLY activation email — no confirmation/interview/reject emails
        from routes.forgot_password import send_set_password_email
        send_set_password_email(
            to_email = email,
            name     = name,
            role     = 'Donor',
            user_id  = new_user.id
        )

        db.session.commit()
        log_activity(current_user.id, "ADD_DONOR",
                     f"Added Donor: {name}, Amount: {data.get('donation_amount', 0)}")

        return jsonify({
            'message': f'Donor account created. Activation email sent to {email}.',
            'id'     : new_donor.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@donor_bp.route('/donor/<int:id>', methods=['PUT'])
@token_required
def update_donor(current_user, id):
    donor = Donor.query.get(id)
    if not donor:
        return jsonify({'error': 'Donor not found'}), 404

    data = request.get_json()
    donor.name            = data.get('name',            donor.name)
    donor.email           = data.get('email',           donor.email)
    donor.phone           = data.get('phone',           donor.phone)
    donor.address         = data.get('address',         donor.address)
    donor.donation_amount = data.get('donation_amount', donor.donation_amount)

    try:
        db.session.commit()
        log_activity(current_user.id, "UPDATE_DONOR", f"Updated Donor: {donor.name}")
        return jsonify({'message': 'Donor updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@donor_bp.route('/donor/<int:id>', methods=['DELETE'])
@token_required
def delete_donor(current_user, id):
    donor = Donor.query.get(id)
    if not donor:
        return jsonify({'error': 'Donor not found'}), 404

    try:
        name = donor.name
        db.session.delete(donor)
        db.session.commit()
        log_activity(current_user.id, "DELETE_DONOR", f"Deleted Donor: {name}")
        return jsonify({'message': 'Donor deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400