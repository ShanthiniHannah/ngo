export default {
    template: `
    <div class="apply-page">
        <div class="apply-hero">
            <div class="apply-hero-inner">
                <div class="apply-logo"></div>
                <h1>Join Our Mission</h1>
                <p>Apply to become a <strong>Volunteer</strong> or <strong>Donor</strong> member of ArcMission community</p>
            </div>
        </div>

        <div class="apply-container" v-if="submitted">
            <div class="success-card glass-card">
                <div class="success-icon"></div>
                <h2>Application Submitted!</h2>
                <p>Thank you, <strong>{{ submittedName }}</strong>! Your application <strong>#{{ submittedId }}</strong> has been received.</p>
                <div class="success-info">
                    <p>A confirmation email has been sent to <strong>{{ submittedEmail }}</strong></p>
                    <p>Check your inbox for an <strong>account activation link</strong> to set your password.</p>
                    <p>Our HR team will review your application within <strong>3–5 business days</strong> and schedule an interview.</p>
                </div>
                <button class="btn btn-primary" @click="$router.push('/login')">Back to Login</button>
            </div>
        </div>

        <div class="apply-container" v-else>
            <div class="stepper">
                <div v-for="(s, i) in steps" :key="i" :class="['step-item', { active: currentStep === i, done: currentStep > i }]">
                    <div class="step-circle">{{ currentStep > i ? '✓' : i + 1 }}</div>
                    <div class="step-label">{{ s }}</div>
                </div>
                <div class="step-line"></div>
            </div>

            <div class="glass-card apply-form-card">

                <!-- Step 0: Choose Type -->
                <div v-if="currentStep === 0">
                    <h2>How would you like to contribute?</h2>
                    <p class="step-desc">Choose the type of membership you are applying for</p>
                    <div class="type-cards">
                        <div class="type-card" :class="{ selected: form.application_type === 'Volunteer' }" @click="form.application_type = 'Volunteer'">
                            <div class="type-icon">V</div><h3>Volunteer</h3>
                            <p>Contribute your time, skills and service to help our community projects and beneficiaries.</p>
                        </div>
                        <div class="type-card" :class="{ selected: form.application_type === 'Donor' }" @click="form.application_type = 'Donor'">
                            <div class="type-icon">D</div><h3>Donor</h3>
                            <p>Support our mission through financial contributions to fund projects, beneficiaries and operations.</p>
                        </div>
                    </div>
                    <div v-if="stepError" class="error-box">{{ stepError }}</div>
                </div>

                <!-- Step 1: Personal Information -->
                <div v-if="currentStep === 1">
                    <h2>Personal Information</h2>
                    <p class="step-desc">Basic details for identity verification</p>
                    <div class="form-group" style="margin-bottom:1.5rem;">
                        <label>Profile Photo <small style="color:#64748b;">(JPG/PNG, max 5MB)</small></label>
                        <div class="photo-upload-box"
                            :class="{'photo-upload-box--hover': photoDragging, 'photo-upload-box--done': photoPreview}"
                            @dragover.prevent="photoDragging=true" @dragleave="photoDragging=false"
                            @drop.prevent="onPhotoDrop($event)" @click="$refs.photoInput.click()"
                            style="border:2px dashed #a5b4fc;border-radius:16px;padding:1.5rem;text-align:center;cursor:pointer;transition:all .2s;background:rgba(99,102,241,.04);">
                            <input ref="photoInput" type="file" accept="image/*" style="display:none" @change="onPhotoSelect">
                            <div v-if="!photoPreview"><div style="font-size:2.5rem;"></div><p style="margin:.5rem 0 0;color:#64748b;font-size:.9rem;">Click or drag &amp; drop a photo here</p></div>
                            <div v-else style="position:relative;display:inline-block;">
                                <img :src="photoPreview" style="width:110px;height:110px;object-fit:cover;border-radius:50%;border:3px solid #6366f1;">
                                <button type="button" @click.stop="removePhoto" style="position:absolute;top:-6px;right:-6px;background:#ef4444;color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:.8rem;">x</button>
                            </div>
                            <div v-if="photoUploading" style="margin-top:.5rem;color:#6366f1;font-size:.85rem;">Uploading...</div>
                            <div v-if="photoError" style="margin-top:.5rem;color:#ef4444;font-size:.85rem;">{{ photoError }}</div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Full Name *</label><input type="text" v-model="form.full_name" required placeholder="As per ID"></div>
                        <div class="form-group"><label>Email Address *</label><input type="email" v-model="form.email" required placeholder="your@email.com"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Phone Number * <small style="color:#64748b;">(10 digits)</small></label>
                            <input type="text" v-model="form.phone" placeholder="9876543210" maxlength="10" @input="onPhoneInput">
                            <small v-if="phoneError" style="color:#ef4444;display:block;margin-top:4px;">{{ phoneError }}</small>
                        </div>
                        <div class="form-group"><label>Age</label><input type="number" v-model="form.age" placeholder="25" min="13" max="90"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Gender</label>
                            <select v-model="form.gender"><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option></select>
                        </div>
                        <div class="form-group"><label>Occupation</label><input type="text" v-model="form.occupation" placeholder="e.g. Teacher, Engineer"></div>
                    </div>
                    <div class="form-group"><label>Address</label><input type="text" v-model="form.address" placeholder="Street, City, State, PIN"></div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Government ID Type</label>
                            <select v-model="form.id_proof_type"><option value="">Select</option><option>Aadhaar Card</option><option>PAN Card</option><option>Passport</option><option>Voter ID</option><option>Driving Licence</option></select>
                        </div>
                        <div class="form-group"><label>ID Number</label><input type="text" v-model="form.id_proof_number" placeholder="XXXX XXXX XXXX"></div>
                    </div>
                    <div v-if="stepError" class="error-box">{{ stepError }}</div>
                </div>

                <!-- Step 2: Background Details -->
                <div v-if="currentStep === 2">
                    <h2>Background Details</h2>
                    <p class="step-desc">Help us understand your experience and suitability</p>
                    <div class="form-group"><label>Highest Education</label><input type="text" v-model="form.education" placeholder="e.g. B.Sc Computer Science, Madras University"></div>
                    <div class="form-group"><label>Work / Professional Experience</label><textarea v-model="form.work_experience" rows="2" placeholder="Describe your work history..."></textarea></div>
                    <div class="form-group"><label>Previous NGO / Volunteer Experience</label><textarea v-model="form.previous_ngo_experience" rows="2" placeholder="Have you volunteered or donated to other NGOs? Details..."></textarea></div>
                    <div class="form-group"><label>Skills / Areas of Expertise <small v-if="form.application_type==='Volunteer'">(required)</small></label>
                        <input type="text" v-model="form.skills" placeholder="e.g. Teaching, Medical, Cooking, Driving, Accounting">
                    </div>
                    <div class="form-group" v-if="form.application_type === 'Volunteer'">
                        <label>Availability</label>
                        <input type="text" v-model="form.availability" placeholder="e.g. Weekends, Mon-Fri evenings, Full time">
                    </div>
                    <div class="form-group" v-if="form.application_type === 'Donor'">
                        <label>Donation Preference</label>
                        <select v-model="form.donation_capacity"><option value="">Select</option><option>One-time</option><option>Monthly</option><option>Quarterly</option><option>Annually</option></select>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Reference Name *</label><input type="text" v-model="form.reference_name" placeholder="Name of someone who can vouch for you"></div>
                        <div class="form-group"><label>Reference Contact</label><input type="text" v-model="form.reference_contact" placeholder="Phone or email"></div>
                    </div>
                    <div class="form-group">
                        <label class="label-row">Do you have any prior criminal record? *
                            <div class="radio-group">
                                <label class="radio-label"><input type="radio" v-model="form.criminal_record" value="No"> No</label>
                                <label class="radio-label"><input type="radio" v-model="form.criminal_record" value="Yes"> Yes</label>
                            </div>
                        </label>
                    </div>
                    <div class="form-group" v-if="form.criminal_record === 'Yes'">
                        <label>Please provide details</label>
                        <textarea v-model="form.criminal_details" rows="2" placeholder="Please describe the nature of the record..."></textarea>
                    </div>
                    <div v-if="stepError" class="error-box">{{ stepError }}</div>
                </div>

                <!-- Step 3: Spiritual Life -->
                <div v-if="currentStep === 3">
                    <h2>Spiritual Life Assessment</h2>
                    <p class="step-desc">As a faith-based NGO, we value spiritual integrity. Please answer honestly.</p>
                    <div class="form-group">
                        <label class="label-row">Are you a born-again Christian? *
                            <div class="radio-group">
                                <label class="radio-label"><input type="radio" v-model="form.is_christian" value="Yes"> Yes</label>
                                <label class="radio-label"><input type="radio" v-model="form.is_christian" value="No"> No</label>
                            </div>
                        </label>
                    </div>
                    <div class="form-row" v-if="form.is_christian === 'Yes'">
                        <div class="form-group"><label>How many years have you been a believer?</label><input type="number" v-model="form.years_as_believer" placeholder="e.g. 5" min="0"></div>
                        <div class="form-group"><label>Your Church Name</label><input type="text" v-model="form.church_name" placeholder="e.g. Grace Bible Church"></div>
                    </div>
                    <div class="form-group" v-if="form.is_christian === 'Yes'">
                        <label>Church Location / City</label>
                        <input type="text" v-model="form.church_location" placeholder="e.g. Chennai, Tamil Nadu">
                    </div>
                    <div class="form-row" v-if="form.is_christian === 'Yes'">
                        <div class="form-group"><label>Pastor / Leader Name</label><input type="text" v-model="form.pastor_name" placeholder="Your pastor's name"></div>
                        <div class="form-group"><label>Pastor's Contact</label><input type="text" v-model="form.pastor_contact" placeholder="Phone or email"></div>
                    </div>
                    <div class="form-group"><label>Spiritual Gifts / Ministry Strengths</label>
                        <input type="text" v-model="form.spiritual_gifts" placeholder="e.g. Teaching, Prayer, Evangelism, Mercy, Giving">
                    </div>
                    <div class="form-group"><label>Ministry Involvement</label><textarea v-model="form.ministry_involvement" rows="2" placeholder="What ministries or church activities are you involved in?"></textarea></div>
                    <div class="form-group">
                        <label>Personal Testimony <span style="color:var(--primary-color)">*</span></label>
                        <textarea v-model="form.personal_testimony" rows="3" placeholder="Share briefly about your faith journey and how you came to know Christ..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Why do you want to join ArcMission? <span style="color:var(--primary-color)">*</span></label>
                        <textarea v-model="form.reason_to_join" rows="3" placeholder="What motivates you to serve through ArcMission?"></textarea>
                    </div>
                    <div v-if="stepError" class="error-box">{{ stepError }}</div>
                </div>

                <!-- Step 4: Review & Submit -->
                <div v-if="currentStep === 4">
                    <h2>Review & Confirm</h2>
                    <p class="step-desc">Please review your details before submitting</p>
                    <div class="review-section">
                        <div class="review-badge" :class="form.application_type === 'Volunteer' ? 'badge-volunteer' : 'badge-donor'">
                            {{ form.application_type === 'Volunteer' ? 'Volunteer Application' : 'Donor Application' }}
                        </div>
                    </div>
                    <div class="review-grid">
                        <div class="review-item"><span class="rl">Name</span><span class="rv">{{ form.full_name }}</span></div>
                        <div class="review-item"><span class="rl">Email</span><span class="rv">{{ form.email }}</span></div>
                        <div class="review-item"><span class="rl">Phone</span><span class="rv">{{ form.phone }}</span></div>
                        <div class="review-item"><span class="rl">Church</span><span class="rv">{{ form.church_name || '—' }}</span></div>
                        <div class="review-item"><span class="rl">Testimony</span><span class="rv excerpt">{{ (form.personal_testimony || '—').substring(0,100) }}...</span></div>
                        <div class="review-item"><span class="rl">Skills</span><span class="rv">{{ form.skills || '—' }}</span></div>
                    </div>
                    <div class="faith-statement">
                        <div class="declaration-header">Declaration & Statement of Agreement</div>
                        <ol class="declaration-list">
                            <li><strong>Truthfulness:</strong> I confirm that all information provided in this application is true, accurate and complete to the best of my knowledge.</li>
                            <li><strong>Background Verification:</strong> I hereby give my consent to ArcMission conducting a reasonable background check.</li>
                            <li><strong>Statement of Faith:</strong> I acknowledge that this is a Christ-centred, faith-based NGO and agree to uphold its values.</li>
                            <li><strong>Conduct & Commitment:</strong> I agree to serve with integrity, humility and a servant heart.</li>
                            <li><strong>Confidentiality:</strong> I agree to keep confidential any sensitive information about beneficiaries, donors, or internal operations.</li>
                            <li><strong>Media & Communication:</strong> I consent to ArcMission using my name and photographs for official publications unless I notify otherwise in writing.</li>
                            <li><strong>Data Privacy:</strong> I understand that my personal data will be stored securely and used solely for ArcMission's operations.</li>
                        </ol>
                        <label class="faith-check-label" style="margin-top:1rem">
                            <input type="checkbox" v-model="form.agrees_to_statement">
                            <span><strong>I have read, understood, and agree</strong> to all the terms and conditions stated above.</span>
                        </label>
                    </div>
                    <div v-if="stepError" class="error-box">{{ stepError }}</div>
                    <div v-if="submitError" class="error-box">{{ submitError }}</div>
                </div>

                <!-- Navigation -->
                <div class="form-nav">
                    <button class="btn btn-secondary" @click="prevStep" v-if="currentStep > 0">← Back</button>
                    <div style="flex:1"></div>
                    <button class="btn btn-primary" v-if="currentStep < 4" @click="nextStep">
                        {{ currentStep === 0 ? 'Start Application →' : 'Next →' }}
                    </button>
                    <button class="btn btn-primary" v-else @click="submitApplication" :disabled="submitting || !form.agrees_to_statement">
                        {{ submitting ? 'Submitting...' : 'Submit Application' }}
                    </button>
                </div>
            </div>
            <p class="login-link">Already a member? <router-link to="/login">Sign in here</router-link></p>
        </div>
    </div>
    `,
    data() {
        return {
            currentStep: 0, submitted: false, submitting: false,
            submittedId: null, submittedName: '', submittedEmail: '',
            stepError: '', submitError: '', phoneError: '',
            steps: ['Type', 'Personal Info', 'Background', 'Spiritual Life', 'Review & Submit'],
            photoPreview: null, photoDragging: false, photoUploading: false, photoError: '',
            form_photo_filename: null,
            form: {
                application_type: '', full_name: '', email: '', phone: '', age: null,
                gender: '', occupation: '', address: '', id_proof_type: '', id_proof_number: '',
                education: '', work_experience: '', previous_ngo_experience: '',
                skills: '', availability: '', donation_capacity: '',
                reference_name: '', reference_contact: '', criminal_record: 'No', criminal_details: '',
                is_christian: '', years_as_believer: null, church_name: '', church_location: '',
                pastor_name: '', pastor_contact: '', spiritual_gifts: '',
                ministry_involvement: '', personal_testimony: '', reason_to_join: '',
                agrees_to_statement: false
            }
        };
    },
    methods: {
        onPhoneInput(event) {
            this.form.phone = event.target.value.replace(/\D/g, '').slice(0, 10);
            this.phoneError = '';
        },
        validatePhone(value) {
            if (!value) return 'Phone number is required.';
            if (!/^\d{10}$/.test(value)) return 'Phone number must be exactly 10 digits.';
            return '';
        },
        validateStep() {
            this.stepError = '';
            if (this.currentStep === 0 && !this.form.application_type) { this.stepError = 'Please select Volunteer or Donor to continue.'; return false; }
            if (this.currentStep === 1) {
                if (!this.form.full_name) { this.stepError = 'Full name is required.'; return false; }
                if (!this.form.email || !this.form.email.includes('@')) { this.stepError = 'A valid email address is required.'; return false; }
                const phoneErr = this.validatePhone(this.form.phone);
                if (phoneErr) { this.stepError = phoneErr; return false; }
            }
            if (this.currentStep === 2 && !this.form.reference_name) { this.stepError = 'Please provide a reference name.'; return false; }
            if (this.currentStep === 3) {
                if (!this.form.is_christian) { this.stepError = 'Please answer the faith question.'; return false; }
                if (!this.form.personal_testimony) { this.stepError = 'Personal testimony is required.'; return false; }
                if (!this.form.reason_to_join) { this.stepError = 'Please share why you want to join.'; return false; }
            }
            return true;
        },
        nextStep() { if (this.validateStep()) this.currentStep++; },
        prevStep() { this.stepError = ''; this.currentStep--; },
        onPhotoSelect(event) { const file = event.target.files[0]; if (file) this.uploadPhoto(file); },
        onPhotoDrop(event) { this.photoDragging = false; const file = event.dataTransfer.files[0]; if (file) this.uploadPhoto(file); },
        removePhoto() { this.photoPreview = null; this.form_photo_filename = null; this.$refs.photoInput.value = ''; },
        async uploadPhoto(file) {
            const allowed = ['image/jpeg','image/jpg','image/png','image/gif','image/webp'];
            if (!allowed.includes(file.type)) { this.photoError = 'Invalid file type. Use JPG or PNG.'; return; }
            if (file.size > 5 * 1024 * 1024) { this.photoError = 'File too large. Max 5 MB.'; return; }
            this.photoError = ''; this.photoUploading = true;
            const reader = new FileReader(); reader.onload = (e) => { this.photoPreview = e.target.result; }; reader.readAsDataURL(file);
            const fd = new FormData(); fd.append('photo', file);
            try {
                const res = await axios.post('/upload/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                this.form_photo_filename = res.data.filename;
            } catch (e) { this.photoError = e.response?.data?.error || 'Upload failed.'; this.photoPreview = null; }
            finally { this.photoUploading = false; }
        },
        async submitApplication() {
            if (!this.form.agrees_to_statement) { this.stepError = 'You must agree to the statement of faith.'; return; }
            this.submitting = true; this.submitError = '';
            try {
                const res = await axios.post('/apply', { ...this.form, photo_filename: this.form_photo_filename });
                this.submittedId = res.data.application_id; this.submittedName = this.form.full_name;
                this.submittedEmail = this.form.email; this.submitted = true; window.scrollTo(0, 0);
            } catch (e) { this.submitError = e.response?.data?.error || 'Submission failed. Please try again.'; }
            finally { this.submitting = false; }
        }
    }
}