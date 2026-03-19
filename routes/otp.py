"""
OTP Verification Routes (Fast2SMS)
--------------------------------------
POST /otp/send    { phone_number }       -> generate & send OTP via Fast2SMS (free)
POST /otp/verify  { phone_number, otp }  -> verify OTP (expiry + attempt check)
POST /otp/resend  { phone_number }       -> resend OTP (rate-limited, 30s cooldown)
"""

import random
import hashlib
import requests as http_requests
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from database import db
from models import OtpVerification

otp_bp = Blueprint('otp', __name__, url_prefix='/otp')

# ─── Constants ────────────────────────────────────────────────────────────────
OTP_EXPIRY_MINUTES = 5
MAX_ATTEMPTS       = 3
RESEND_COOLDOWN_S  = 30


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


def _normalise_phone(phone: str) -> str:
    """Strip spaces/dashes/+91 prefix; return 10-digit Indian number."""
    digits = ''.join(c for c in phone if c.isdigit())
    if len(digits) == 12 and digits.startswith('91'):
        digits = digits[2:]
    return digits


def _mask_phone(phone: str) -> str:
    if len(phone) >= 4:
        return '*' * (len(phone) - 4) + phone[-4:]
    return '****'


def _send_sms_fast2sms(to_phone: str, otp: str) -> None:
    """
    Send OTP via Fast2SMS.
    Always prints OTP to console for local testing.
    Uses real SMS only when FAST2SMS_API_KEY is set in .env.
    """
    api_key = current_app.config.get('FAST2SMS_API_KEY', '')

    # Always print to console (useful in development)
    print('\n' + '=' * 50)
    print(f'  [OTP] Phone : {to_phone}')
    print(f'  [OTP] Code  : {otp}')
    print(f'  [OTP] Valid : {OTP_EXPIRY_MINUTES} minutes')
    print('=' * 50 + '\n')

    if not api_key or api_key.startswith('YOUR_'):
        print('[OTP] No FAST2SMS_API_KEY set — using console OTP only.')
        return

    url     = 'https://www.fast2sms.com/dev/bulkV2'
    payload = {
        'route'   : 'q',
        'message' : f'Your NGO Manager OTP is {otp}. Valid for {OTP_EXPIRY_MINUTES} minutes. Do not share.',
        'language': 'english',
        'numbers' : to_phone,
    }
    headers = {
        'authorization': api_key,
        'Content-Type' : 'application/x-www-form-urlencoded',
    }

    try:
        response = http_requests.post(url, data=payload, headers=headers, timeout=10)
        result   = response.json()
        if result.get('return', False):
            print(f'[OTP] SMS delivered to {_mask_phone(to_phone)}')
        else:
            print(f'[OTP] SMS not delivered: {result.get("message", "unknown")}. Use console OTP.')
    except Exception as e:
        print(f'[OTP] SMS request failed: {e}. Use console OTP.')


def _delete_old_otps(phone: str) -> None:
    OtpVerification.query.filter_by(phone_number=phone).delete()
    db.session.flush()


# ─── Routes ───────────────────────────────────────────────────────────────────

@otp_bp.route('/send', methods=['POST'])
def send_otp():
    """
    Send a 6-digit OTP to the given phone number via Fast2SMS.
    ---
    tags:
      - OTP
    parameters:
      - in: body
        required: true
        schema:
          properties:
            phone_number:
              type: string
              example: "9876543210"
    responses:
      200:
        description: OTP sent successfully
      400:
        description: Missing or invalid phone number
      500:
        description: Fast2SMS or DB error
    """
    data  = request.get_json() or {}
    phone = _normalise_phone(data.get('phone_number', ''))

    if not phone or len(phone) < 7:
        return jsonify({'error': 'A valid phone number is required.'}), 400

    otp      = str(random.randint(100000, 999999))
    otp_hash = _hash_otp(otp)
    expiry   = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)

    try:
        _delete_old_otps(phone)
        db.session.add(OtpVerification(
            phone_number=phone,
            otp_hash=otp_hash,
            expiry_time=expiry
        ))
        db.session.commit()
        _send_sms_fast2sms(phone, otp)

        return jsonify({
            'message'   : f'OTP sent to {_mask_phone(phone)}.',
            'phone_hint': _mask_phone(phone),
            'expires_in': OTP_EXPIRY_MINUTES * 60
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to send OTP: {str(e)}'}), 500


@otp_bp.route('/verify', methods=['POST'])
def verify_otp():
    """
    Verify the OTP entered by the user.
    ---
    tags:
      - OTP
    parameters:
      - in: body
        required: true
        schema:
          properties:
            phone_number:
              type: string
            otp:
              type: string
              example: "482915"
    responses:
      200:
        description: OTP verified successfully
      400:
        description: Invalid or expired OTP
      429:
        description: Max attempts reached
    """
    data  = request.get_json() or {}
    phone = _normalise_phone(data.get('phone_number', ''))
    otp   = str(data.get('otp', '')).strip()

    if not phone or not otp:
        return jsonify({'error': 'phone_number and otp are required.'}), 400

    record = (OtpVerification.query
              .filter_by(phone_number=phone, verified=False)
              .order_by(OtpVerification.created_at.desc())
              .first())

    if not record:
        return jsonify({'error': 'No pending OTP found. Please request a new one.'}), 400

    if record.attempts >= MAX_ATTEMPTS:
        return jsonify({'error': 'Too many incorrect attempts. Please resend a new OTP.'}), 429

    if datetime.utcnow() > record.expiry_time:
        db.session.delete(record)
        db.session.commit()
        return jsonify({'error': 'OTP has expired. Please request a new one.'}), 400

    if _hash_otp(otp) != record.otp_hash:
        record.attempts += 1
        remaining = MAX_ATTEMPTS - record.attempts
        db.session.commit()
        return jsonify({'error': f'Incorrect OTP. {remaining} attempt(s) remaining.'}), 400

    # ✅ Correct OTP
    record.verified = True
    db.session.commit()

    return jsonify({
        'verified': True,
        'message' : f'Phone {_mask_phone(phone)} verified successfully.'
    }), 200


@otp_bp.route('/resend', methods=['POST'])
def resend_otp():
    """
    Resend OTP with a 30-second cooldown.
    ---
    tags:
      - OTP
    parameters:
      - in: body
        required: true
        schema:
          properties:
            phone_number:
              type: string
    responses:
      200:
        description: New OTP sent
      429:
        description: Resend too soon
      500:
        description: Fast2SMS or DB error
    """
    data  = request.get_json() or {}
    phone = _normalise_phone(data.get('phone_number', ''))

    if not phone or len(phone) < 7:
        return jsonify({'error': 'A valid phone number is required.'}), 400

    # Cooldown check
    cooldown_cutoff = datetime.utcnow() - timedelta(seconds=RESEND_COOLDOWN_S)
    recent = OtpVerification.query.filter(
        OtpVerification.phone_number == phone,
        OtpVerification.created_at  >= cooldown_cutoff
    ).first()

    if recent:
        wait = int((recent.created_at - cooldown_cutoff).total_seconds()) + 1
        return jsonify({'error': f'Please wait {wait} second(s) before requesting a new OTP.'}), 429

    otp      = str(random.randint(100000, 999999))
    otp_hash = _hash_otp(otp)
    expiry   = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)

    try:
        _delete_old_otps(phone)
        db.session.add(OtpVerification(
            phone_number=phone,
            otp_hash=otp_hash,
            expiry_time=expiry
        ))
        db.session.commit()
        _send_sms_fast2sms(phone, otp)

        return jsonify({
            'message'   : f'New OTP sent to {_mask_phone(phone)}.',
            'phone_hint': _mask_phone(phone),
            'expires_in': OTP_EXPIRY_MINUTES * 60
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to resend OTP: {str(e)}'}), 500