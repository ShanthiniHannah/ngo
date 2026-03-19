from flask_sqlalchemy import SQLAlchemy
import os

db = SQLAlchemy()


def init_db(app):
    """
    Initializes the database.
    - If DATABASE_URL starts with 'sqlite', uses SQLite (no extra driver needed).
    - If DATABASE_URL starts with 'mysql', uses MySQL via mysql-connector.
    - Falls back to SQLite if no DATABASE_URL is set.
    """
    database_url = os.getenv('DATABASE_URL', '')

    if database_url.startswith('sqlite'):
        # ── SQLite mode (Ensure path is ABSOLUTE for Render/PythonAnywhere consistency) ─
        if ':///' not in database_url:
            # Convert sqlite://ngo.db to sqlite:////abs/path/to/ngo.db
            db_file = database_url.split('sqlite://')[-1]
            abs_path = os.path.abspath(db_file)
            database_url = f"sqlite:///{abs_path}"
        
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
        print(f"DEBUG: Using SQLite absolute path: {database_url}")

    elif database_url.startswith('mysql'):
        # ── MySQL mode (for local WAMP / Railway) ─────────────────────────────
        DB_USER     = os.getenv('DB_USER', 'root')
        DB_PASSWORD = os.getenv('DB_PASSWORD', '')
        DB_HOST     = os.getenv('DB_HOST', 'localhost')
        DB_NAME     = os.getenv('DB_NAME', 'hr_employee_db')

        try:
            import mysql.connector
            conn   = mysql.connector.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD)
            cursor = conn.cursor()
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}`")
            cursor.close()
            conn.close()
            print(f"Database '{DB_NAME}' checked/created successfully.")
        except Exception as e:
            print(f"MySQL setup warning: {e}")

        app.config['SQLALCHEMY_DATABASE_URI'] = (
            f'mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}'
        )

    else:
        # ── Default fallback: SQLite in instance folder ───────────────────────
        basedir = os.path.abspath(os.path.dirname(__file__))
        sqlite_path = os.path.join(basedir, 'ngo.db')
        app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{sqlite_path}'
        print(f"No DATABASE_URL set — using SQLite fallback: {sqlite_path}")

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)

    with app.app_context():
        import models  # noqa: F401  registers all models
        db.create_all()
        print("Database tables checked/created.")

        # Seed basic roles if none exist
        from models import Role
        if not Role.query.first():
            for r_name in ['Admin', 'HR', 'Employee', 'Donor', 'Volunteer', 'Beneficiary']:
                db.session.add(Role(name=r_name))
            db.session.commit()
            print("Roles seeded.")