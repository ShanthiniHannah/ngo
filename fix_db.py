from app import app, db
from sqlalchemy import text

def add_column_if_not_exists(conn, table, column, col_type):
    try:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
        conn.commit()
        print(f"Added '{column}' column to {table}.")
    except Exception as e:
        print(f"Column '{column}' in {table} already exists or error: {e}")

def fix():
    with app.app_context():
        try:
            with db.engine.connect() as conn:
                add_column_if_not_exists(conn, 'activity_logs', 'details', 'TEXT')
                add_column_if_not_exists(conn, 'employees', 'user_id', 'INT')
                add_column_if_not_exists(conn, 'volunteers', 'user_id', 'INT')
                add_column_if_not_exists(conn, 'donors', 'user_id', 'INT')
                add_column_if_not_exists(conn, 'beneficiaries', 'email', 'VARCHAR(100)')
                add_column_if_not_exists(conn, 'beneficiaries', 'phone', 'VARCHAR(20)')
        except Exception as e:
            print(f"Database connection error: {e}")

if __name__ == "__main__":
    fix()
