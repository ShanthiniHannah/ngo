from flask import Blueprint, request, jsonify, current_app
from database import db
from models import User, Role, Volunteer, Donor, Beneficiary, Employee, ActivityLog, Attendance
from werkzeug.security import check_password_hash
import jwt
import datetime
import functools
import secrets

auth_bp = Blueprint('auth', __name__)

# In-memory store for partial login tokens (awaiting OTP)
_partial_tokens = {}


def token_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            token = auth_header.split(" ")[1] if auth_header.startswith("Bearer ") else auth_header

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data         = jwt.decode(token, current_app.secret_key, algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 401

        return f(current_user, *args, **kwargs)
    return decorated


def _auto_checkin(user_id):
    """Record CHECK_IN in activity log and attendance table on login."""
    try:
        now   = datetime.datetime.utcnow()
        today = now.date()

        # Activity log
        db.session.add(ActivityLog(
            user_id   = user_id,
            action    = 'CHECK_IN',
            details   = 'Auto check-in on login',
            timestamp = now
        ))

        # Attendance — create or update today's record
        att = Attendance.query.filter_by(user_id=user_id, date=today).first()
        if not att:
            att = Attendance(user_id=user_id, date=today, status='Present', check_in_time=now.time())
            db.session.add(att)
        elif not att.check_in_time:
            att.check_in_time = now.time()
            att.status        = 'Present'

        db.session.commit()
        print(f'[CHECK_IN] User {user_id} checked in at {now}')
    except Exception as e:
        db.session.rollback()
        print(f'[CHECK_IN ERROR] {e}')


def _auto_checkout(user_id):
    """Record CHECK_OUT in activity log and attendance table on logout."""
    try:
        now   = datetime.datetime.utcnow()
        today = now.date()

        # Activity log
        db.session.add(ActivityLog(
            user_id   = user_id,
            action    = 'CHECK_OUT',
            details   = 'Auto check-out on logout',
            timestamp = now
        ))

        # Attendance — update today's record with check_out time
        att = Attendance.query.filter_by(user_id=user_id, date=today).first()
        if att:
            att.check_out_time = now.time()

        db.session.commit()
        print(f'[CHECK_OUT] User {user_id} checked out at {now}')
    except Exception as e:
        db.session.rollback()
        print(f'[CHECK_OUT ERROR] {e}')


@auth_bp.route('/login', methods=['POST'])
def login():
    data     = request.get_json()
    email    = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    # ── OTP 2-step: check if user has a phone number ─────────────────────────
    phone = _get_user_phone(user)
    if phone:
        from routes.otp import _mask_phone, _normalise_phone, _send_sms_fast2sms, _hash_otp, _delete_old_otps
        from models import OtpVerification
        import random
        from datetime import timedelta

        otp        = str(random.randint(100000, 999999))
        expiry     = datetime.datetime.utcnow() + timedelta(minutes=5)
        norm_phone = _normalise_phone(phone)

        try:
            _delete_old_otps(norm_phone)
            db.session.add(OtpVerification(
                phone_number = norm_phone,
                otp_hash     = _hash_otp(otp),
                expiry_time  = expiry
            ))
            db.session.commit()
            _send_sms_fast2sms(norm_phone, otp)
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to send OTP: {str(e)}'}), 500

        partial = secrets.token_urlsafe(32)
        _partial_tokens[partial] = {
            'user_id'   : user.id,
            'role'      : user.role.name,
            'expires_at': datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
        }

        return jsonify({
            'otp_required' : True,
            'phone_hint'   : _mask_phone(norm_phone),
            'phone_number' : norm_phone,
            'partial_token': partial
        })

    # _auto_checkin(user.id)  # Disabled so users check in manually
    return jsonify(_build_jwt_response(user))


@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Auto check-out on logout."""
    # _auto_checkout(current_user.id)  # Disabled so users check out manually
    return jsonify({'message': 'Logged out successfully'})


@auth_bp.route('/login/complete-otp', methods=['POST'])
def complete_otp_login():
    """
    Exchange a partial_token (after OTP verified) for a full JWT.
    Also triggers auto check-in.
    ---
    tags:
      - Auth
    parameters:
      - in: body
        required: true
        schema:
          properties:
            partial_token:
              type: string
    responses:
      200:
        description: Full JWT + user object
      400:
        description: Missing or expired partial token
    """
    data = request.get_json() or {}
    pt   = data.get('partial_token', '').strip()

    if not pt:
        return jsonify({'error': 'partial_token is required.'}), 400

    record = _partial_tokens.pop(pt, None)
    if not record:
        return jsonify({'error': 'Invalid or expired partial token. Please log in again.'}), 400

    if datetime.datetime.utcnow() > record['expires_at']:
        return jsonify({'error': 'Login session expired. Please start again.'}), 400

    user = User.query.get(record['user_id'])
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    # Auto check-in after OTP login too
    # _auto_checkin(user.id)
    return jsonify(_build_jwt_response(user))


def _get_user_phone(user):
    role = user.role.name
    if role == 'Volunteer':
        rec = Volunteer.query.filter_by(email=user.email).first()
    elif role == 'Donor':
        rec = Donor.query.filter_by(email=user.email).first()
    elif role == 'Beneficiary':
        rec = Beneficiary.query.filter_by(email=user.email).first()
    else:
        return None
    return rec.phone if rec and rec.phone else None


def _build_jwt_response(user):
    token = jwt.encode({
        'user_id': user.id,
        'role'   : user.role.name,
        'exp'    : datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, current_app.secret_key, algorithm="HS256")

    return {
        'message': 'Logged in successfully',
        'token'  : token,
        'user'   : {
            'id'   : user.id,
            'name' : user.name,
            'email': user.email,
            'role' : user.role.name
        }
    }


@auth_bp.route('/check-auth', methods=['GET'])
@token_required
def check_auth(current_user):
    return jsonify({
        'authenticated': True,
        'user': {
            'id'  : current_user.id,
            'name': current_user.name,
            'role': current_user.role.name
        }
    })


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_my_profile(current_user):
    role = current_user.role.name
    base = {
        'id'   : current_user.id,
        'name' : current_user.name,
        'email': current_user.email,
        'role' : role
    }

    if role == 'Employee':
        emp = Employee.query.filter_by(email=current_user.email).first()
        if emp:
            base['profile'] = {
                'age'        : emp.age,
                'gender'     : emp.gender,
                'address'    : emp.address,
                'sponsor'    : emp.sponsor,
                'employee_id': emp.id
            }
    elif role == 'Volunteer':
        vol = Volunteer.query.filter_by(email=current_user.email).first()
        if vol:
            base['profile'] = {
                'phone'       : vol.phone,
                'skills'      : vol.skills,
                'availability': vol.availability,
                'volunteer_id': vol.id
            }
    elif role == 'Donor':
        donor = Donor.query.filter_by(email=current_user.email).first()
        if donor:
            base['profile'] = {
                'phone'          : donor.phone,
                'donation_amount': donor.donation_amount,
                'donor_id'       : donor.id
            }
    elif role == 'Beneficiary':
        ben = Beneficiary.query.filter_by(email=current_user.email).first()
        if ben:
            base['profile'] = {
                'age'           : ben.age,
                'gender'        : ben.gender,
                'needs'         : ben.needs,
                'status'        : ben.status,
                'beneficiary_id': ben.id
            }

    return jsonify(base)