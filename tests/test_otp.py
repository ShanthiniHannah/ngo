"""
tests/test_otp.py -- Unit tests for the OTP verification module.

Strategy: patch 'database.init_db' so the app never connects to MySQL;
we manually configure SQLite in-memory and call db.init_app(app) ourselves.

Run: python -m pytest tests/test_otp.py -v
"""
import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import unittest
import json
import hashlib
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

# ----- Patch init_db BEFORE importing app so no MySQL connection is made -----
_SQLITE_URI = 'sqlite:///:memory:'

def _fake_init_db(flask_app):
    """Replace MySQL init_db with a SQLite in-memory setup."""
    from database import db
    flask_app.config['SQLALCHEMY_DATABASE_URI'] = _SQLITE_URI
    flask_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(flask_app)

with patch('database.init_db', side_effect=_fake_init_db):
    from app import app        # app.py calls init_db(app) — our fake runs instead
    from database import db
    from models import Role, User, OtpVerification


def _hash(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


class TestOtpRoutes(unittest.TestCase):

    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = _SQLITE_URI
        app.config['TWILIO_SID']   = 'ACtest'
        app.config['TWILIO_TOKEN'] = 'testtoken'
        app.config['TWILIO_FROM']  = '+15005550006'
        self.client = app.test_client()
        with app.app_context():
            db.drop_all()
            db.create_all()
            for name in ['Admin', 'HR', 'Employee', 'Donor', 'Volunteer', 'Beneficiary']:
                db.session.add(Role(name=name))
            db.session.commit()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    # ── Internal helper ───────────────────────────────────────────────────────

    def _insert_otp(self, phone, otp_val, minutes_offset=5, attempts=0, seconds_ago=0):
        with app.app_context():
            rec = OtpVerification(
                phone_number=phone,
                otp_hash=_hash(otp_val),
                expiry_time=datetime.utcnow() + timedelta(minutes=minutes_offset),
                attempts=attempts,
            )
            if seconds_ago:
                rec.created_at = datetime.utcnow() - timedelta(seconds=seconds_ago)
            db.session.add(rec)
            db.session.commit()

    # ── /otp/send ─────────────────────────────────────────────────────────────

    @patch('routes.otp._send_sms_fast2sms')
    def test_send_otp_success(self, mock_sms):
        """Valid phone -> 200, OTP record in DB, not yet verified."""
        mock_sms.return_value = None
        res = self.client.post('/otp/send', json={'phone_number': '9876543210'})
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn('expires_in', data)
        with app.app_context():
            rec = OtpVerification.query.filter_by(phone_number='9876543210').first()
            self.assertIsNotNone(rec)
            self.assertFalse(rec.verified)
            self.assertEqual(rec.attempts, 0)

    def test_send_otp_missing_phone(self):
        """Missing phone -> 400."""
        res = self.client.post('/otp/send', json={})
        self.assertEqual(res.status_code, 400)

    # ── /otp/verify ───────────────────────────────────────────────────────────

    def test_verify_otp_correct(self):
        """Correct OTP -> 200, verified=True."""
        self._insert_otp('9876543210', '482915')
        res = self.client.post('/otp/verify', json={
            'phone_number': '9876543210',
            'otp': '482915'
        })
        self.assertEqual(res.status_code, 200)
        self.assertTrue(json.loads(res.data).get('verified'))

    def test_verify_otp_wrong(self):
        """Wrong OTP -> 400, attempts incremented."""
        self._insert_otp('9876543210', '999999')
        res = self.client.post('/otp/verify', json={
            'phone_number': '9876543210',
            'otp': '000000'
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn('Incorrect OTP', json.loads(res.data).get('error', ''))
        with app.app_context():
            rec = OtpVerification.query.filter_by(phone_number='9876543210').first()
            self.assertEqual(rec.attempts, 1)

    def test_verify_otp_max_attempts(self):
        """3 failed previous attempts -> 429."""
        self._insert_otp('9876543210', '999999', attempts=3)
        res = self.client.post('/otp/verify', json={
            'phone_number': '9876543210',
            'otp': '000000'
        })
        self.assertEqual(res.status_code, 429)

    def test_verify_otp_expired(self):
        """Expired OTP -> 400."""
        self._insert_otp('9876543210', '482915', minutes_offset=-1)
        res = self.client.post('/otp/verify', json={
            'phone_number': '9876543210',
            'otp': '482915'
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn('expired', json.loads(res.data).get('error', '').lower())

    def test_verify_otp_no_record(self):
        """No record for phone -> 400."""
        res = self.client.post('/otp/verify', json={
            'phone_number': '0000000000',
            'otp': '123456'
        })
        self.assertEqual(res.status_code, 400)

    # ── /otp/resend ───────────────────────────────────────────────────────────

    @patch('routes.otp._send_sms_fast2sms')
    def test_resend_otp_success(self, mock_sms):
        """Resend after cooldown -> 200, fresh OTP created."""
        mock_sms.return_value = None
        self._insert_otp('9876543210', '111111', seconds_ago=35)   # past 30-sec cooldown
        res = self.client.post('/otp/resend', json={'phone_number': '9876543210'})
        self.assertEqual(res.status_code, 200)
        self.assertIn('expires_in', json.loads(res.data))

    def test_resend_otp_cooldown(self):
        """Resend within 30-sec cooldown -> 429."""
        self._insert_otp('9876543210', '222222')   # created just now
        res = self.client.post('/otp/resend', json={'phone_number': '9876543210'})
        self.assertEqual(res.status_code, 429)


if __name__ == '__main__':
    unittest.main()
