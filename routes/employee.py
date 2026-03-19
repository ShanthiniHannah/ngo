from flask import Blueprint, request, jsonify
from database import db
from models import db, Employee, User, Role
from .auth import token_required
from helpers import log_activity
from werkzeug.security import generate_password_hash
import secrets

employee_bp = Blueprint('employee', __name__)


@employee_bp.route('/employee', methods=['GET'])
def get_employees():
    employees = Employee.query.all()
    output = []
    for emp in employees:
        hr_name = 'Unassigned'
        if emp.hr_id:
            hr_user = User.query.get(emp.hr_id)
            if hr_user:
                hr_name = hr_user.name
        output.append({
            'id'     : emp.id,
            'name'   : emp.name,
            'email'  : emp.email,
            'age'    : emp.age,
            'gender' : emp.gender,
            'address': emp.address,
            'hr_id'  : emp.hr_id,
            'hr_name': hr_name,
            'sponsor': emp.sponsor
        })
    return jsonify(output)


@employee_bp.route('/employee', methods=['POST'])
@token_required
def add_employee(current_user):
    if current_user.role.name not in ['Admin', 'HR']:
        return jsonify({'error': 'Access denied'}), 403

    data  = request.get_json()
    name  = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()

    if not name:
        return jsonify({'error': 'Name is required'}), 400
    if not email:
        return jsonify({'error': 'Email is required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already connected to an account'}), 400

    employee_role = Role.query.filter_by(name='Employee').first()
    if not employee_role:
        return jsonify({'error': 'Employee role not found'}), 500

    try:
        new_user = User(
            name     = name,
            email    = email,
            password = generate_password_hash(secrets.token_urlsafe(32)),
            role_id  = employee_role.id
        )
        db.session.add(new_user)
        db.session.flush()

        new_emp = Employee(
            name    = name,
            email   = email,
            age     = data.get('age'),
            gender  = data.get('gender'),
            address = data.get('address'),
            hr_id   = data.get('hr_id'),
            sponsor = data.get('sponsor'),
            user_id = new_user.id
        )
        db.session.add(new_emp)

        # Send ONLY activation email — no other emails for admin-added employees
        from routes.forgot_password import send_set_password_email
        send_set_password_email(
            to_email = email,
            name     = name,
            role     = 'Employee',
            user_id  = new_user.id
        )

        db.session.commit()
        log_activity(current_user.id, "ADD_EMPLOYEE", f"Added Employee: {name}")

        return jsonify({
            'message': f'Employee account created. Activation email sent to {email}.',
            'id'     : new_emp.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@employee_bp.route('/employee/<int:id>', methods=['PUT'])
@token_required
def update_employee(current_user, id):
    emp = Employee.query.get(id)
    if not emp:
        return jsonify({'message': 'Employee not found'}), 404

    data = request.get_json()
    if 'name'    in data: emp.name    = data['name']
    if 'age'     in data: emp.age     = data['age']
    if 'gender'  in data: emp.gender  = data['gender']
    if 'address' in data: emp.address = data['address']
    if 'hr_id'   in data: emp.hr_id   = data['hr_id']
    if 'sponsor' in data: emp.sponsor = data['sponsor']

    try:
        db.session.commit()
        log_activity(current_user.id, "UPDATE_EMPLOYEE", f"Updated Employee: {emp.name}")
        return jsonify({'message': 'Employee updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@employee_bp.route('/employee/<int:id>', methods=['DELETE'])
@token_required
def delete_employee(current_user, id):
    emp = Employee.query.get(id)
    if not emp:
        return jsonify({'message': 'Employee not found'}), 404

    try:
        name = emp.name
        db.session.delete(emp)
        db.session.commit()
        log_activity(current_user.id, "DELETE_EMPLOYEE", f"Deleted Employee: {name}")
        return jsonify({'message': 'Employee deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400