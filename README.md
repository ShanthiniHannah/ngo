# ArcMission — NGO Management System

> *"For we are God's handiwork, created in Christ Jesus to do good works."*  
> — Ephesians 2:10

A full‑stack NGO management web application built with **Flask** (Python) and **Vue 3** (JavaScript), designed to manage volunteers, beneficiaries, donors, employees, and HR operations for **Clarion Call Mission**.

---

## 🌟 Features

| Module | Capabilities |
|---|---|
| **Authentication** | JWT login, OTP verification, account lockout, password reset via email |
| **Role-Based Access Control** | Admin, HR, Employee, Volunteer, Donor, Beneficiary |
| **Volunteer Management** | Attendance tracking, task assignment, portal access |
| **Beneficiary Management** | Application form, document upload, AI-based service allocation |
| **Donor Management** | Donation tracking, 80G tax certificates, email receipts |
| **HR Management** | Employee records, leave management, payroll |
| **Finance** | Budget tracking, expense records |
| **Analytics Dashboard** | Charts & reports (Chart.js) |
| **Daily Bible Verse** | Auto-displayed verse on dashboard |
| **AI Allocation** | ML-based beneficiary service suggestions (scikit-learn) |
| **Email Notifications** | SMTP-based emails for OTP, receipts, certificates |
| **Security** | Flask-Limiter rate limiting, CSRF protection, input sanitisation |

---

## 🗂 Project Structure

```
ngo/
├── app.py                        # Flask application entry point
├── database.py                   # SQLAlchemy DB setup
├── extensions.py                 # Flask extension initialisation
├── models.py                     # All database models
├── helpers.py                    # Utility / helper functions
├── migrate.py                    # DB migration helper
├── Procfile                      # Gunicorn start command
├── render.yaml                   # Render deployment config
├── requirements.txt              # Python dependencies
├── .env                          # Environment variables (not committed)
│
├── routes/                       # Flask blueprints
│   ├── auth.py                   # Login, logout, OTP
│   ├── forgot_password.py        # Password reset flow
│   ├── hr.py                     # HR operations
│   ├── employee.py               # Employee routes
│   ├── volunteer.py              # Volunteer routes
│   ├── donor.py                  # Donor & donation routes
│   ├── application.py            # Beneficiary applications
│   ├── acknowledgment.py         # Donation acknowledgment
│   ├── finance.py                # Finance records
│   ├── analytics.py              # Reports & analytics
│   ├── ai_allocation.py          # ML-based service allocation
│   ├── otp.py                    # OTP management
│   └── project.py                # Project management
│
├── services/                     # Business logic layer
│   ├── email_service.py          # Email sending (SMTP)
│   └── ml_allocation_service.py  # AI/ML allocation logic
│
├── migrations/                   # Flask-Migrate Alembic versions
│
├── ml_model/                     # Trained ML model files
│
├── static/
│   ├── css/
│   │   └── style.css             # Global stylesheet
│   ├── js/
│   │   ├── app.js                # Vue 3 app bootstrap & router
│   │   ├── store.js              # Shared Vue state store
│   │   └── components/           # Vue single-file components
│   │       ├── Login.js
│   │       ├── Dashboard.js
│   │       ├── Sidebar.js
│   │       ├── HRManager.js
│   │       ├── EmployeeManager.js
│   │       ├── EmployeePortal.js
│   │       ├── VolunteerManager.js
│   │       ├── VolunteerPortal.js
│   │       ├── DonorManager.js
│   │       ├── DonorPortal.js
│   │       ├── BeneficiaryApplicationForm.js
│   │       ├── BeneficiaryPortal.js
│   │       ├── ApplicationForm.js
│   │       ├── ApplicationReview.js
│   │       ├── FinanceManager.js
│   │       ├── ProjectManager.js
│   │       ├── AnalyticsDashboard.js
│   │       ├── MyProfile.js
│   │       ├── DailyVerse.js
│   │       └── Toast.js
│   └── images/
│       └── ccm_logo.png          # Organisation logo
│
├── templates/
│   └── index.html                # Single-page app HTML shell
│
└── tests/
    └── test_backend.py           # Backend unit tests
```

---

## ⚙️ Installation & Local Setup

### Prerequisites
- Python 3.10 or higher
- `pip` (Python package manager)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/ShanthiniHannah/ngo.git
cd ngo
```

### 2. Create a Virtual Environment

```bash
python -m venv venv

# Activate — Windows
venv\Scripts\activate

# Activate — Mac/Linux
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
SECRET_KEY=your-very-secret-key
DATABASE_URL=sqlite:///app.db
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### 5. Initialise the Database

```bash
flask db upgrade
```

### 6. (Optional) Seed Demo Data

```bash
python seed_all_users.py
```

### 7. Run the Application

```bash
flask run
```

The app will be available at **http://localhost:5000**

---

## 🚀 Deployment on Render (Free Tier)

1. Push your code to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service** → connect your GitHub repo.
3. Render will auto-detect `render.yaml` and configure the service.
4. Set environment variables in the Render dashboard:
   - `SECRET_KEY`
   - `DATABASE_URL` (use Render's free PostgreSQL URL or `sqlite:///app.db`)
   - Mail settings
5. Click **Deploy** — Render runs `pip install -r requirements.txt` then starts the app with `gunicorn app:app`.
6. After first deploy, open the Render **Shell** and run:
   ```bash
   flask db upgrade
   ```

---

## 👥 Default Roles

| Role | Access Level |
|---|---|
| Admin | Full system access |
| HR | Employee & volunteer management |
| Employee | Personal portal & tasks |
| Volunteer | Attendance, tasks, profile |
| Donor | Donation history, certificates |
| Beneficiary | Application status, services |

---

## 🔒 Security

- JWT-based stateless authentication
- Account lockout after 5 failed login attempts
- Rate limiting via Flask-Limiter
- Password strength enforcement
- Input sanitisation on all forms

---

## 🧪 Running Tests

```bash
pytest tests/test_backend.py -v
```

---

## 📄 License

This project was developed as part of an internship for **Clarion Call Mission**. All rights reserved.
