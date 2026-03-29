from datetime import datetime
from database import db


class Role(db.Model):
    __tablename__ = 'roles'
    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(200))
    users       = db.relationship('User', backref='role', lazy=True)

    def __repr__(self):
        return f'<Role {self.name}>'


class User(db.Model):
    __tablename__ = 'users'
    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(100), nullable=False)
    email      = db.Column(db.String(100), unique=True, nullable=False)
    password   = db.Column(db.String(255), nullable=False)
    role_id    = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    failed_login_attempts = db.Column(db.Integer, default=0)
    locked_until          = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f'<User {self.email}>'


class Employee(db.Model):
    __tablename__ = 'employees'
    id      = db.Column(db.Integer, primary_key=True)
    # Link to User — single source of truth for name/email
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    name    = db.Column(db.String(100), nullable=False)
    email   = db.Column(db.String(100), unique=True, nullable=False)
    age     = db.Column(db.Integer)
    gender  = db.Column(db.String(20))
    address = db.Column(db.String(255))
    sponsor = db.Column(db.String(100))

    # HR who manages this employee (HR is a User)
    hr_id      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Explicit foreign_keys needed because two FK columns point to the same table
    user = db.relationship('User', foreign_keys=[user_id], backref='employee_profile')
    hr   = db.relationship('User', foreign_keys=[hr_id],   backref='managed_employees')

    def __repr__(self):
        return f'<Employee {self.name}>'


class Donor(db.Model):
    __tablename__ = 'donors'
    id                 = db.Column(db.Integer, primary_key=True)
    name               = db.Column(db.String(100), nullable=False)
    email              = db.Column(db.String(100), unique=True, nullable=False)
    phone              = db.Column(db.String(20))
    address            = db.Column(db.String(255))
    donation_amount    = db.Column(db.Float, default=0.0)
    transaction_id     = db.Column(db.String(100), nullable=True)
    last_donation_date = db.Column(db.DateTime)
    created_at         = db.Column(db.DateTime, default=datetime.utcnow)
    user_id            = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    def __repr__(self):
        return f'<Donor {self.name}>'


class Volunteer(db.Model):
    __tablename__ = 'volunteers'
    id           = db.Column(db.Integer, primary_key=True)
    name         = db.Column(db.String(100), nullable=False)
    email        = db.Column(db.String(100), unique=True, nullable=False)
    phone        = db.Column(db.String(20))
    skills       = db.Column(db.String(255))
    availability = db.Column(db.String(100))
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)
    user_id      = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    def __repr__(self):
        return f'<Volunteer {self.name}>'


class Beneficiary(db.Model):
    __tablename__ = 'beneficiaries'
    id                   = db.Column(db.Integer, primary_key=True)
    name                 = db.Column(db.String(100), nullable=False)
    email                = db.Column(db.String(100), nullable=True)
    phone                = db.Column(db.String(20), nullable=True)
    age                  = db.Column(db.Integer)
    gender               = db.Column(db.String(20))
    needs                = db.Column(db.Text)
    status               = db.Column(db.String(50), default='Pending')
    assigned_volunteer_id = db.Column(db.Integer, db.ForeignKey('volunteers.id'), nullable=True)
    photo_filename       = db.Column(db.String(255), nullable=True)
    document_path        = db.Column(db.String(255), nullable=True)
    created_at           = db.Column(db.DateTime, default=datetime.utcnow)

    volunteer = db.relationship('Volunteer', backref='beneficiaries', lazy=True)

    def __repr__(self):
        return f'<Beneficiary {self.name}>'


class Report(db.Model):
    __tablename__ = 'reports'
    id           = db.Column(db.Integer, primary_key=True)
    title        = db.Column(db.String(200), nullable=False)
    content      = db.Column(db.Text, nullable=False)
    generated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Report {self.title}>'


class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    id        = db.Column(db.Integer, primary_key=True)
    user_id   = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    action    = db.Column(db.String(255), nullable=False)
    details   = db.Column(db.Text, nullable=True)
    ip_address= db.Column(db.String(45), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<ActivityLog user={self.user_id} action={self.action}>'


class Attendance(db.Model):
    __tablename__   = 'attendance'
    id              = db.Column(db.Integer, primary_key=True)
    user_id         = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    # FIX: use lambda so default is evaluated per-row, not once at class definition
    date            = db.Column(db.Date, default=lambda: datetime.utcnow().date())
    status          = db.Column(db.String(20), default='Absent')  # Present/Absent/Late/On Leave
    check_in_time   = db.Column(db.Time, nullable=True)
    check_out_time  = db.Column(db.Time, nullable=True)

    def __repr__(self):
        return f'<Attendance user={self.user_id} date={self.date}>'


class Leave(db.Model):
    __tablename__ = 'leaves'
    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date   = db.Column(db.Date, nullable=False)
    reason     = db.Column(db.String(255))
    status     = db.Column(db.String(20), default='Pending')  # Pending/Approved/Rejected

    def __repr__(self):
        return f'<Leave user={self.user_id} {self.start_date}→{self.end_date}>'


class Project(db.Model):
    __tablename__ = 'projects'
    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    start_date  = db.Column(db.Date)
    end_date    = db.Column(db.Date)
    status      = db.Column(db.String(20), default='Planned')  # Planned/In Progress/Completed
    budget      = db.Column(db.Float, default=0.0)

    def __repr__(self):
        return f'<Project {self.name}>'


class Deliverable(db.Model):
    __tablename__ = 'deliverables'
    id         = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    title      = db.Column(db.String(200), nullable=False)
    due_date   = db.Column(db.Date)
    status     = db.Column(db.String(20), default='Pending')  # Pending/Completed

    def __repr__(self):
        return f'<Deliverable {self.title}>'


class Sponsorship(db.Model):
    __tablename__ = 'sponsorships'
    id           = db.Column(db.Integer, primary_key=True)
    sponsor_name = db.Column(db.String(100), nullable=False)
    amount       = db.Column(db.Float, nullable=False)
    date         = db.Column(db.DateTime, default=datetime.utcnow)
    donor_id     = db.Column(db.Integer, db.ForeignKey('donors.id'), nullable=True)
    project_id   = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=True)

    def __repr__(self):
        return f'<Sponsorship {self.sponsor_name} ${self.amount}>'


class SpiritualGrowth(db.Model):
    __tablename__ = 'spiritual_growth'
    id            = db.Column(db.Integer, primary_key=True)
    user_id       = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    # FIX: use lambda so default is evaluated per-row, not once at class definition
    date          = db.Column(db.Date, default=lambda: datetime.utcnow().date())
    activity_type = db.Column(db.String(100), nullable=False)  # Prayer, Meditation, Service, etc.
    duration      = db.Column(db.Integer)  # in minutes
    notes         = db.Column(db.Text)

    def __repr__(self):
        return f'<SpiritualGrowth user={self.user_id} {self.activity_type}>'


class Application(db.Model):
    """
    Volunteer / Donor membership application.
    Covers personal details, background check, spiritual life, and interview tracking.
    """
    __tablename__ = 'applications'
    id = db.Column(db.Integer, primary_key=True)

    # Type & Status
    application_type = db.Column(db.String(20), nullable=False)  # 'Volunteer' | 'Donor'
    status           = db.Column(db.String(30), default='Pending')
    # Statuses: Pending → Under Review → Interview Scheduled → Approved | Rejected

    # --- Section 1: Personal Information ---
    full_name       = db.Column(db.String(100), nullable=False)
    email           = db.Column(db.String(100), nullable=False)
    phone           = db.Column(db.String(20))
    address         = db.Column(db.String(255))
    age             = db.Column(db.Integer)
    gender          = db.Column(db.String(20))
    occupation      = db.Column(db.String(100))
    id_proof_type   = db.Column(db.String(50))
    id_proof_number = db.Column(db.String(50))

    # --- Section 2: Background Details ---
    education               = db.Column(db.String(255))
    work_experience         = db.Column(db.Text)
    previous_ngo_experience = db.Column(db.Text)
    skills                  = db.Column(db.String(255))
    availability            = db.Column(db.String(100))
    donation_capacity       = db.Column(db.String(100))
    reference_name          = db.Column(db.String(100))
    reference_contact       = db.Column(db.String(100))
    # FIX: use Boolean instead of String for Yes/No fields
    criminal_record         = db.Column(db.Boolean, default=False)
    criminal_details        = db.Column(db.Text)

    # --- Section 3: Spiritual Life ---
    # FIX: use Boolean instead of String for Yes/No fields
    is_christian           = db.Column(db.Boolean, default=False)
    years_as_believer      = db.Column(db.Integer)
    church_name            = db.Column(db.String(150))
    church_location        = db.Column(db.String(150))
    pastor_name            = db.Column(db.String(100))
    pastor_contact         = db.Column(db.String(100))
    spiritual_gifts        = db.Column(db.String(255))
    ministry_involvement   = db.Column(db.Text)
    personal_testimony     = db.Column(db.Text)
    reason_to_join         = db.Column(db.Text)
    agrees_to_statement    = db.Column(db.Boolean, default=False)

    # --- Interview ---
    interview_date   = db.Column(db.DateTime, nullable=True)
    interview_notes  = db.Column(db.Text)
    reviewed_by      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    rejection_reason = db.Column(db.Text)

    # --- Photo ---
    photo_filename = db.Column(db.String(255), nullable=True)

    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at   = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Application {self.full_name} ({self.application_type})>'


class AllocationSuggestion(db.Model):
    """ML-generated volunteer suggestion for HR to review before final assignment."""
    __tablename__ = 'allocation_suggestions'
    id               = db.Column(db.Integer, primary_key=True)
    beneficiary_id   = db.Column(db.Integer, db.ForeignKey('beneficiaries.id'), nullable=False)
    volunteer_id     = db.Column(db.Integer, db.ForeignKey('volunteers.id'), nullable=False)
    score            = db.Column(db.Float)            # ML confidence/match score
    skill_match      = db.Column(db.Boolean, default=False)
    workload         = db.Column(db.Integer)           # volunteer's current beneficiary count
    status           = db.Column(db.String(20), default='Pending')  # Pending/Approved/Rejected
    reason           = db.Column(db.Text, nullable=True)            # HR reason for rejection
    suggested_at     = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_by      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reviewed_at      = db.Column(db.DateTime, nullable=True)

    beneficiary = db.relationship('Beneficiary', backref='suggestions')
    volunteer   = db.relationship('Volunteer', backref='allocation_suggestions')
    reviewer    = db.relationship('User', backref='allocation_reviews')

    def __repr__(self):
        return f'<AllocationSuggestion vol={self.volunteer_id}→ben={self.beneficiary_id} {self.status}>'


class ServiceAcknowledgment(db.Model):
    """Beneficiary feedback on assigned volunteer's service quality."""
    __tablename__ = 'service_acknowledgments'
    id               = db.Column(db.Integer, primary_key=True)
    beneficiary_id   = db.Column(db.Integer, db.ForeignKey('beneficiaries.id'), nullable=False)
    volunteer_id     = db.Column(db.Integer, db.ForeignKey('volunteers.id'), nullable=False)
    rating           = db.Column(db.Integer, nullable=False)           # 1-5
    feedback         = db.Column(db.Text, nullable=True)
    service_type     = db.Column(db.String(100), nullable=True)        # e.g. "Food & Nutrition"
    status           = db.Column(db.String(30), default='Satisfied')   # Satisfied / Needs Improvement
    acknowledged_at  = db.Column(db.DateTime, default=datetime.utcnow)

    beneficiary = db.relationship('Beneficiary', backref='acknowledgments')
    volunteer   = db.relationship('Volunteer', backref='acknowledgments')

    def __repr__(self):
        return f'<ServiceAcknowledgment ben={self.beneficiary_id}→vol={self.volunteer_id} {self.status}>'


class OtpVerification(db.Model):
    """Stores SHA-256 hashed OTPs for phone number verification."""
    __tablename__ = 'otp_verifications'
    id           = db.Column(db.Integer, primary_key=True)
    phone_number = db.Column(db.String(20), nullable=False, index=True)
    otp_hash     = db.Column(db.String(64), nullable=False)  # SHA-256 hex digest
    expiry_time  = db.Column(db.DateTime, nullable=False)
    attempts     = db.Column(db.Integer, default=0)
    verified     = db.Column(db.Boolean, default=False)
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<OtpVerification phone={self.phone_number}>'

class BibleVerse(db.Model):
    __tablename__ = 'bible_verses'
    id        = db.Column(db.Integer, primary_key=True)
    text      = db.Column(db.Text, nullable=False)
    reference = db.Column(db.String(100), nullable=False)
    added_at  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'reference': self.reference
        }
