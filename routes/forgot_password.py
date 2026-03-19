"""
Forgot Password, Reset Password & Set Password (new account activation)
------------------------------------------------------------------------
POST /forgot-password   { email }                  → sends reset link
POST /reset-password    { token, new_password }    → resets existing password
POST /set-password      { token, new_password }    → activates new account (first-time)
"""
from flask import Blueprint, request, jsonify, current_app
from database import db
from models import User
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import secrets

forgot_bp = Blueprint('forgot', __name__)

# In-memory token stores
# NOTE: resets on server restart. For production, move to DB or Redis.
_reset_tokens   = {}   # forgot-password tokens
_set_pwd_tokens = {}   # new account activation tokens


def _send_reset_email(to_email, reset_link, name):
    """Send password reset email."""
    from routes.application import send_email
    html = f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:16px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#6366f1,#a855f7);padding:36px;text-align:center">
    <h1 style="color:white;margin:0;font-size:1.8rem">NGO Manager</h1>
    <p style="color:rgba(255,255,255,.85);margin:8px 0 0">Password Reset Request</p>
  </div>
  <div style="padding:36px">
    <h2 style="color:#1e293b">Hi {name},</h2>
    <p style="color:#475569">We received a request to reset your password. Click the button below
      to create a new one. This link expires in <strong>30 minutes</strong>.</p>
    <div style="text-align:center;margin:32px 0">
      <a href="{reset_link}"
         style="background:linear-gradient(135deg,#6366f1,#a855f7);color:white;text-decoration:none;
                padding:14px 32px;border-radius:25px;font-weight:700;font-size:1rem;display:inline-block">
        Reset My Password →
      </a>
    </div>
    <p style="color:#94a3b8;font-size:0.85rem">If you didn't request this, you can safely ignore this email.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="color:#94a3b8;font-size:0.8rem;text-align:center">
      This link expires in 30 minutes and can only be used once.
    </p>
  </div>
</div>"""
    send_email(to_email, 'Reset Your NGO Manager Password', html)


def send_set_password_email(to_email, name, role, user_id):
    """
    Generate activation token and send welcome email with set-password link.
    Called from application.py when Volunteer/Donor/Beneficiary applies,
    and from hr.py when Admin creates HR/Employee accounts.

    From: MAIL_DEFAULT_SENDER  →  To: new user's email
    """
    from routes.application import send_email

    token = secrets.token_urlsafe(32)
    _set_pwd_tokens[token] = {
        'user_id'   : user_id,
        'expires_at': datetime.utcnow() + timedelta(hours=24)
    }

    base_url = current_app.config.get('SITE_URL', 'http://localhost:5000')
    set_link = f"{base_url}/#/login?set-token={token}"

    html = f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:16px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#059669,#10b981);padding:36px;text-align:center">
    <h1 style="color:white;margin:0;font-size:1.8rem">NGO Manager</h1>
    <p style="color:rgba(255,255,255,.85);margin:8px 0 0">Welcome! Activate Your Account</p>
  </div>
  <div style="padding:36px">
    <h2 style="color:#1e293b">Hi {name},</h2>
    <p style="color:#475569">Your <strong>{role}</strong> account has been created on NGO Manager.
      Click the button below to set your password and activate your account.</p>
    <div style="text-align:center;margin:32px 0">
      <a href="{set_link}"
         style="background:linear-gradient(135deg,#059669,#10b981);color:white;text-decoration:none;
                padding:14px 32px;border-radius:25px;font-weight:700;font-size:1rem;display:inline-block">
        Activate My Account →
      </a>
    </div>
    <div style="background:#f0fdf4;border-left:4px solid #059669;padding:16px;border-radius:8px;margin:20px 0">
      <p style="color:#065f46;margin:0">This link expires in <strong>24 hours</strong>.
        If you did not expect this email, please ignore it.</p>
    </div>
    <p style="color:#475569">God bless you!<br><strong>NGO Manager Team</strong></p>
  </div>
</div>"""
    send_email(to_email, 'Activate Your NGO Manager Account', html)


# ─── Routes ───────────────────────────────────────────────────────────────────

@forgot_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data  = request.get_json()
    email = (data.get('email') or '').strip().lower()

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = User.query.filter_by(email=email).first()

    # Always return same message to prevent email enumeration
    if not user:
        return jsonify({'message': 'If that email is registered, a reset link has been sent.'}), 200

    token = secrets.token_urlsafe(32)
    _reset_tokens[token] = {
        'user_id'   : user.id,
        'expires_at': datetime.utcnow() + timedelta(minutes=30)
    }

    base_url   = current_app.config.get('SITE_URL', 'http://localhost:5000')
    reset_link = f"{base_url}/#/login?reset-token={token}"
    _send_reset_email(user.email, reset_link, user.name)

    return jsonify({'message': 'If that email is registered, a reset link has been sent.'}), 200


@forgot_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data         = request.get_json()
    token        = data.get('token', '').strip()
    new_password = data.get('new_password', '').strip()

    if not token or not new_password:
        return jsonify({'error': 'Token and new password are required'}), 400

    if len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    record = _reset_tokens.get(token)
    if not record:
        return jsonify({'error': 'Invalid or expired reset link. Please request a new one.'}), 400

    if datetime.utcnow() > record['expires_at']:
        _reset_tokens.pop(token, None)
        return jsonify({'error': 'This reset link has expired. Please request a new one.'}), 400

    user = User.query.get(record['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.password = generate_password_hash(new_password)
    try:
        db.session.commit()
        _reset_tokens.pop(token, None)
        return jsonify({'message': 'Password reset successfully! You can now log in.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@forgot_bp.route('/set-password', methods=['POST'])
def set_password():
    """
    New account activation — called when user clicks 'Activate My Account'
    from their welcome email link (/#/login?set-token=xxx).
    """
    data         = request.get_json()
    token        = data.get('token', '').strip()
    new_password = data.get('new_password', '').strip()

    if not token or not new_password:
        return jsonify({'error': 'Token and new password are required'}), 400

    if len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    record = _set_pwd_tokens.get(token)
    if not record:
        return jsonify({'error': 'Invalid or expired activation link. Please contact support.'}), 400

    if datetime.utcnow() > record['expires_at']:
        _set_pwd_tokens.pop(token, None)
        return jsonify({'error': 'This activation link has expired. Please contact support.'}), 400

    user = User.query.get(record['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.password = generate_password_hash(new_password)
    try:
        db.session.commit()
        _set_pwd_tokens.pop(token, None)
        return jsonify({'message': 'Account activated successfully! You can now log in.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500