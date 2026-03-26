from flask import Blueprint, request, jsonify
from database import db
from models import db, Donor, User, Role
from .auth import token_required
from helpers import log_activity
from werkzeug.security import generate_password_hash
import secrets

donor_bp = Blueprint('donor', __name__)

def build_donation_receipt_email(name, amount, tx_id, date):
    return f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#10b981,#059669);padding:30px;text-align:center">
    <h1 style="color:white;margin:0">ArcMission</h1>
    <p style="color:rgba(255,255,255,.85);margin:8px 0 0">Donation Receipt</p>
  </div>
  <div style="padding:30px">
    <h2 style="color:#1e293b">Dear {name},</h2>
    <p style="color:#475569">Thank you so much for your generous donation to ArcMission. Your support helps us transform lives.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px;border-radius:8px;margin:20px 0">
      <p style="margin:5px 0;color:#334155"><strong>Amount:</strong> ₹{amount}</p>
      <p style="margin:5px 0;color:#334155"><strong>Transaction ID:</strong> {tx_id}</p>
      <p style="margin:5px 0;color:#334155"><strong>Date:</strong> {date}</p>
    </div>
    <p style="color:#475569">Your continuous support brings hope.<br><strong>ArcMission Team</strong></p>
  </div>
</div>"""

@donor_bp.route('/donor', methods=['GET'])
@token_required
def get_donors(current_user):
    if current_user.role.name not in ['Admin', 'HR']:
        return jsonify({'error': 'Unauthorized access'}), 403
        
    donors = Donor.query.all()
    return jsonify([{
        'id'             : d.id,
        'name'           : d.name,
        'email'          : d.email,
        'phone'          : d.phone,
        'address'        : d.address,
        'donation_amount': d.donation_amount,
        'transaction_id' : d.transaction_id
    } for d in donors])


@donor_bp.route('/donor', methods=['POST'])
@token_required
def add_donor(current_user):
    data  = request.get_json()
    name  = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()

    if not name or not email:
        return jsonify({'error': 'Name and Email required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already connected to an account'}), 400

    donor_role = Role.query.filter_by(name='Donor').first()
    if not donor_role:
        return jsonify({'error': 'Donor role not found'}), 500

    try:
        new_user = User(
            name     = name,
            email    = email,
            password = generate_password_hash(secrets.token_urlsafe(32)),
            role_id  = donor_role.id
        )
        db.session.add(new_user)
        db.session.flush()

        new_donor = Donor(
            name            = name,
            email           = email,
            phone           = data.get('phone'),
            address         = data.get('address'),
            donation_amount = data.get('donation_amount', 0.0),
            transaction_id  = data.get('transaction_id'),
            user_id         = new_user.id
        )
        db.session.add(new_donor)

        # Send ONLY activation email — no confirmation/interview/reject emails
        from routes.forgot_password import send_set_password_email
        send_set_password_email(
            to_email = email,
            name     = name,
            role     = 'Donor',
            user_id  = new_user.id
        )

        db.session.commit()
        log_activity(current_user.id, "ADD_DONOR",
                     f"Added Donor: {name}, Amount: {data.get('donation_amount', 0)}")

        return jsonify({
            'message': f'Donor account created. Activation email sent to {email}.',
            'id'     : new_donor.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@donor_bp.route('/donor/<int:id>', methods=['PUT'])
@token_required
def update_donor(current_user, id):
    donor = Donor.query.get(id)
    if not donor:
        return jsonify({'error': 'Donor not found'}), 404

    data = request.get_json()
    donor.name            = data.get('name',            donor.name)
    donor.email           = data.get('email',           donor.email)
    donor.phone           = data.get('phone',           donor.phone)
    donor.address         = data.get('address',         donor.address)
    donor.donation_amount = data.get('donation_amount', donor.donation_amount)
    donor.transaction_id  = data.get('transaction_id',  donor.transaction_id)
    
    try:
        db.session.commit()
        log_activity(current_user.id, "UPDATE_DONOR", f"Updated Donor: {donor.name}")
        return jsonify({'message': 'Donor updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@donor_bp.route('/donor/<int:id>', methods=['DELETE'])
@token_required
def delete_donor(current_user, id):
    donor = Donor.query.get(id)
    if not donor:
        return jsonify({'error': 'Donor not found'}), 404

    try:
        name = donor.name
        db.session.delete(donor)
        db.session.commit()
        log_activity(current_user.id, "DELETE_DONOR", f"Deleted Donor: {name}")
        return jsonify({'message': 'Donor deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@donor_bp.route('/donor/donate', methods=['POST'])
@token_required
def donate(current_user):
    if current_user.role.name != 'Donor':
        return jsonify({'error': 'Unauthorized'}), 403

    donor = Donor.query.filter_by(user_id=current_user.id).first()
    if not donor:
        return jsonify({'error': 'Donor profile not found'}), 404

    data = request.get_json()
    try:
        amount = float(data.get('amount', 0))
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid amount'}), 400
        
    if amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400

    payment_method = data.get('payment_method')
    project_id = data.get('project_id')

    from models import Sponsorship
    from datetime import datetime

    new_sponsorship = Sponsorship(
        sponsor_name = donor.name,
        amount       = amount,
        donor_id     = donor.id,
        project_id   = project_id if project_id else None
    )

    donor.donation_amount = (donor.donation_amount or 0) + amount
    donor.last_donation_date = datetime.utcnow()
    tx_id = f"TXN-{secrets.token_hex(6).upper()}"
    donor.transaction_id = tx_id
    
    try:
        db.session.add(new_sponsorship)
        db.session.commit()
        log_activity(current_user.id, "DONATION", f"Donated ₹{amount} via {payment_method}")
        
        # Send receipt email
        from services.email_service import send_email
        date_str = donor.last_donation_date.strftime('%Y-%m-%d %H:%M:%S UTC')
        html_body = build_donation_receipt_email(donor.name, amount, tx_id, date_str)
        send_email(donor.email, 'Your Donation Receipt — ArcMission', html_body)

        return jsonify({'message': 'Donation successful!', 'transaction_id': tx_id})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@donor_bp.route('/donor/certificate/<int:sponsorship_id>', methods=['GET'])
@token_required
def get_80g_certificate(current_user, sponsorship_id):
    from models import Sponsorship, Donor
    import datetime
    
    sponsorship = Sponsorship.query.get(sponsorship_id)
    if not sponsorship:
        return "Not found", 404
        
    if current_user.role.name not in ['Admin', 'HR']:
        # donor can only see their own
        donor = Donor.query.filter_by(user_id=current_user.id).first()
        if not donor or sponsorship.donor_id != donor.id:
            return "Unauthorized", 403

    cert_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>80G Tax Exemption Certificate</title>
        <style>
            body {{ font-family: 'Times New Roman', serif; margin: 0; padding: 40px; background: #fdfbf7; }}
            .certificate {{ border: 10px solid #0f172a; padding: 40px; background: white; text-align: center; position: relative; }}
            .header {{ font-size: 36px; font-weight: bold; color: #1e293b; text-transform: uppercase; margin-bottom: 10px; }}
            .sub-header {{ font-size: 18px; color: #475569; margin-bottom: 40px; }}
            .cert-title {{ font-size: 28px; color: #0f172a; text-decoration: underline; margin-bottom: 30px; font-style: italic; }}
            .content {{ font-size: 18px; line-height: 1.8; text-align: left; margin: 0 40px; }}
            .amount {{ font-size: 24px; font-weight: bold; }}
            .footer {{ margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 40px; }}
            .signature {{ border-top: 2px solid #0f172a; width: 200px; padding-top: 10px; text-align: center; font-style: italic; }}
            @media print {{ body {{ padding: 0; background: white; }} .certificate {{ border: 4px solid #0f172a; border-radius: 0; }} }}
        </style>
    </head>
    <body onload="setTimeout(() => window.print(), 500)">
        <div class="certificate">
            <div class="header">ArcMission Foundation</div>
            <div class="sub-header">Registered under Section 80G of the Income Tax Act, 1961</div>
            
            <div class="cert-title">CERTIFICATE OF DONATION</div>
            
            <div class="content">
                <p>This is to certify that we have gratefully received a donation of <span class="amount">₹{sponsorship.amount}</span> 
                from <strong>{sponsorship.sponsor_name}</strong> on <strong>{sponsorship.date.strftime('%d %B %Y')}</strong>.</p>
                
                <p>This contribution will be utilized towards our ongoing charitable initiatives and projects. 
                We deeply appreciate your generous support in helping us transform lives.</p>
                
                <p><strong>Receipt No:</strong> SPON-{sponsorship.id}-{sponsorship.date.year}<br>
                <strong>PAN:</strong> ABCDE1234F <em>(Mock PAN)</em><br>
                <strong>80G Registration No:</strong> 80G/ARCM/2026/001</p>
                
                <p style="font-size: 14px; margin-top: 30px; color: #64748b;">
                * Donations made to ArcMission Foundation are eligible for 50% tax deduction under Section 80G of the Income Tax Act.
                </p>
            </div>
            
            <div class="footer">
                <div>
                    <p style="margin: 0; font-size: 14px;">Date of Issue: {datetime.datetime.utcnow().strftime('%d %B %Y')}</p>
                </div>
                <div class="signature">
                    Authorized Signatory
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return cert_html