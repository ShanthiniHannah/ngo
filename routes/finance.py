from flask import Blueprint, request, jsonify, send_file
from database import db
from models import Sponsorship, Donor, Project
from .auth import token_required
from helpers import log_activity
import io

finance_bp = Blueprint('finance', __name__)

@finance_bp.route('/sponsorships', methods=['GET'])
def get_sponsorships():
    sponsorships = Sponsorship.query.all()
    output = []
    for s in sponsorships:
        donor_name = Donor.query.get(s.donor_id).name if s.donor_id else "Anonymous"
        project_name = Project.query.get(s.project_id).name if s.project_id else "General Fund"
        
        output.append({
            'id': s.id,
            'sponsor_name': s.sponsor_name,
            'amount': s.amount,
            'date': s.date.strftime('%Y-%m-%d'),
            'donor_name': donor_name,
            'project_name': project_name
        })
    return jsonify(output)

@finance_bp.route('/sponsorships', methods=['POST'])
@token_required
def add_sponsorship(current_user):
    data = request.get_json()
    sponsor_name = data.get('sponsor_name')
    amount = data.get('amount')
    
    if not sponsor_name or not amount:
        return jsonify({'error': 'Name and Amount are required'}), 400
        
    new_sponsorship = Sponsorship(
        sponsor_name=sponsor_name,
        amount=amount,
        donor_id=data.get('donor_id'),
        project_id=data.get('project_id')
    )
    
    try:
        db.session.add(new_sponsorship)
        db.session.commit()
        log_activity(current_user.id, "ADD_SPONSORSHIP", f"Recorded sponsorship of {amount} from {sponsor_name}")
        return jsonify({'message': 'Sponsorship recorded', 'id': new_sponsorship.id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@finance_bp.route('/receipt/<int:id>', methods=['GET'])
def generate_receipt(id):
    sponsorship = Sponsorship.query.get(id)
    if not sponsorship:
        return jsonify({'message': 'Sponsorship not found'}), 404
        
    # Mock PDF Generation - In real app use ReportLab or WeasyPrint
    # For now, we return a simple text file acting as a receipt
    
    receipt_content = f"""
    ======================================
              OFFICIAL RECEIPT
    ======================================
    Receipt ID: {sponsorship.id}
    Date: {sponsorship.date.strftime('%Y-%m-%d')}
    
    Received from: {sponsorship.sponsor_name}
    Amount: ${sponsorship.amount}
    
    Thank you for your generous support!
    ======================================
    ArcMission
    """
    
    return jsonify({
        'message': 'Receipt generated',
        'content': receipt_content,
        'download_link': f'/download/receipt/{id}' # Placeholder for real file download
    })
