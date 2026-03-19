import os
from dotenv import load_dotenv
load_dotenv()  # load .env before anything else

from flask import Flask, render_template, redirect, url_for
from flasgger import Swagger
from database import init_db, db
from flask_migrate import Migrate
from routes.hr import hr_bp
from routes.employee import employee_bp
from routes.auth import auth_bp
from routes.donor import donor_bp
from routes.volunteer import volunteer_bp
from routes.project import project_bp
from routes.finance import finance_bp
from routes.analytics import analytics_bp
from routes.application import application_bp
from routes.forgot_password import forgot_bp
from routes.otp import otp_bp
from routes.ai_allocation import ai_bp

app = Flask(__name__)

# --- Security ---
# SECRET_KEY must be set in .env for production. Never hardcode this.
app.secret_key = os.environ.get('SECRET_KEY') or os.urandom(24)

app.config['SWAGGER'] = {'title': 'NGO Manager API', 'uiversion': 3}

# --- Email config (set in .env for real delivery) ---
app.config['MAIL_SERVER']         = os.environ.get('MAIL_SERVER', '')
app.config['MAIL_PORT']           = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS']        = os.environ.get('MAIL_USE_TLS', 'True') == 'True'
app.config['MAIL_USERNAME']       = os.environ.get('MAIL_USERNAME', '')
app.config['MAIL_PASSWORD']       = os.environ.get('MAIL_PASSWORD', '')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@ngoapp.com')

# --- Fast2SMS config (for OTP) ---
app.config['FAST2SMS_API_KEY'] = os.environ.get('FAST2SMS_API_KEY', '')

# --- Initialize DB ---
init_db(app)
migrate = Migrate(app, db)

swagger = Swagger(app)

# --- Register Blueprints ---
app.register_blueprint(hr_bp)
app.register_blueprint(employee_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(donor_bp)
app.register_blueprint(volunteer_bp)
app.register_blueprint(project_bp)
app.register_blueprint(finance_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(application_bp)
app.register_blueprint(forgot_bp)
app.register_blueprint(otp_bp)
app.register_blueprint(ai_bp)


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login_page():
    # Redirect to index instead of rendering the same template twice
    return redirect(url_for('index'))


@app.after_request
def add_header(response):
    # Aggressively disable caching for all responses
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response

if __name__ == '__main__':
    # FLASK_DEBUG=True only for local development — never set True in production
    app.run(debug=os.environ.get('FLASK_DEBUG', 'False') == 'True')