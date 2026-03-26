---
description: ArcMission — Full Professional Overhaul & ML Suggestion Workflow
---

# ArcMission — Professional Overhaul

This skill defines the complete setup for transforming the ArcMission into a professional-grade application with suggestion-based ML allocation, proper icons, refined UI, and clean architecture.

## Prerequisites

- Python 3.9+ with Flask
- Node.js (for npm if needed)
- SQLite or MySQL database
- `.env` with email/SMS credentials configured

## Architecture Overview

```
project-root/
├── app.py                  # Flask app entry (DO NOT MODIFY config/email sections)
├── database.py             # DB init (DO NOT MODIFY)
├── models.py               # SQLAlchemy models (ADD AllocationSuggestion)
├── helpers.py              # Activity logging, SMS
├── requirements.txt        # Python deps
├── .env                    # Secrets (DO NOT MODIFY)
│
├── routes/                 # Flask Blueprints
│   ├── __init__.py
│   ├── auth.py             # JWT login, token_required decorator
│   ├── hr.py               # HR CRUD, attendance, leave, payroll
│   ├── employee.py         # Employee CRUD
│   ├── donor.py            # Donor CRUD
│   ├── volunteer.py        # Volunteer + Beneficiary CRUD + review
│   ├── project.py          # Projects + Deliverables
│   ├── finance.py          # Sponsorships, receipts
│   ├── analytics.py        # Spiritual growth, performance stats
│   ├── application.py      # Volunteer/Donor/Beneficiary application forms
│   ├── ai_allocation.py    # ML suggestion endpoints (MODIFY)
│   ├── forgot_password.py  # Password reset/set (email imports change only)
│   └── otp.py              # OTP verification (DO NOT MODIFY)
│
├── services/
│   ├── __init__.py         # (NEW)
│   ├── email_service.py    # (NEW) Shared send_email extracted from routes
│   └── ml_allocation_service.py  # (MODIFY) suggestion-based, not auto-assign
│
├── ml_model/
│   ├── dataset.csv
│   ├── generate_dataset.py
│   ├── train_model.py
│   └── model.pkl
│
├── templates/
│   ├── index.html          # Main SPA shell (ADD Lucide Icons CDN)
│   └── login.html          # Legacy login page
│
├── static/
│   ├── css/style.css       # (MODIFY) professional palette, icon styles, animations
│   ├── img/                # Logo, images
│   └── js/
│       ├── app.js          # Vue 3 SPA router
│       ├── store.js        # Reactive auth store
│       └── components/     # 20 Vue components
│           ├── Sidebar.js          # (MODIFY) Lucide icons
│           ├── VolunteerManager.js # (MODIFY) ML suggestion panel
│           ├── Dashboard.js
│           ├── Login.js
│           └── ... (16 more)
│
└── tests/
    ├── test_backend.py
    ├── test_otp.py
    └── test_ai_suggestions.py  # (NEW)
```

---

## Step-by-Step Implementation

### Step 1: Add `AllocationSuggestion` Model

**File:** `models.py`

Add at the end, before `OtpVerification`:

```python
class AllocationSuggestion(db.Model):
    """ML-generated volunteer suggestion for HR to review."""
    __tablename__ = 'allocation_suggestions'
    id               = db.Column(db.Integer, primary_key=True)
    beneficiary_id   = db.Column(db.Integer, db.ForeignKey('beneficiaries.id'), nullable=False)
    volunteer_id     = db.Column(db.Integer, db.ForeignKey('volunteers.id'), nullable=False)
    score            = db.Column(db.Float)
    skill_match      = db.Column(db.Boolean, default=False)
    workload         = db.Column(db.Integer)
    status           = db.Column(db.String(20), default='Pending')  # Pending/Approved/Rejected
    reason           = db.Column(db.Text, nullable=True)
    suggested_at     = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_by      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reviewed_at      = db.Column(db.DateTime, nullable=True)

    beneficiary = db.relationship('Beneficiary', backref='suggestions')
    volunteer   = db.relationship('Volunteer', backref='suggestions')
    reviewer    = db.relationship('User', backref='allocation_reviews')
```

// turbo
Run: `python -c "from app import app; print('Model loaded OK')"` to verify.

---

### Step 2: Create `services/__init__.py`

**File:** `services/__init__.py`

```python
# Services package
```

---

### Step 3: Create `services/email_service.py`

**File:** `services/email_service.py`

Extract the `send_email()` function from `routes/application.py` (lines 27–56) into this shared module. The function body is identical — just move it here. Both `routes/application.py` and `routes/volunteer.py` will import from here.

```python
"""Shared email service — single source of truth for send_email."""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app


def send_email(to_email, subject, html_body):
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
        return False
```

---

### Step 4: Update Imports in Route Files

**In `routes/application.py`:**
- Delete the local `send_email()` function (lines 27–56)
- Add: `from services.email_service import send_email`

**In `routes/volunteer.py`:**
- Delete the local `send_email()` function (lines 16–45)
- Add: `from services.email_service import send_email`

**In `routes/forgot_password.py`:**
- Change `from routes.application import send_email` to `from services.email_service import send_email`

> [!CAUTION]
> Do NOT modify the email template HTML or SMTP configuration. Only the import path changes.

---

### Step 5: Refactor ML Service for Suggestions

**File:** `services/ml_allocation_service.py`

Keep existing model loading and `predict_score()`. Replace `assign_volunteer_ml()` with:

```python
def get_suggestions(beneficiary, top_n=5):
    """
    Return top-N ranked volunteer suggestions WITHOUT assigning.
    Returns list of dicts: [{volunteer, score, skill_match, workload}, ...]
    """
    from models import Volunteer
    volunteers = Volunteer.query.all()

    candidates = []
    for v in volunteers:
        sm = _skill_match(v, beneficiary)
        wl = len(v.beneficiaries)
        pred = predict_score(v, beneficiary)

        if pred == 1:
            # Score: higher is better (skill_match yes=2, low workload=bonus)
            score = (sm * 2) + max(0, 5 - wl)
            candidates.append({
                'volunteer': v,
                'score': round(score, 2),
                'skill_match': bool(sm),
                'workload': wl
            })

    # Sort by score descending, then workload ascending
    candidates.sort(key=lambda x: (-x['score'], x['workload']))
    return candidates[:top_n]
```

---

### Step 6: Rewrite AI Allocation Routes

**File:** `routes/ai_allocation.py`

Replace with suggestion-based endpoints:

```python
from flask import Blueprint, request, jsonify
from models import Beneficiary, AllocationSuggestion
from database import db
from helpers import log_activity
from routes.auth import token_required
from datetime import datetime

ai_bp = Blueprint('ai', __name__)


@ai_bp.route('/ai-suggest/<int:beneficiary_id>', methods=['POST'])
@token_required
def ai_suggest(current_user, beneficiary_id):
    """Generate ML suggestions for a beneficiary — does NOT auto-assign."""
    if current_user.role.name not in ['Admin', 'HR']:
        return jsonify({'error': 'Access denied'}), 403

    beneficiary = Beneficiary.query.get(beneficiary_id)
    if not beneficiary:
        return jsonify({'error': 'Beneficiary not found'}), 404

    try:
        from services.ml_allocation_service import get_suggestions, get_model_accuracy
        candidates = get_suggestions(beneficiary, top_n=5)
        accuracy   = get_model_accuracy()
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 503
    except Exception as e:
        return jsonify({'error': f'AI service error: {str(e)}'}), 500

    if not candidates:
        return jsonify({
            'message': 'No suitable volunteers found by AI',
            'suggestions': [],
            'accuracy': accuracy
        }), 200

    # Clear old pending suggestions for this beneficiary
    AllocationSuggestion.query.filter_by(
        beneficiary_id=beneficiary_id, status='Pending'
    ).delete()

    # Save new suggestions
    suggestions = []
    for c in candidates:
        s = AllocationSuggestion(
            beneficiary_id = beneficiary_id,
            volunteer_id   = c['volunteer'].id,
            score          = c['score'],
            skill_match    = c['skill_match'],
            workload       = c['workload'],
            status         = 'Pending'
        )
        db.session.add(s)
        suggestions.append(s)

    db.session.commit()

    log_activity(current_user.id, "AI_SUGGEST",
        f"Generated {len(suggestions)} ML suggestions for Beneficiary '{beneficiary.name}'")

    return jsonify({
        'message': f'{len(suggestions)} volunteer suggestions generated',
        'suggestions': [{
            'id': s.id,
            'volunteer_id': s.volunteer_id,
            'volunteer_name': s.volunteer.name,
            'volunteer_skills': s.volunteer.skills,
            'volunteer_availability': s.volunteer.availability,
            'score': s.score,
            'skill_match': s.skill_match,
            'workload': s.workload,
            'status': s.status
        } for s in suggestions],
        'accuracy': accuracy,
        'decision_type': 'Machine Learning Suggestion'
    }), 200


@ai_bp.route('/ai-suggestions', methods=['GET'])
@token_required
def list_suggestions(current_user):
    """List all pending AI suggestions (HR dashboard)."""
    if current_user.role.name not in ['Admin', 'HR']:
        return jsonify({'error': 'Access denied'}), 403

    status_filter = request.args.get('status', 'Pending')
    q = AllocationSuggestion.query
    if status_filter != 'all':
        q = q.filter_by(status=status_filter)

    suggestions = q.order_by(AllocationSuggestion.suggested_at.desc()).all()
    return jsonify([{
        'id': s.id,
        'beneficiary_id': s.beneficiary_id,
        'beneficiary_name': s.beneficiary.name,
        'volunteer_id': s.volunteer_id,
        'volunteer_name': s.volunteer.name,
        'score': s.score,
        'skill_match': s.skill_match,
        'workload': s.workload,
        'status': s.status,
        'suggested_at': s.suggested_at.strftime('%Y-%m-%d %H:%M')
    } for s in suggestions])


@ai_bp.route('/ai-suggestions/<int:suggestion_id>/approve', methods=['POST'])
@token_required
def approve_suggestion(current_user, suggestion_id):
    """HR approves a suggestion → assigns volunteer to beneficiary."""
    if current_user.role.name not in ['Admin', 'HR']:
        return jsonify({'error': 'Access denied'}), 403

    suggestion = AllocationSuggestion.query.get(suggestion_id)
    if not suggestion:
        return jsonify({'error': 'Suggestion not found'}), 404
    if suggestion.status != 'Pending':
        return jsonify({'error': f'Suggestion already {suggestion.status}'}), 400

    # Approve and assign
    suggestion.status      = 'Approved'
    suggestion.reviewed_by = current_user.id
    suggestion.reviewed_at = datetime.utcnow()

    beneficiary = Beneficiary.query.get(suggestion.beneficiary_id)
    beneficiary.assigned_volunteer_id = suggestion.volunteer_id

    # Reject other pending suggestions for same beneficiary
    AllocationSuggestion.query.filter(
        AllocationSuggestion.beneficiary_id == suggestion.beneficiary_id,
        AllocationSuggestion.id != suggestion_id,
        AllocationSuggestion.status == 'Pending'
    ).update({'status': 'Rejected', 'reason': 'Another suggestion was approved'})

    try:
        db.session.commit()
        log_activity(current_user.id, "AI_APPROVE",
            f"Approved ML suggestion: Volunteer '{suggestion.volunteer.name}' → Beneficiary '{beneficiary.name}'")
        return jsonify({'message': f'Volunteer {suggestion.volunteer.name} assigned to {beneficiary.name}'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ai_bp.route('/ai-suggestions/<int:suggestion_id>/reject', methods=['POST'])
@token_required
def reject_suggestion(current_user, suggestion_id):
    """HR rejects a suggestion with optional reason."""
    if current_user.role.name not in ['Admin', 'HR']:
        return jsonify({'error': 'Access denied'}), 403

    suggestion = AllocationSuggestion.query.get(suggestion_id)
    if not suggestion:
        return jsonify({'error': 'Suggestion not found'}), 404
    if suggestion.status != 'Pending':
        return jsonify({'error': f'Suggestion already {suggestion.status}'}), 400

    data = request.get_json() or {}
    suggestion.status      = 'Rejected'
    suggestion.reason      = data.get('reason', '')
    suggestion.reviewed_by = current_user.id
    suggestion.reviewed_at = datetime.utcnow()

    try:
        db.session.commit()
        return jsonify({'message': 'Suggestion rejected'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ai_bp.route('/ai-accuracy', methods=['GET'])
def ai_accuracy():
    """Returns the current ML model accuracy."""
    try:
        from services.ml_allocation_service import get_model_accuracy
        accuracy = get_model_accuracy()
        return jsonify({'accuracy': accuracy, 'model': 'Decision Tree Classifier'})
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 503
```

---

### Step 7: Add Lucide Icons to `index.html`

**File:** `templates/index.html`

Add before the closing `</head>`:
```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
```

---

### Step 8: Update Sidebar Icons

**File:** `static/js/components/Sidebar.js`

Replace all `<span class="icon nav-letter-icon">X</span>` with Lucide icon elements. After the Vue app mounts, call `lucide.createIcons()` to render them.

Icon mapping:
| Current | Replacement |
|---------|-------------|
| `D` (Dashboard) | `<i data-lucide="layout-dashboard"></i>` |
| `HR` | `<i data-lucide="users"></i>` |
| `E` (Employees) | `<i data-lucide="briefcase"></i>` |
| `V` (Volunteers) | `<i data-lucide="heart-handshake"></i>` |
| `Do` (Donors) | `<i data-lucide="hand-coins"></i>` |
| `P` (Projects) | `<i data-lucide="folder-kanban"></i>` |
| `F` (Finance) | `<i data-lucide="wallet"></i>` |
| `An` (Analytics) | `<i data-lucide="bar-chart-3"></i>` |
| `L` (Logs) | `<i data-lucide="scroll-text"></i>` |
| `Ap` (Applications) | `<i data-lucide="file-text"></i>` |
| `Me` (Profile) | `<i data-lucide="circle-user"></i>` |
| `AL` (Attendance) | `<i data-lucide="calendar-check"></i>` |

---

### Step 9: Update CSS for Icons, Colors & Animations

**File:** `static/css/style.css`

Add/update:
- `.nav-item i[data-lucide]` sizing (width: 20px, height: 20px, stroke-width: 1.75)
- Professional color palette update for CSS variables
- Subtle card entrance animation (`@keyframes fadeInUp`)
- AI suggestion panel styles (`.suggestion-card`, `.score-badge`, etc.)

---

### Step 10: Update VolunteerManager.js

**File:** `static/js/components/VolunteerManager.js`

- Replace `aiAssign(b)` → `getAiSuggestion(b)` calling `POST /ai-suggest/<id>`
- Replace `aiResult` flat display → `aiSuggestions[]` array with review cards
- Add Approve/Reject button handlers calling the new endpoints
- Refresh beneficiary data after approval

---

### Step 11: Run Verification

// turbo
```powershell
cd "c:\Users\hshan\OneDrive\Attachments\Internship Corrected file"
python -m pytest tests/ -v
```

Then manually test via browser:
1. Login as Admin
2. Go to Volunteers → Beneficiaries tab
3. Click "Get AI Suggestion" → verify suggestion cards
4. Approve one → verify assignment
5. Verify sidebar has proper icons
6. Verify emails still work (check console mock output)
