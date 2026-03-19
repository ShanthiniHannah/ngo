from app import app
from database import db
from models import User, Role, Volunteer, Donor, Beneficiary, Employee
from werkzeug.security import generate_password_hash

def seed():
    with app.app_context():
        # Ensure all 6 roles exist
        roles = ['Admin', 'HR', 'Employee', 'Donor', 'Volunteer', 'Beneficiary']
        role_objects = {}
        for r_name in roles:
            role = Role.query.filter_by(name=r_name).first()
            if not role:
                role = Role(name=r_name, description=f'{r_name} role')
                db.session.add(role)
                print(f"Created role: {r_name}")
            role_objects[r_name] = role
        db.session.commit()

        # Re-fetch after commit
        for r_name in roles:
            role_objects[r_name] = Role.query.filter_by(name=r_name).first()

        # -- MASTER / ADMIN --
        if not User.query.filter_by(email='admin@ngo.com').first():
            db.session.add(User(
                name='Master Admin',
                email='admin@ngo.com',
                password=generate_password_hash('admin123'),
                role_id=role_objects['Admin'].id
            ))
            print("OK: Master Admin  -> admin@ngo.com / admin123")

        # -- HR --
        if not User.query.filter_by(email='hr@ngo.com').first():
            db.session.add(User(
                name='HR Manager',
                email='hr@ngo.com',
                password=generate_password_hash('hr123'),
                role_id=role_objects['HR'].id
            ))
            print("OK: HR Manager    -> hr@ngo.com / hr123")

        # -- EMPLOYEE --
        if not User.query.filter_by(email='emp@ngo.com').first():
            emp_user = User(
                name='John Employee',
                email='emp@ngo.com',
                password=generate_password_hash('emp123'),
                role_id=role_objects['Employee'].id
            )
            db.session.add(emp_user)
            db.session.flush()
            if not Employee.query.filter_by(email='emp@ngo.com').first():
                db.session.add(Employee(
                    name='John Employee',
                    email='emp@ngo.com',
                    age=28,
                    gender='Male',
                    address='123 Main St'
                ))
            print("OK: Employee      -> emp@ngo.com / emp123")

        # -- VOLUNTEER --
        if not User.query.filter_by(email='vol@ngo.com').first():
            vol_user = User(
                name='Sara Volunteer',
                email='vol@ngo.com',
                password=generate_password_hash('vol123'),
                role_id=role_objects['Volunteer'].id
            )
            db.session.add(vol_user)
            db.session.flush()
            if not Volunteer.query.filter_by(email='vol@ngo.com').first():
                db.session.add(Volunteer(
                    name='Sara Volunteer',
                    email='vol@ngo.com',
                    phone='9876543210',
                    skills='Teaching, Cooking',
                    availability='Weekends'
                ))
            print("OK: Volunteer     -> vol@ngo.com / vol123")

        # -- DONOR --
        if not User.query.filter_by(email='donor@ngo.com').first():
            don_user = User(
                name='Rich Donor',
                email='donor@ngo.com',
                password=generate_password_hash('donor123'),
                role_id=role_objects['Donor'].id
            )
            db.session.add(don_user)
            db.session.flush()
            if not Donor.query.filter_by(email='donor@ngo.com').first():
                db.session.add(Donor(
                    name='Rich Donor',
                    email='donor@ngo.com',
                    phone='9000000001',
                    donation_amount=50000.0
                ))
            print("OK: Donor         -> donor@ngo.com / donor123")

        # -- BENEFICIARY --
        if not User.query.filter_by(email='ben@ngo.com').first():
            ben_user = User(
                name='Ben Eficiary',
                email='ben@ngo.com',
                password=generate_password_hash('ben123'),
                role_id=role_objects['Beneficiary'].id
            )
            db.session.add(ben_user)
            db.session.flush()
            if not Beneficiary.query.filter_by(name='Ben Eficiary').first():
                db.session.add(Beneficiary(
                    name='Ben Eficiary',
                    age=25,
                    gender='Male',
                    needs='Food, Shelter',
                    status='Pending'
                ))
            print("OK: Beneficiary   -> ben@ngo.com / ben123")

        db.session.commit()
        print("")
        print("=== All users seeded successfully ===")
        print("Login Credentials:")
        print("  Master Admin  -> admin@ngo.com   / admin123")
        print("  HR            -> hr@ngo.com      / hr123")
        print("  Employee      -> emp@ngo.com     / emp123")
        print("  Volunteer     -> vol@ngo.com     / vol123")
        print("  Donor         -> donor@ngo.com   / donor123")
        print("  Beneficiary   -> ben@ngo.com     / ben123")

if __name__ == '__main__':
    seed()
