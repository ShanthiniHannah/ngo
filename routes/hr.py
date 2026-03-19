from flask import Blueprint, request, jsonify, current_app
from database import db
from models import User, Role, ActivityLog, Attendance, Leave
from werkzeug.security import generate_password_hash
from .auth import token_required
from helpers import log_activity
import secrets

hr_bp = Blueprint('hr', __name__)


@hr_bp.route('/hr', methods=['GET'])
def get_hrs():
    hr_role = Role.query.filter_by(name='HR').first()
    if not hr_role:
        return jsonify([])
    hrs = User.query.filter_by(role_id=hr_role.id).all()
    return jsonify([{
        'id': hr.id,
        'name': hr.name,
        'email': hr.email,
        'role': hr.role.name
    } for hr in hrs])


@hr_bp.route('/hr', methods=['POST'])
@token_required
def add_hr(current_user):
    if current_user.role.name != 'Admin':
        return jsonify({'error': 'Only Admin can add HR'}), 403

    data  = request.get_json()
    name  = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()

    if not name or not email:
        return jsonify({'error': 'Name and Email are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 400

    hr_role = Role.query.filter_by(name='HR').first()
    if not hr_role:
        return jsonify({'error': 'HR Role not found'}), 500

    # Create user with random placeholder password
    new_user = User(
        name     = name,
        email    = email,
        password = generate_password_hash(secrets.token_urlsafe(32)),
        role_id  = hr_role.id
    )

    try:
        db.session.add(new_user)
        db.session.flush()  # get new_user.id

        # Send activation email with set-password link
        from routes.forgot_password import send_set_password_email
        send_set_password_email(
            to_email = email,
            name     = name,
            role     = 'HR',
            user_id  = new_user.id
        )

        db.session.commit()
        log_activity(current_user.id, "ADD_HR", f"Created HR user: {name}")

        return jsonify({
            'message': f'HR account created. An activation email has been sent to {email}.',
            'id'     : new_user.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@hr_bp.route('/hr/<int:id>', methods=['PUT'])
@token_required
def update_hr(current_user, id):
    data = request.get_json()
    user = User.query.get(id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    if user.role.name != 'HR':
        return jsonify({'message': 'User is not an HR'}), 400

    if 'name' in data:
        user.name = data['name']
    if 'email' in data:
        if data['email'] != user.email:
            if User.query.filter_by(email=data['email']).first():
                return jsonify({'error': 'Email already exists'}), 400
        user.email = data['email']

    try:
        db.session.commit()
        return jsonify({'message': 'HR updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@hr_bp.route('/hr/<int:id>', methods=['DELETE'])
@token_required
def delete_hr(current_user, id):
    user = User.query.get(id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    if user.role.name != 'HR':
        return jsonify({'message': 'User is not an HR'}), 400
    try:
        db.session.delete(user)
        db.session.commit()
        log_activity(current_user.id, "DELETE_HR", f"Deleted HR user ID: {id}")
        return jsonify({'message': 'HR deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@hr_bp.route('/activity_logs', methods=['GET'])
@token_required
def get_activity_logs(current_user):
    if current_user.role.name != 'Admin':
        return jsonify({'message': 'Access denied'}), 403
    logs = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).all()
    output = []
    for log in logs:
        user = User.query.get(log.user_id)
        user_name = user.name if user else f"User ID {log.user_id}"
        output.append({
            'id'       : log.id,
            'user'     : user_name,
            'action'   : log.action,
            'details'  : log.details,
            'timestamp': log.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        })
    return jsonify(output)


# ─── Attendance ───────────────────────────────────────────────────────────────

@hr_bp.route('/attendance/checkin', methods=['POST'])
@token_required
def checkin(current_user):
    from datetime import datetime
    today    = datetime.utcnow().date()
    now_time = datetime.utcnow().time()
    attendance = Attendance.query.filter_by(user_id=current_user.id, date=today).first()
    if attendance:
        return jsonify({'message': 'Already checked in for today'}), 400
    new_attendance = Attendance(
        user_id=current_user.id, date=today,
        check_in_time=now_time, status='Present'
    )
    try:
        db.session.add(new_attendance)
        db.session.commit()
        log_activity(current_user.id, "CHECK_IN", f"User {current_user.name} checked in at {now_time}")
        return jsonify({'message': 'Checked in successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@hr_bp.route('/attendance/checkout', methods=['POST'])
@token_required
def checkout(current_user):
    from datetime import datetime
    today    = datetime.utcnow().date()
    now_time = datetime.utcnow().time()
    attendance = Attendance.query.filter_by(user_id=current_user.id, date=today).first()
    if not attendance:
        return jsonify({'message': 'No check-in record found for today'}), 400
    if attendance.check_out_time:
        return jsonify({'message': 'Already checked out'}), 400
    attendance.check_out_time = now_time
    try:
        db.session.commit()
        log_activity(current_user.id, "CHECK_OUT", f"User {current_user.name} checked out at {now_time}")
        return jsonify({'message': 'Checked out successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@hr_bp.route('/attendance', methods=['GET'])
@token_required
def get_attendance(current_user):
    if current_user.role.name in ['Admin', 'HR']:
        records = Attendance.query.order_by(Attendance.date.desc()).all()
    else:
        records = Attendance.query.filter_by(user_id=current_user.id).order_by(Attendance.date.desc()).all()
    output = []
    for r in records:
        user = User.query.get(r.user_id)
        output.append({
            'id'        : r.id,
            'user_id'   : r.user_id,
            'user_name' : user.name if user else 'Unknown',
            'date'      : r.date.strftime('%Y-%m-%d'),
            'status'    : r.status,
            'check_in'  : str(r.check_in_time) if r.check_in_time else None,
            'check_out' : str(r.check_out_time) if r.check_out_time else None
        })
    return jsonify(output)


# ─── Leave ────────────────────────────────────────────────────────────────────

@hr_bp.route('/leave', methods=['POST'])
@token_required
def apply_leave(current_user):
    data       = request.get_json()
    start_date = data.get('start_date')
    end_date   = data.get('end_date')
    reason     = data.get('reason')
    if not start_date or not end_date:
        return jsonify({'error': 'Start and End dates are required'}), 400
    new_leave = Leave(
        user_id=current_user.id, start_date=start_date,
        end_date=end_date, reason=reason, status='Pending'
    )
    try:
        db.session.add(new_leave)
        db.session.commit()
        log_activity(current_user.id, "APPLY_LEAVE", f"Applied leave from {start_date} to {end_date}")
        return jsonify({'message': 'Leave application submitted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@hr_bp.route('/leave', methods=['GET'])
@token_required
def get_leaves(current_user):
    if current_user.role.name in ['Admin', 'HR']:
        leaves = Leave.query.order_by(Leave.start_date.desc()).all()
    else:
        leaves = Leave.query.filter_by(user_id=current_user.id).order_by(Leave.start_date.desc()).all()
    output = []
    for l in leaves:
        user = User.query.get(l.user_id)
        output.append({
            'id'        : l.id,
            'user_id'   : l.user_id,
            'user_name' : user.name if user else 'Unknown',
            'start_date': str(l.start_date),
            'end_date'  : str(l.end_date),
            'reason'    : l.reason,
            'status'    : l.status
        })
    return jsonify(output)


@hr_bp.route('/leave/<int:id>/status', methods=['PUT'])
@token_required
def update_leave_status(current_user, id):
    if current_user.role.name not in ['Admin', 'HR']:
        return jsonify({'message': 'Unauthorized'}), 403
    data   = request.get_json()
    status = data.get('status')
    if status not in ['Approved', 'Rejected']:
        return jsonify({'error': 'Invalid status'}), 400
    leave = Leave.query.get(id)
    if not leave:
        return jsonify({'message': 'Leave request not found'}), 404
    leave.status = status
    try:
        db.session.commit()
        log_activity(current_user.id, "UPDATE_LEAVE", f"Updated leave {id} status to {status}")
        return jsonify({'message': f'Leave {status}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ─── Payroll ──────────────────────────────────────────────────────────────────

@hr_bp.route('/salary/<int:user_id>', methods=['GET'])
@token_required
def generate_payslip(current_user, user_id):
    from datetime import datetime
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    base_salary = 50000
    tax         = base_salary * 0.1
    net         = base_salary - tax
    payslip = f"""
======================================
           PAYSLIP
======================================
Employee: {user.name}
ID: {user.id}
Month: {datetime.utcnow().strftime('%B %Y')}

Base Salary: ${base_salary}
Tax (10%): -${tax}
--------------------------------------
Net Pay: ${net}
======================================
"""
    return jsonify({'message': 'Payslip generated', 'content': payslip, 'net_pay': net})