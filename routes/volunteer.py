from flask import Blueprint, request, jsonify, current_app
from database import db
from models import db, Volunteer, Beneficiary, User, Role
from .auth import token_required
from helpers import log_activity
from services.email_service import send_email
from werkzeug.security import generate_password_hash
import secrets

volunteer_bp = Blueprint('volunteer', __name__)



# ─── Email Templates ──────────────────────────────────────────────────────────
def build_beneficiary_approved_email(name):
    return f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#059669,#10b981);padding:30px;text-align:center">
    <h1 style="color:white;margin:0">ArcMission</h1>
    <p style="color:rgba(255,255,255,.85);margin:8px 0 0">Registration Approved!</p>
  </div>
  <div style="padding:30px">
    <h2 style="color:#1e293b">Dear {name},</h2>
    <p style="color:#475569">We are delighted to inform you that your beneficiary registration has been
      <strong style="color:#059669">approved</strong>.</p>
    <div style="background:#f0fdf4;border-left:4px solid #059669;padding:16px;border-radius:8px;margin:20px 0">
      <p style="color:#065f46;margin:0">Our team will be in touch shortly to connect you with the right support and resources.</p>
    </div>
    <p style="color:#475569">God bless you!<br><strong>ArcMission Team</strong></p>
  </div>
</div>"""


def build_beneficiary_rejected_email(name, reason=None):
    reason_html = (
        f'<div style="background:#fee2e2;border-left:4px solid #ef4444;padding:16px;'
        f'border-radius:8px;margin:20px 0">'
        f'<p style="color:#991b1b;margin:0"><strong>Reason:</strong> {reason}</p></div>'
    ) if reason else ''
    return f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:30px;text-align:center">
    <h1 style="color:white;margin:0">ArcMission</h1>
    <p style="color:rgba(255,255,255,.85);margin:8px 0 0">Registration Update</p>
  </div>
  <div style="padding:30px">
    <h2 style="color:#1e293b">Dear {name},</h2>
    <p style="color:#475569">Thank you for registering with us. After careful review, we are unable
      to process your registration at this time.</p>
    {reason_html}
    <p style="color:#475569">Please feel free to contact us for more information.
      We encourage you to reapply in the future.<br><strong>ArcMission Team</strong></p>
  </div>
</div>"""


# ─── Volunteer CRUD ───────────────────────────────────────────────────────────
@volunteer_bp.route('/volunteer', methods=['GET'])
@token_required
def get_volunteers(current_user):
    user_role = current_user.role.name
    if user_role in ['Admin', 'HR']:
        volunteers = Volunteer.query.all()
    elif user_role == 'Beneficiary':
        from models import Beneficiary
        ben = Beneficiary.query.filter_by(email=current_user.email).first()
        if ben and ben.assigned_volunteer_id:
            volunteers = Volunteer.query.filter_by(id=ben.assigned_volunteer_id).all()
        else:
            volunteers = []
    elif user_role == 'Volunteer':
        volunteers = Volunteer.query.filter_by(user_id=current_user.id).all()
    else:
        return jsonify({'error': 'Unauthorized access'}), 403

    return jsonify([{
        'id'          : v.id,
        'name'        : v.name,
        'email'       : v.email,
        'phone'       : v.phone,
        'skills'      : v.skills,
        'availability': v.availability
    } for v in volunteers])


@volunteer_bp.route('/volunteer', methods=['POST'])
@token_required
def add_volunteer(current_user):
    data  = request.get_json()
    name  = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()

    if not name or not email:
        return jsonify({'error': 'Name and Email required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already connected to an account'}), 400

    volunteer_role = Role.query.filter_by(name='Volunteer').first()
    if not volunteer_role:
        return jsonify({'error': 'Volunteer role not found'}), 500

    try:
        new_user = User(
            name     = name,
            email    = email,
            password = generate_password_hash(secrets.token_urlsafe(32)),
            role_id  = volunteer_role.id
        )
        db.session.add(new_user)
        db.session.flush()

        new_vol = Volunteer(
            name         = name,
            email        = email,
            phone        = data.get('phone'),
            skills       = data.get('skills'),
            availability = data.get('availability'),
            user_id      = new_user.id
        )
        db.session.add(new_vol)

        # Send ONLY activation email — no other emails for admin-added volunteers
        from routes.forgot_password import send_set_password_email
        send_set_password_email(
            to_email = email,
            name     = name,
            role     = 'Volunteer',
            user_id  = new_user.id
        )

        db.session.commit()
        log_activity(current_user.id, "ADD_VOLUNTEER", f"Added Volunteer: {name}")

        return jsonify({
            'message': f'Volunteer account created. Activation email sent to {email}.',
            'id'     : new_vol.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@volunteer_bp.route('/volunteer/<int:id>', methods=['PUT'])
@token_required
def update_volunteer(current_user, id):
    vol = Volunteer.query.get(id)
    if not vol:
        return jsonify({'error': 'Volunteer not found'}), 404
    data = request.get_json()
    vol.name         = data.get('name', vol.name)
    vol.email        = data.get('email', vol.email)
    vol.phone        = data.get('phone', vol.phone)
    vol.skills       = data.get('skills', vol.skills)
    vol.availability = data.get('availability', vol.availability)
    try:
        db.session.commit()
        log_activity(current_user.id, "UPDATE_VOLUNTEER", f"Updated Volunteer: {vol.name}")
        return jsonify({'message': 'Volunteer updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@volunteer_bp.route('/volunteer/<int:id>', methods=['DELETE'])
@token_required
def delete_volunteer(current_user, id):
    vol = Volunteer.query.get(id)
    if not vol:
        return jsonify({'error': 'Volunteer not found'}), 404
    try:
        name = vol.name
        db.session.delete(vol)
        db.session.commit()
        log_activity(current_user.id, "DELETE_VOLUNTEER", f"Deleted Volunteer: {name}")
        return jsonify({'message': 'Volunteer deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# ─── Beneficiary CRUD ─────────────────────────────────────────────────────────
@volunteer_bp.route('/beneficiary', methods=['GET'])
@token_required
def get_beneficiaries(current_user):
    user_role = current_user.role.name
    if user_role in ['Admin', 'HR']:
        bens = Beneficiary.query.all()
    elif user_role == 'Volunteer':
        vol = Volunteer.query.filter_by(user_id=current_user.id).first()
        if vol:
            bens = Beneficiary.query.filter_by(assigned_volunteer_id=vol.id).all()
        else:
            bens = []
    elif user_role == 'Beneficiary':
        bens = Beneficiary.query.filter_by(email=current_user.email).all()
    elif user_role == 'Donor':
        bens = Beneficiary.query.filter(Beneficiary.status.in_(['Approved', 'Served'])).all()
    else:
        bens = []

    return jsonify([{
        'id'                  : b.id,
        'name'                : b.name,
        'email'               : b.email or '',
        'phone'               : b.phone or '',
        'age'                 : b.age,
        'gender'              : b.gender,
        'status'              : b.status,
        'needs'               : b.needs,
        'assigned_volunteer_id': b.assigned_volunteer_id
    } for b in bens])


@volunteer_bp.route('/beneficiary', methods=['POST'])
@token_required
def add_beneficiary(current_user):
    data = request.get_json()
    if not data.get('name'):
        return jsonify({'error': 'Name required'}), 400
    new_ben = Beneficiary(
        name                 = data.get('name'),
        age                  = data.get('age'),
        gender               = data.get('gender'),
        needs                = data.get('needs'),
        status               = data.get('status', 'Pending'),
        assigned_volunteer_id = data.get('assigned_volunteer_id')
    )
    try:
        db.session.add(new_ben)
        db.session.commit()
        log_activity(current_user.id, "ADD_BENEFICIARY", f"Added Beneficiary: {data['name']}")
        return jsonify({'message': 'Beneficiary added successfully', 'id': new_ben.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@volunteer_bp.route('/beneficiary/<int:id>', methods=['PUT'])
@token_required
def update_beneficiary(current_user, id):
    ben = Beneficiary.query.get(id)
    if not ben:
        return jsonify({'error': 'Beneficiary not found'}), 404
    data = request.get_json()
    ben.name                  = data.get('name', ben.name)
    ben.age                   = data.get('age', ben.age)
    ben.gender                = data.get('gender', ben.gender)
    ben.needs                 = data.get('needs', ben.needs)
    ben.status                = data.get('status', ben.status)
    ben.assigned_volunteer_id = data.get('assigned_volunteer_id', ben.assigned_volunteer_id)
    try:
        db.session.commit()
        log_activity(current_user.id, "UPDATE_BENEFICIARY", f"Updated Beneficiary: {ben.name}")
        return jsonify({'message': 'Beneficiary updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@volunteer_bp.route('/beneficiary/<int:id>', methods=['DELETE'])
@token_required
def delete_beneficiary(current_user, id):
    ben = Beneficiary.query.get(id)
    if not ben:
        return jsonify({'error': 'Beneficiary not found'}), 404
    try:
        name = ben.name
        db.session.delete(ben)
        db.session.commit()
        log_activity(current_user.id, "DELETE_BENEFICIARY", f"Deleted Beneficiary: {name}")
        return jsonify({'message': 'Beneficiary deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@volunteer_bp.route('/beneficiary/<int:id>/review', methods=['PUT'])
@token_required
def review_beneficiary(current_user, id):
    if current_user.role.name not in ['Admin', 'HR']:
        return jsonify({'error': 'Access denied'}), 403

    ben = Beneficiary.query.get(id)
    if not ben:
        return jsonify({'error': 'Beneficiary not found'}), 404

    data             = request.get_json()
    new_status       = data.get('status')
    rejection_reason = data.get('rejection_reason', '')
    email_to         = data.get('email') or ben.email

    if new_status not in ['Approved', 'Rejected']:
        return jsonify({'error': 'Status must be Approved or Rejected'}), 400

    ben.status = new_status
    try:
        db.session.commit()
        log_activity(current_user.id, f"BENEFICIARY_{new_status.upper()}",
                     f"{new_status} Beneficiary #{id}: {ben.name}")

        if email_to:
            if new_status == 'Approved':
                send_email(
                    to_email  = email_to,
                    subject   = 'Your Beneficiary Registration is Approved — ArcMission',
                    html_body = build_beneficiary_approved_email(ben.name)
                )
            else:
                send_email(
                    to_email  = email_to,
                    subject   = 'Your Beneficiary Registration Update — ArcMission',
                    html_body = build_beneficiary_rejected_email(ben.name, rejection_reason)
                )

        return jsonify({'message': f'Beneficiary {new_status} successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400