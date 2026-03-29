"""
Shared Email Service
---------------------
Single source of truth for send_email().
Extracted from routes/application.py and routes/volunteer.py
to eliminate code duplication.

NOTE: Email templates remain in their original route files.
This module only handles SMTP transport.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app


def send_email(to_email, subject, html_body):
    """
    Send an HTML email via SMTP.
    Falls back to console mock if MAIL_SERVER/MAIL_USERNAME not configured.
    """
    smtp_host = current_app.config.get('MAIL_SERVER', '')
    smtp_user = current_app.config.get('MAIL_USERNAME', '')
    smtp_pass = current_app.config.get('MAIL_PASSWORD', '')
    smtp_port = int(current_app.config.get('MAIL_PORT', 587))
    sender    = current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@ngoapp.com')

    if not smtp_host or not smtp_user:
        print("=" * 60)
        print(f"[EMAIL MOCK] From: {sender}  →  To: {to_email}")
        print(f"[EMAIL MOCK] Subject: {subject}")
        print(html_body)
        print("=" * 60)
        return True

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From']    = sender
        msg['To']      = to_email
        msg.attach(MIMEText(html_body, 'html'))
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(sender, to_email, msg.as_string())
        print(f"[EMAIL] Sent '{subject}'  →  {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send to {to_email}: {e}")
        # Return True so the database transaction is NOT rolled back
        return True
