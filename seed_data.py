"""
seed_data.py — Populates the database with initial HR and Employee records.

Usage:
    python seed_data.py

Make sure your .env file is configured and the Flask app context is available
before running this script.
"""
from dotenv import load_dotenv
load_dotenv()

from app import app
from database import db
from models import User, Employee, Role
from werkzeug.security import generate_password_hash


def seed_data():
    with app.app_context():
        # --- Seed HR Users ---
        # Password for all seeded accounts is 'password123'
        password_hash = generate_password_hash('password123')

        hr_role = Role.query.filter_by(name='HR').first()
        if not hr_role:
            print("ERROR: 'HR' role not found. Run the app once to seed roles first.")
            return

        hr_users = [
            {'name': 'Alice Admin',   'email': 'admin@company.com', 'role_id': hr_role.id, 'password': password_hash},
            {'name': 'Bob Recruiter', 'email': 'bob@company.com',   'role_id': hr_role.id, 'password': password_hash},
        ]

        print("Seeding HR users...")
        hr_map = {}  # name → User object, for linking employees below
        for data in hr_users:
            existing = User.query.filter_by(email=data['email']).first()
            if existing:
                print(f"  User '{data['name']}' already exists — skipping.")
                hr_map[data['name']] = existing
            else:
                user = User(**data)
                db.session.add(user)
                db.session.flush()  # get user.id before commit
                hr_map[data['name']] = user
                print(f"  Created user '{data['name']}'.")

        db.session.commit()

        # --- Seed Employees ---
        employees = [
            {'name': 'John Doe',     'email': 'john@example.com',  'age': 30, 'gender': 'Male',   'address': '123 Tech Park',   'sponsor': 'Tech Corp',          'hr_id': hr_map['Alice Admin'].id},
            {'name': 'Jane Smith',   'email': 'jane@example.com',  'age': 28, 'gender': 'Female', 'address': '456 Design Ave',  'sponsor': 'Creative Solutions', 'hr_id': hr_map['Bob Recruiter'].id},
            {'name': 'Mike Johnson', 'email': 'mike@example.com',  'age': 35, 'gender': 'Male',   'address': '789 Sales Blvd',  'sponsor': 'Global Sales',       'hr_id': hr_map['Alice Admin'].id},
            {'name': 'Emily Chen',   'email': 'emily@example.com', 'age': 26, 'gender': 'Female', 'address': '321 Dev Lane',    'sponsor': 'Innovate LLC',       'hr_id': hr_map['Bob Recruiter'].id},
        ]

        print("Seeding employees...")
        for data in employees:
            existing = Employee.query.filter_by(email=data['email']).first()
            if existing:
                print(f"  Employee '{data['name']}' already exists — skipping.")
            else:
                emp = Employee(**data)
                db.session.add(emp)
                print(f"  Created employee '{data['name']}'.")

        db.session.commit()
        print("Database seeded successfully!")


if __name__ == '__main__':
    seed_data()