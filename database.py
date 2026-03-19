from flask_sqlalchemy import SQLAlchemy
import os

# Initialize SQLAlchemy
db = SQLAlchemy()

def init_db(app):
    """Initializes the database with the Flask app."""
    DB_USER     = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_HOST     = os.getenv('DB_HOST', 'localhost')
    DB_NAME     = os.getenv('DB_NAME', 'hr_employee_db')

    # Ensure the database exists before SQLAlchemy connects
    import mysql.connector
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD
        )
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}`")
        cursor.close()
        conn.close()
        print(f"Database '{DB_NAME}' checked/created successfully.")
    except Exception as e:
        print(f"Error creating database: {e}")

    app.config['SQLALCHEMY_DATABASE_URI'] = (
        f'mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    with app.app_context():
        # Importing the module registers all models with SQLAlchemy automatically.
        # No need to list every model individually — new models are picked up for free.
        import models  # noqa: F401

        db.create_all()
        print("Database tables checked/created.")

        # Seed basic roles if none exist
        from models import Role
        if not Role.query.first():
            roles = ['Admin', 'HR', 'Employee', 'Donor', 'Volunteer', 'Beneficiary']
            for r_name in roles:
                db.session.add(Role(name=r_name))
            db.session.commit()
            print("Roles seeded.")