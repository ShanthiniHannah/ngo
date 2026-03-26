from models import db, ActivityLog
from datetime import datetime


def log_activity(user_id, action, details):
    """
    Logs a user action to the activity_logs table including IP address.
    Rolls back the session on failure to avoid leaving it in a broken state.
    """
    from flask import request
    ip_address = None
    try:
        if request:
            ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
            if ip_address:
                ip_address = ip_address.split(',')[0].strip()
    except Exception:
        pass

    try:
        log = ActivityLog(
            user_id=user_id,
            action=action,
            details=details,
            ip_address=ip_address,
            timestamp=datetime.utcnow()
        )
        db.session.add(log)
        db.session.commit()
        print(f"[LOG] User {user_id} performed '{action}': {details}")
    except Exception as e:
        db.session.rollback()  # FIX: prevent broken session state from cascading
        print(f"[ERROR] Failed to log activity: {e}")


def send_sms(phone_number, message):
    """
    Sends an SMS notification via Fast2SMS (or any configured gateway).
    Falls back to a console mock in development if no API key is set.
    """
    if not phone_number:
        return

    import os
    api_key = os.environ.get('FAST2SMS_API_KEY', '')

    if api_key:
        # Production: send via Fast2SMS
        try:
            import requests
            response = requests.post(
                'https://www.fast2sms.com/dev/bulkV2',
                headers={'authorization': api_key},
                json={
                    'route': 'q',
                    'message': message,
                    'language': 'english',
                    'flash': 0,
                    'numbers': phone_number,
                }
            )
            result = response.json()
            if result.get('return'):
                print(f"[SMS] Sent to {phone_number}")
            else:
                print(f"[SMS ERROR] Fast2SMS response: {result}")
        except Exception as e:
            print(f"[SMS ERROR] Failed to send SMS: {e}")
    else:
        # Development: mock console output
        print("=" * 40)
        print(f"[SMS MOCK] To: {phone_number}")
        print(f"Message: {message}")
        print("=" * 40)