from flask import Blueprint, request, jsonify, current_app
from database import db
from models import Application, User, Role, Volunteer, Donor, Beneficiary
from .auth import token_required
from helpers import log_activity
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import uuid

application_bp = Blueprint('application', __name__)

# ─── Photo Upload Config ──────────────────────────────────────────────────────
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
MAX_PHOTO_BYTES    = 5 * 1024 * 1024   # 5 MB

def _allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def _photo_upload_dir():
    return os.path.join(current_app.root_path, 'static', 'uploads', 'photos')


# ─── Email Helper ─────────────────────────────────────────────────────────────
def send_email(to_email, subject, html_body):
    smtp_host = current_app.config.get('MAIL_SERVER', '')
    smtp_user = current_app.config.get('MAIL_USERNAME', '')
    smtp_pass = current_app.config.get('MAIL_PASSWORD', '')
    smtp_port = int(current_app.config.get('MAIL_PORT', 587))
    sender    = current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@ngoapp.com')

    if not smtp_host or not smtp_user:
        print("=" * 60)
        print(f"[EMAIL MOCK] From: {sender}  →  To: {to_email}")
        print(f"[EMAIL MOCK] Subject: {subject}")
        print(html_body)
        print("=" * 60)
        return True

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From']    = sender
        msg['To']      = to_email
        msg.attach(MIMEText(html_body, 'html'))
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(sender, to_email, msg.as_string())
        print(f"[EMAIL] Sent '{subject}'  →  {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send to {to_email}: {e}")
        return False


# ─── Helper: create User account + send activation email (called on Approve) ──
def _create_user_and_send_activation(name, email, role_name):
    """
    Called when HR approves an application.
    Creates User account with placeholder password.
    Sends welcome email with set-password link.
    Returns the created User, or existing User if already exists.
    """
    from routes.forgot_password import send_set_password_email
    from werkzeug.security import generate_password_hash
    import secrets

    existing = User.query.filter_by(email=email).first()
    if existing:
        return existing  # already approved before, skip

    role = Role.query.filter_by(name=role_name).first()
    if not role:
        return None

    user = User(
        name     = name,
        email    = email,
        password = generate_password_hash(secrets.token_urlsafe(32)),
        role_id  = role.id
    )
    db.session.add(user)
    db.session.flush()  # get user.id

    send_set_password_email(
        to_email = email,
        name     = name,
        role     = role_name,
        user_id  = user.id
    )
    return user


# ─── Email Templates ──────────────────────────────────────────────────────────
def build_confirmation_email(name, app_type, app_id):
    """Sent to applicant immediately after they submit — no account yet."""
    return f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#6366f1,#a855f7);padding:30px;text-align:center">
    <h1 style="color:white;margin:0">NGO Manager</h1>
    <p style="color:rgba(255,255,255,.85);margin:8px 0 0">Application Received</p>
  </div>
  <div style="padding:30px">
    <h2 style="color:#1e293b">Dear {name},</h2>
    <p style="color:#475569">Thank you for applying to join our NGO as a <strong>{app_type}</strong>.
      We have received your application (<strong>#{app_id}</strong>).</p>
    <div style="background:#f0fdf4;border-left:4px solid #059669;padding:16px;border-radius:8px;margin:20px 0">
      <p style="color:#065f46;margin:0">Our HR team will review your application within
        <strong>3–5 business days</strong>. If approved, you will receive an email with a link to
        set your password and access your account.</p>
    </div>
    <p style="color:#475569">God bless you!<br><strong>NGO Manager Team</strong></p>
  </div>
</div>"""


def build_beneficiary_confirmation_email(name, reg_id):
    """Sent to beneficiary immediately after they register — no account yet."""
    return f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:30px;text-align:center">
    <h1 style="color:white;margin:0">NGO Manager</h1>
    <p style="color:rgba(255,255,255,.85);margin:8px 0 0">Beneficiary Registration Received</p>
  </div>
  <div style="padding:30px">
    <h2 style="color:#1e293b">Dear {name},</h2>
    <p style="color:#475569">Thank you for registering. We have received your registration
      (<strong>#{reg_id}</strong>).</p>
    <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:8px;margin:20px 0">
      <p style="color:#92400e;margin:0">Our team will review your request within
        <strong>2–3 business days</strong>. If approved, you will receive an email with a link to
        set your password and access your account.</p>
    </div>
    <p style="color:#475569">If you have any urgent needs, please contact us directly.<br>
      <strong>NGO Manager Team</strong></p>
  </div>
</div>"""


def build_interview_email(name, app_type, interview_dt, notes):
    date_str = interview_dt.strftime('%A, %d %B %Y at %I:%M %p') if interview_dt else 'TBD'
    notes_html = (
        f'<div style="background:#f8fafc;padding:16px;border-radius:8px;margin:16px 0">'
        f'<p style="color:#475569;margin:0"><strong>Additional Info:</strong> {notes}</p></div>'
    ) if notes else ''
    return f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#6366f1,#a855f7);padding:30px;text-align:center">
    <h1 style="color:white;margin:0">NGO Manager</h1>
    <p style="color:rgba(255,255,255,.85);margin:8px 0 0">Interview Scheduled</p>
  </div>
  <div style="padding:30px">
    <h2 style="color:#1e293b">Dear {name},</h2>
    <p style="color:#475569">We would like to invite you for an interview for your
      <strong>{app_type}</strong> application.</p>
    <div style="background:#e0e7ff;border-left:4px solid #6366f1;padding:20px;border-radius:8px;margin:20px 0;text-align:center">
      <p style="color:#3730a3;font-size:1.2rem;font-weight:700;margin:0">📅 {date_str}</p>
    </div>
    {notes_html}
    <p style="color:#475569">Please confirm by replying to this email.<br>
      <strong>HR Team, NGO Manager</strong></p>
  </div>
</div>"""


def build_rejection_email(name, reason=None):
    reason_html = (
        f'<div style="background:#fee2e2;padding:16px;border-radius:8px;margin:16px 0">'
        f'<p style="color:#991b1b;margin:0"><strong>Reason:</strong> {reason}</p></div>'
    ) if reason else ''
    return f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
  <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:30px;text-align:center;border-radius:12px 12px 0 0">
    <h1 style="color:white;margin:0">NGO Manager</h1>
    <p style="color:rgba(255,255,255,.85);margin:8px 0 0">Application Update</p>
  </div>
  <div style="background:#fff;padding:30px;border-radius:0 0 12px 12px">
    <h2 style="color:#1e293b">Dear {name},</h2>
    <p style="color:#475569">We are unable to approve your application at this time.</p>
    {reason_html}
    <p style="color:#475569">We encourage you to reapply in the future.<br>
      <strong>NGO Manager Team</strong></p>
  </div>
</div>"""


# ─── Routes ───────────────────────────────────────────────────────────────────

@application_bp.route('/upload/photo', methods=['POST'])
def upload_photo():
    if 'photo' not in request.files:
        return jsonify({'error': 'No photo file provided.'}), 400
    file = request.files['photo']
    if not file or file.filename == '':
        return jsonify({'error': 'No file selected.'}), 400
    if not _allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Allowed: jpg, jpeg, png, gif, webp.'}), 400
    file.seek(0, 2)
    if file.tell() > MAX_PHOTO_BYTES:
        return jsonify({'error': 'File too large. Maximum size is 5 MB.'}), 400
    file.seek(0)
    ext         = file.filename.rsplit('.', 1)[1].lower()
    unique_name = f'{uuid.uuid4().hex}.{ext}'
    upload_dir  = _photo_upload_dir()
    os.makedirs(upload_dir, exist_ok=True)
    file.save(os.path.join(upload_dir, unique_name))
    return jsonify({'filename': unique_name, 'url': f'/static/uploads/photos/{unique_name}'}), 200


@application_bp.route('/apply', methods=['POST'])
def submit_application():
    """
    Public — no auth required.
    Saves the application. NO user account created yet.
    Account is created only when HR approves (update_status → Approved).
    """
    data = request.get_json()

    for field in ['full_name', 'email', 'application_type']:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    if data['application_type'] not in ['Volunteer', 'Donor']:
        return jsonify({'error': 'application_type must be Volunteer or Donor'}), 400

    # Prevent duplicate applications from same email
    existing = Application.query.filter_by(
        email=data['email'],
        application_type=data['application_type']
    ).filter(Application.status.notin_(['Rejected'])).first()
    if existing:
        return jsonify({'error': 'An application with this email is already under review.'}), 400

    app_obj = Application(
        application_type        = data['application_type'],
        full_name               = data.get('full_name'),
        email                   = data.get('email'),
        phone                   = data.get('phone'),
        address                 = data.get('address'),
        age                     = data.get('age'),
        gender                  = data.get('gender'),
        occupation              = data.get('occupation'),
        id_proof_type           = data.get('id_proof_type'),
        id_proof_number         = data.get('id_proof_number'),
        education               = data.get('education'),
        work_experience         = data.get('work_experience'),
        previous_ngo_experience = data.get('previous_ngo_experience'),
        skills                  = data.get('skills'),
        availability            = data.get('availability'),
        donation_capacity       = data.get('donation_capacity'),
        reference_name          = data.get('reference_name'),
        reference_contact       = data.get('reference_contact'),
        criminal_record         = data.get('criminal_record') in (True, 'Yes', 'yes', 'true', '1'),
        criminal_details        = data.get('criminal_details'),
        is_christian            = data.get('is_christian') in (True, 'Yes', 'yes', 'true', '1'),
        years_as_believer       = data.get('years_as_believer'),
        church_name             = data.get('church_name'),
        church_location         = data.get('church_location'),
        pastor_name             = data.get('pastor_name'),
        pastor_contact          = data.get('pastor_contact'),
        spiritual_gifts         = data.get('spiritual_gifts'),
        ministry_involvement    = data.get('ministry_involvement'),
        personal_testimony      = data.get('personal_testimony'),
        reason_to_join          = data.get('reason_to_join'),
        agrees_to_statement     = bool(data.get('agrees_to_statement', False)),
        photo_filename          = data.get('photo_filename'),
    )

    try:
        db.session.add(app_obj)
        db.session.commit()

        # Send confirmation email (no account yet, just acknowledgement)
        send_email(
            to_email  = app_obj.email,
            subject   = f'Application Received — NGO Manager #{app_obj.id}',
            html_body = build_confirmation_email(app_obj.full_name, app_obj.application_type, app_obj.id)
        )

        return jsonify({
            'message'       : 'Application submitted! Our team will review it and contact you within 3–5 business days.',
            'application_id': app_obj.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@application_bp.route('/apply/beneficiary', methods=['POST'])
def submit_beneficiary_application():
    """
    Public — no auth required.
    Saves the beneficiary registration. NO user account created yet.
    Account is created only when HR approves via /beneficiary/<id>/review.
    """
    data = request.get_json()

    for field in ['full_name', 'email', 'phone', 'age', 'address']:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    needs_raw      = data.get('needs') or ''
    needs_list     = data.get('needs_list', [])
    needs_combined = needs_raw if needs_raw else ', '.join(needs_list)

    extra_lines = []
    for key, label in [
        ('situation_description', 'Situation'),
        ('income_range',          'Income'),
        ('num_dependants',        'Dependants'),
        ('medical_conditions',    'Medical'),
        ('marital_status',        'Marital Status'),
        ('church_name',           'Church'),
    ]:
        if data.get(key):
            extra_lines.append(f"{label}: {data[key]}")

    if data.get('emergency_contact_name'):
        extra_lines.append(
            f"Emergency Contact: {data['emergency_contact_name']} "
            f"({data.get('emergency_contact_phone', '')}) - {data.get('emergency_contact_relation', '')}"
        )
    if data.get('govt_support') == 'Yes' and data.get('govt_support_details'):
        extra_lines.append(f"Govt Support: {data['govt_support_details']}")

    full_needs = needs_combined + ('\n' + '\n'.join(extra_lines) if extra_lines else '')

    beneficiary = Beneficiary(
        name           = data['full_name'],
        email          = data.get('email', ''),
        phone          = data.get('phone', ''),
        age            = int(data['age']) if data.get('age') else None,
        gender         = data.get('gender', ''),
        needs          = full_needs,
        status         = 'Pending',
        photo_filename = data.get('photo_filename'),
    )

    try:
        db.session.add(beneficiary)
        db.session.commit()

        # Send confirmation email (no account yet)
        send_email(
            to_email  = data['email'],
            subject   = f'Registration Received — NGO Manager #{beneficiary.id}',
            html_body = build_beneficiary_confirmation_email(data['full_name'], beneficiary.id)
        )

        return jsonify({
            'message'        : 'Registration submitted! Our team will review it within 2–3 business days.',
            'registration_id': beneficiary.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@application_bp.route('/applications', methods=['GET'])
@token_required
def get_applications(current_user):
    type_filter   = request.args.get('type')
    status_filter = request.args.get('status')
    q = Application.query
    if type_filter:   q = q.filter_by(application_type=type_filter)
    if status_filter: q = q.filter_by(status=status_filter)
    return jsonify([serialize_app(a) for a in q.order_by(Application.submitted_at.desc()).all()])


@application_bp.route('/applications/<int:id>', methods=['GET'])
@token_required
def get_application(current_user, id):
    a = Application.query.get(id)
    if not a:
        return jsonify({'error': 'Application not found'}), 404
    return jsonify(serialize_app(a, full=True))


@application_bp.route('/applications/<int:id>/status', methods=['PUT'])
@token_required
def update_status(current_user, id):
    a = Application.query.get(id)
    if not a:
        return jsonify({'error': 'Application not found'}), 404

    data       = request.get_json()
    new_status = data.get('status')
    allowed    = ['Pending', 'Under Review', 'Interview Scheduled', 'Approved', 'Rejected']
    if new_status not in allowed:
        return jsonify({'error': f'Status must be one of: {allowed}'}), 400

    a.status      = new_status
    a.reviewed_by = current_user.id

    if new_status == 'Rejected':
        a.rejection_reason = data.get('rejection_reason', '')
        send_email(
            to_email  = a.email,
            subject   = 'Application Update — NGO Manager',
            html_body = build_rejection_email(a.full_name, a.rejection_reason)
        )

    elif new_status == 'Approved':
        # ── Create user account + send set-password email ─────────────────
        role_name = a.application_type  # 'Volunteer' or 'Donor'
        user = _create_user_and_send_activation(a.full_name, a.email, role_name)

        # ── Create role-specific profile record ───────────────────────────
        if user and role_name == 'Volunteer':
            if not Volunteer.query.filter_by(email=a.email).first():
                db.session.add(Volunteer(
                    name         = a.full_name,
                    email        = a.email,
                    phone        = a.phone,
                    skills       = a.skills,
                    availability = a.availability
                ))
        elif user and role_name == 'Donor':
            if not Donor.query.filter_by(email=a.email).first():
                db.session.add(Donor(
                    name  = a.full_name,
                    email = a.email,
                    phone = a.phone,
                ))

    try:
        db.session.commit()
        log_activity(current_user.id, "UPDATE_APPLICATION", f"Application #{id} status → {new_status}")
        return jsonify({'message': f'Status updated to {new_status}'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@application_bp.route('/applications/<int:id>/schedule-interview', methods=['POST'])
@token_required
def schedule_interview(current_user, id):
    a = Application.query.get(id)
    if not a:
        return jsonify({'error': 'Application not found'}), 404

    data               = request.get_json()
    interview_date_str = data.get('interview_date')
    notes              = data.get('notes', '')

    if not interview_date_str:
        return jsonify({'error': 'interview_date is required'}), 400

    try:
        interview_dt = datetime.fromisoformat(interview_date_str)
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use ISO: 2026-03-01T10:00'}), 400

    a.interview_date  = interview_dt
    a.interview_notes = notes
    a.status          = 'Interview Scheduled'
    a.reviewed_by     = current_user.id

    try:
        db.session.commit()
        log_activity(current_user.id, "SCHEDULE_INTERVIEW", f"Interview for #{id} on {interview_date_str}")
        sent = send_email(
            to_email  = a.email,
            subject   = 'Interview Scheduled — NGO Manager',
            html_body = build_interview_email(a.full_name, a.application_type, interview_dt, notes)
        )
        return jsonify({
            'message'       : 'Interview scheduled and email sent' if sent else 'Scheduled (email failed)',
            'interview_date': interview_date_str
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# ─── Serializer ───────────────────────────────────────────────────────────────
def serialize_app(a, full=False):
    base = {
        'id'              : a.id,
        'application_type': a.application_type,
        'status'          : a.status,
        'full_name'       : a.full_name,
        'email'           : a.email,
        'phone'           : a.phone,
        'age'             : a.age,
        'gender'          : a.gender,
        'church_name'     : a.church_name,
        'skills'          : a.skills,
        'interview_date'  : a.interview_date.isoformat() if a.interview_date else None,
        'submitted_at'    : a.submitted_at.strftime('%d %b %Y') if a.submitted_at else None,
    }
    if full:
        base.update({
            'address'                : a.address,
            'occupation'             : a.occupation,
            'id_proof_type'          : a.id_proof_type,
            'id_proof_number'        : a.id_proof_number,
            'education'              : a.education,
            'work_experience'        : a.work_experience,
            'previous_ngo_experience': a.previous_ngo_experience,
            'availability'           : a.availability,
            'donation_capacity'      : a.donation_capacity,
            'reference_name'         : a.reference_name,
            'reference_contact'      : a.reference_contact,
            'criminal_record'        : a.criminal_record,
            'criminal_details'       : a.criminal_details,
            'is_christian'           : a.is_christian,
            'years_as_believer'      : a.years_as_believer,
            'church_location'        : a.church_location,
            'pastor_name'            : a.pastor_name,
            'pastor_contact'         : a.pastor_contact,
            'spiritual_gifts'        : a.spiritual_gifts,
            'ministry_involvement'   : a.ministry_involvement,
            'personal_testimony'     : a.personal_testimony,
            'reason_to_join'         : a.reason_to_join,
            'agrees_to_statement'    : a.agrees_to_statement,
            'interview_notes'        : a.interview_notes,
            'rejection_reason'       : a.rejection_reason,
            'photo_url'              : f'/static/uploads/photos/{a.photo_filename}' if a.photo_filename else None,
        })
    return base