"""
clear_demo_data.py
------------------
Removes all demo/seed accounts and their linked records from the database.
Safe to run multiple times — skips if records don't exist.

Demo accounts removed:
  admin@ngo.com, hr@ngo.com, emp@ngo.com,
  vol@ngo.com, donor@ngo.com, ben@ngo.com
  admin@company.com, bob@company.com
  john@example.com, jane@example.com, mike@example.com, emily@example.com
"""
from dotenv import load_dotenv
load_dotenv()

from app import app
from database import db
from models import User, Employee, Volunteer, Donor, Beneficiary

DEMO_EMAILS = [
    'admin@ngo.com',
    'hr@ngo.com',
    'emp@ngo.com',
    'vol@ngo.com',
    'donor@ngo.com',
    'ben@ngo.com',
    'admin@company.com',
    'bob@company.com',
]

DEMO_EMPLOYEE_EMAILS = [
    'emp@ngo.com',
    'john@example.com',
    'jane@example.com',
    'mike@example.com',
    'emily@example.com',
]

DEMO_VOLUNTEER_EMAILS = ['vol@ngo.com']
DEMO_DONOR_EMAILS     = ['donor@ngo.com']
DEMO_BENEFICIARY_NAMES = ['Ben Eficiary']

def clear():
    with app.app_context():
        deleted = 0

        # --- Employees ---
        for email in DEMO_EMPLOYEE_EMAILS:
            emp = Employee.query.filter_by(email=email).first()
            if emp:
                db.session.delete(emp)
                print(f"  Deleted employee: {email}")
                deleted += 1

        # --- Volunteers ---
        for email in DEMO_VOLUNTEER_EMAILS:
            vol = Volunteer.query.filter_by(email=email).first()
            if vol:
                db.session.delete(vol)
                print(f"  Deleted volunteer: {email}")
                deleted += 1

        # --- Donors ---
        for email in DEMO_DONOR_EMAILS:
            don = Donor.query.filter_by(email=email).first()
            if don:
                db.session.delete(don)
                print(f"  Deleted donor: {email}")
                deleted += 1

        # --- Beneficiaries ---
        for name in DEMO_BENEFICIARY_NAMES:
            ben = Beneficiary.query.filter_by(name=name).first()
            if ben:
                db.session.delete(ben)
                print(f"  Deleted beneficiary: {name}")
                deleted += 1

        db.session.commit()

        # --- Users (after linked records are removed) ---
        for email in DEMO_EMAILS:
            user = User.query.filter_by(email=email).first()
            if user:
                db.session.delete(user)
                print(f"  Deleted user account: {email}")
                deleted += 1

        db.session.commit()

        if deleted == 0:
            print("No demo data found — database is already clean.")
        else:
            print(f"\nDone! Removed {deleted} demo record(s).")

            print("Your database now contains only real data.")

if __name__ == '__main__':
    print("Clearing demo data...")
    clear()
