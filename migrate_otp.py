"""
migrate_otp.py -- Create the otp_verifications table
Run once: python migrate_otp.py
"""
import sys, os
sys.path.append(os.path.dirname(__file__))

from app import app
from database import db
from models import OtpVerification   # ensure model is imported so SQLAlchemy sees it

with app.app_context():
    db.create_all()
    print("[OK] otp_verifications table created (or already exists).")
