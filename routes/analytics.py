from flask import Blueprint, request, jsonify
from database import db
from models import SpiritualGrowth, User, ActivityLog, BibleVerse
from .auth import token_required
from helpers import log_activity
from sqlalchemy import func
import requests
import datetime

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/analytics/spiritual', methods=['GET'])
@token_required
def get_spiritual_growth(current_user):
    # Admin/HR sees all, others see own
    if current_user.role.name in ['Admin', 'HR']:
        records = SpiritualGrowth.query.all()
    else:
        records = SpiritualGrowth.query.filter_by(user_id=current_user.id).all()
        
    output = []
    for r in records:
        user = User.query.get(r.user_id)
        output.append({
            'id': r.id,
            'user_name': user.name if user else 'Unknown',
            'date': str(r.date),
            'activity_type': r.activity_type,
            'duration': r.duration,
            'notes': r.notes
        })
    return jsonify(output)

@analytics_bp.route('/analytics/spiritual', methods=['POST'])
@token_required
def log_spiritual_activity(current_user):
    data = request.get_json()
    activity_type = data.get('activity_type')
    duration = data.get('duration') # minutes
    
    if not activity_type:
        return jsonify({'error': 'Activity type is required'}), 400
        
    new_record = SpiritualGrowth(
        user_id=current_user.id,
        activity_type=activity_type,
        duration=duration,
        notes=data.get('notes'),
        date=data.get('date') # Optional, defaults to today
    )
    
    try:
        db.session.add(new_record)
        db.session.commit()
        return jsonify({'message': 'Spiritual activity logged'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@analytics_bp.route('/analytics/performance', methods=['GET'])
@token_required
def get_performance_stats(current_user):
    # Simple analytics based on activity logs
    
    # Count of activities per user
    user_activity_counts = db.session.query(
        ActivityLog.user_id, func.count(ActivityLog.id)
    ).group_by(ActivityLog.user_id).all()
    
    activity_data = []
    for user_id, count in user_activity_counts:
        user = User.query.get(user_id)
        if user:
            activity_data.append({
                'name': user.name,
                'activity_count': count
            })
            
    # Spiritual growth total hours per user
    spiritual_data = []
    spiritual_counts = db.session.query(
        SpiritualGrowth.user_id, func.sum(SpiritualGrowth.duration)
    ).group_by(SpiritualGrowth.user_id).all()
    
    for user_id, total_minutes in spiritual_counts:
        user = User.query.get(user_id)
        if user:
            spiritual_data.append({
                'name': user.name,
                'total_hours': round((total_minutes or 0) / 60, 2)
            })
            
    return jsonify({
        'activity_stats': activity_data,
        'spiritual_stats': spiritual_data
    })


@analytics_bp.route('/analytics/dashboard-charts', methods=['GET'])
@token_required
def get_dashboard_charts(current_user):
    from models import Donor, Beneficiary, Volunteer, Sponsorship
    from sqlalchemy.sql import extract
    import datetime

    current_year = datetime.datetime.utcnow().year
    
    # 1. Donation Trends
    sponsorships = db.session.query(
        extract('month', Sponsorship.date).label('month'),
        func.sum(Sponsorship.amount).label('total')
    ).filter(extract('year', Sponsorship.date) == current_year).group_by('month').all()
    
    donation_trends = {str(int(month)): float(total) for month, total in sponsorships}

    # 2. Beneficiary Breakdown
    ben_status = db.session.query(
        Beneficiary.status, func.count(Beneficiary.id)
    ).group_by(Beneficiary.status).all()
    
    beneficiary_breakdown = {status: count for status, count in ben_status}

    # 3. Volunteer Trends (created_at is not currently in Volunteer model, so let's fallback to total count or mock it)
    # Wait, Volunteer has no created_at field directly on the profile model, it relies on User.
    # We can just join User if we want actual dates.
    vols = db.session.query(
        extract('month', User.created_at).label('month'),
        func.count(Volunteer.id).label('count')
    ).join(User, Volunteer.user_id == User.id).filter(extract('year', User.created_at) == current_year).group_by('month').all()

    volunteer_trends = {str(int(month)): count for month, count in vols}

    return jsonify({
        'donation_trends': donation_trends,
        'beneficiary_breakdown': beneficiary_breakdown,
        'volunteer_trends': volunteer_trends,
        'year': current_year
    })

@analytics_bp.route('/bible-verse/daily', methods=['GET'])
def get_daily_bible_verse():
    """
    Returns a Bible verse. 
    Priority: Online API (ourmanna.com)
    Fallback: Local MySQL database (seeding/rotation)
    """
    # 1. Try Online API first
    try:
        response = requests.get("https://beta.ourmanna.com/api/v1/get?format=json&order=daily", timeout=3)
        if response.status_code == 200:
            data = response.json()
            # API format: {"verse": {"details": {"text": "...", "reference": "...", "version": "..."}}}
            v = data.get('verse', {}).get('details', {})
            if v.get('text') and v.get('reference'):
                return jsonify({
                    'text': v['text'].strip(),
                    'reference': v['reference']
                })
    except Exception as e:
        print(f"Online Bible API failed, falling back to database: {e}")

    # 2. Local Fallback (MySQL)
    try:
        verses = BibleVerse.query.all()
        if not verses:
            return jsonify({
                'text': "Your word is a lamp to my feet and a light to my path.",
                'reference': "Psalm 119:105"
            })
            
        now = datetime.datetime.utcnow()
        start = datetime.datetime(now.year, 1, 1)
        day_of_year = (now - start).days
        
        verse = verses[day_of_year % len(verses)]
        return jsonify(verse.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500
