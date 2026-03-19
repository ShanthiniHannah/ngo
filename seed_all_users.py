"""
seed_all_users.py
-----------------
Creates unique login accounts for all roles.
Temporary password for ALL accounts: Ngo@1234
Each user should change this via Forgot Password after first login.

Run once:
    python seed_all_users.py

Roles seeded:
  Admin, HR, Employee, Volunteer, Donor, Beneficiary
"""
from database import db
from models import User, Role, Employee, Volunteer, Donor, Beneficiary
from werkzeug.security import generate_password_hash

USERS = [
    # ── ADMIN ─────────────────────────────────────────────────────
    {
        'role': 'Admin',
        'name': 'Shanthini Hannah',
        'email': 'shanthini@ngo.com',
        'employee': None, 'volunteer': None, 'donor': None, 'beneficiary': None
    },

    # ── HR ────────────────────────────────────────────────────────
    {
        'role': 'HR',
        'name': 'Priya Ramesh',
        'email': 'priya.hr@ngo.com',
        'employee': None, 'volunteer': None, 'donor': None, 'beneficiary': None
    },
    {
        'role': 'HR',
        'name': 'Arjun Kumar',
        'email': 'arjun.hr@ngo.com',
        'employee': None, 'volunteer': None, 'donor': None, 'beneficiary': None
    },

    # ── EMPLOYEES ────────────────────────────────────────────────
    {
        'role': 'Employee',
        'name': 'Karthik Rajan',
        'email': 'karthik@ngo.com',
        'employee': {'age': 29, 'gender': 'Male',   'address': '12 Anna Salai, Chennai',   'sponsor': 'Tech NGO'},
        'volunteer': None, 'donor': None, 'beneficiary': None
    },
    {
        'role': 'Employee',
        'name': 'Deepa Sundar',
        'email': 'deepa@ngo.com',
        'employee': {'age': 26, 'gender': 'Female', 'address': '45 OMR, Chennai',           'sponsor': 'Care Trust'},
        'volunteer': None, 'donor': None, 'beneficiary': None
    },
    {
        'role': 'Employee',
        'name': 'Vignesh Mohan',
        'email': 'vignesh@ngo.com',
        'employee': {'age': 31, 'gender': 'Male',   'address': '78 T Nagar, Chennai',       'sponsor': 'Hope Fund'},
        'volunteer': None, 'donor': None, 'beneficiary': None
    },
    {
        'role': 'Employee',
        'name': 'Meera Nair',
        'email': 'meera@ngo.com',
        'employee': {'age': 27, 'gender': 'Female', 'address': '22 Adyar, Chennai',         'sponsor': 'Bright NGO'},
        'volunteer': None, 'donor': None, 'beneficiary': None
    },

    # ── VOLUNTEERS ───────────────────────────────────────────────
    {
        'role': 'Volunteer',
        'name': 'Ravi Shankar',
        'email': 'ravi@ngo.com',
        'volunteer': {'phone': '9876501234', 'skills': 'Teaching, Mentoring',    'availability': 'Weekends'},
        'employee': None, 'donor': None, 'beneficiary': None
    },
    {
        'role': 'Volunteer',
        'name': 'Ananya Krishnan',
        'email': 'ananya@ngo.com',
        'volunteer': {'phone': '9876502345', 'skills': 'Medical, First Aid',     'availability': 'Weekdays'},
        'employee': None, 'donor': None, 'beneficiary': None
    },
    {
        'role': 'Volunteer',
        'name': 'Suresh Babu',
        'email': 'suresh@ngo.com',
        'volunteer': {'phone': '9876503456', 'skills': 'Cooking, Food Service',  'availability': 'Evenings'},
        'employee': None, 'donor': None, 'beneficiary': None
    },
    {
        'role': 'Volunteer',
        'name': 'Kavitha Selvan',
        'email': 'kavitha@ngo.com',
        'volunteer': {'phone': '9876504567', 'skills': 'Counseling, Education',  'availability': 'Weekends'},
        'employee': None, 'donor': None, 'beneficiary': None
    },
    {
        'role': 'Volunteer',
        'name': 'Manoj Pillai',
        'email': 'manoj@ngo.com',
        'volunteer': {'phone': '9876505678', 'skills': 'Driving, Logistics',     'availability': 'Flexible'},
        'employee': None, 'donor': None, 'beneficiary': None
    },

    # ── DONORS ──────────────────────────────────────────────────
    {
        'role': 'Donor',
        'name': 'Lakshmi Venkat',
        'email': 'lakshmi.donor@ngo.com',
        'donor': {'phone': '9900001111', 'address': '5 Boat Club Rd, Chennai', 'donation_amount': 25000.0},
        'employee': None, 'volunteer': None, 'beneficiary': None
    },
    {
        'role': 'Donor',
        'name': 'Ramesh Iyer',
        'email': 'ramesh.donor@ngo.com',
        'donor': {'phone': '9900002222', 'address': '18 MRC Nagar, Chennai',  'donation_amount': 50000.0},
        'employee': None, 'volunteer': None, 'beneficiary': None
    },
    {
        'role': 'Donor',
        'name': 'Sunita Mehta',
        'email': 'sunita.donor@ngo.com',
        'donor': {'phone': '9900003333', 'address': '30 ECR, Chennai',        'donation_amount': 15000.0},
        'employee': None, 'volunteer': None, 'beneficiary': None
    },

    # ── BENEFICIARIES ────────────────────────────────────────────
    {
        'role': 'Beneficiary',
        'name': 'Murugan S',
        'email': 'murugan.ben@ngo.com',
        'beneficiary': {'age': 45, 'gender': 'Male',   'needs': 'Food, Medical Support', 'status': 'Approved'},
        'employee': None, 'volunteer': None, 'donor': None
    },
    {
        'role': 'Beneficiary',
        'name': 'Selvi R',
        'email': 'selvi.ben@ngo.com',
        'beneficiary': {'age': 38, 'gender': 'Female', 'needs': 'Shelter, Education for children', 'status': 'Approved'},
        'employee': None, 'volunteer': None, 'donor': None
    },
    {
        'role': 'Beneficiary',
        'name': 'Gopal T',
        'email': 'gopal.ben@ngo.com',
        'beneficiary': {'age': 60, 'gender': 'Male',   'needs': 'Medical, Elderly Care',  'status': 'Pending'},
        'employee': None, 'volunteer': None, 'donor': None
    },
    {
        'role': 'Beneficiary',
        'name': 'Preethi M',
        'email': 'preethi.ben@ngo.com',
        'beneficiary': {'age': 22, 'gender': 'Female', 'needs': 'Education, Counseling',  'status': 'Pending'},
        'employee': None, 'volunteer': None, 'donor': None
    },
]


def seed(app_instance=None):
    if app_instance:
        ctx = app_instance.app_context()
    else:
        # For standalone script
        from app import app as standalone_app
        ctx = standalone_app.app_context()

    with ctx:
        role_map = {}
        for r in ['Admin', 'HR', 'Employee', 'Volunteer', 'Donor', 'Beneficiary']:
            role = Role.query.filter_by(name=r).first()
            if not role:
                role = Role(name=r, description=f'{r} role')
                db.session.add(role)
                db.session.flush()
            role_map[r] = role
        db.session.commit()
        for r in ['Admin', 'HR', 'Employee', 'Volunteer', 'Donor', 'Beneficiary']:
            role_map[r] = Role.query.filter_by(name=r).first()

        TEMP_PASSWORD = 'Ngo@1234'
        created = 0
        skipped = 0

        for u in USERS:
            email = u['email']

            if User.query.filter_by(email=email).first():
                print(f"  [SKIP] {u['role']}: {email} — already exists")
                skipped += 1
                continue

            user = User(
                name     = u['name'],
                email    = email,
                password = generate_password_hash(TEMP_PASSWORD),
                role_id  = role_map[u['role']].id
            )
            db.session.add(user)
            db.session.flush()

            # Create linked profile record
            if u['employee']:
                db.session.add(Employee(
                    user_id = user.id,
                    name    = u['name'],
                    email   = email,
                    **u['employee']
                ))
            if u['volunteer']:
                db.session.add(Volunteer(
                    user_id = user.id,
                    name    = u['name'],
                    email   = email,
                    **u['volunteer']
                ))
            if u['donor']:
                db.session.add(Donor(
                    user_id = user.id,
                    name    = u['name'],
                    email   = email,
                    **u['donor']
                ))
            if u['beneficiary']:
                db.session.add(Beneficiary(
                    name  = u['name'],
                    email = email,
                    **u['beneficiary']
                ))

            print(f"  [OK] {u['role']:12} {email}")
            created += 1

        db.session.commit()

        print()
        print("=" * 55)
        print("  SEED COMPLETE")
        print("=" * 55)
        print(f"  Created : {created}  |  Skipped : {skipped}")
        print()
        print("  Temporary password for ALL accounts: Ngo@1234")
        print("  Users should use Forgot Password to set their own.")
        print("=" * 55)


if __name__ == '__main__':
    seed()
