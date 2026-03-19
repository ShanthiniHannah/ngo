export default {
    template: `
    <div class="apply-page">
        <div class="apply-hero" style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #8b5cf6 100%);">
            <div class="apply-hero-inner">
                <div class="apply-logo">🌟</div>
                <h1>Beneficiary Registration</h1>
                <p>Register to receive <strong>support and care</strong> from our NGO community</p>
            </div>
        </div>

        <div class="apply-container" v-if="submitted">
            <div class="success-card glass-card">
                <div class="success-icon">✅</div>
                <h2>Registration Submitted!</h2>
                <p>Thank you, <strong>{{ submittedName }}</strong>! Your registration <strong>#{{ submittedId }}</strong> has been received.</p>
                <div class="success-info">
                    <p>📧 A confirmation email has been sent to <strong>{{ submittedEmail }}</strong></p>
                    <p>⏱️ Our team will review your request within <strong>2–3 business days</strong>.</p>
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

                <!-- Step 0: Personal Information -->
                <div v-if="currentStep === 0">
                    <h2>👤 Personal Information</h2>
                    <p class="step-desc">Tell us about yourself so we can serve you better</p>
                    <div class="form-group" style="margin-bottom:1.5rem;">
                        <label>Profile Photo <small style="color:#64748b;">(JPG/PNG, max 5MB)</small></label>
                        <div class="photo-upload-box"
                            :class="{'photo-upload-box--hover': photoDragging}"
                            @dragover.prevent="photoDragging=true" @dragleave="photoDragging=false"
                            @drop.prevent="onPhotoDrop($event)" @click="$refs.photoInput.click()"
                            style="border:2px dashed #fbbf24;border-radius:16px;padding:1.5rem;text-align:center;cursor:pointer;transition:all .2s;background:rgba(251,191,36,.04);">
                            <input ref="photoInput" type="file" accept="image/*" style="display:none" @change="onPhotoSelect">
                            <div v-if="!photoPreview"><div style="font-size:2.5rem;">📷</div><p style="margin:.5rem 0 0;color:#64748b;font-size:.9rem;">Click or drag & drop a photo here</p></div>
                            <div v-else style="position:relative;display:inline-block;">
                                <img :src="photoPreview" style="width:110px;height:110px;object-fit:cover;border-radius:50%;border:3px solid #f59e0b;">
                                <button type="button" @click.stop="removePhoto" style="position:absolute;top:-6px;right:-6px;background:#ef4444;color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:.8rem;">x</button>
                            </div>
                            <div v-if="photoUploading" style="margin-top:.5rem;color:#f59e0b;font-size:.85rem;">Uploading...</div>
                            <div v-if="photoError" style="margin-top:.5rem;color:#ef4444;font-size:.85rem;">{{ photoError }}</div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Full Name *</label><input type="text" v-model="form.full_name" required placeholder="Your complete name"></div>
                        <div class="form-group"><label>Email Address *</label><input type="email" v-model="form.email" required placeholder="your@email.com"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Phone Number * <small style="color:#64748b;">(10 digits)</small></label>
                            <input type="text" v-model="form.phone" placeholder="9876543210" maxlength="10" @input="onPhoneInput('phone', $event)">
                            <small v-if="phoneError" style="color:#ef4444;display:block;margin-top:4px;">{{ phoneError }}</small>
                        </div>
                        <div class="form-group"><label>Age *</label><input type="number" v-model="form.age" placeholder="e.g. 35" min="1" max="120"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Gender</label>
                            <select v-model="form.gender"><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option></select>
                        </div>
                        <div class="form-group">
                            <label>Marital Status</label>
                            <select v-model="form.marital_status"><option value="">Select</option><option>Single</option><option>Married</option><option>Widowed</option><option>Divorced</option></select>
                        </div>
                    </div>
                    <div class="form-group"><label>Home Address *</label><input type="text" v-model="form.address" placeholder="Street, City, State, PIN Code"></div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Government ID Type</label>
                            <select v-model="form.id_proof_type"><option value="">Select</option><option>Aadhaar Card</option><option>Ration Card</option><option>Voter ID</option><option>Passport</option><option>Birth Certificate</option></select>
                        </div>
                        <div class="form-group"><label>ID Number</label><input type="text" v-model="form.id_proof_number" placeholder="ID document number"></div>
                    </div>
                    <div v-if="stepError" class="error-box">{{ stepError }}</div>
                </div>

                <!-- Step 1: Needs & Family Background -->
                <div v-if="currentStep === 1">
                    <h2>🏠 Needs & Family Background</h2>
                    <p class="step-desc">Help us understand your situation so we can provide the right support</p>
                    <div class="form-group">
                        <label>Nature of Needs / Assistance Required *</label>
                        <div class="checkbox-grid">
                            <label class="check-option" v-for="need in needOptions" :key="need">
                                <input type="checkbox" :value="need" v-model="form.needs_list"><span>{{ need }}</span>
                            </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Brief Description of Your Situation *</label>
                        <textarea v-model="form.situation_description" rows="3" placeholder="Please describe your current situation and why you are seeking assistance..."></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Number of Dependants</label><input type="number" v-model="form.num_dependants" placeholder="e.g. 3" min="0"></div>
                        <div class="form-group">
                            <label>Monthly Household Income</label>
                            <select v-model="form.income_range">
                                <option value="">Select</option><option>No income</option><option>Below 5,000</option>
                                <option>5,000 to 15,000</option><option>15,000 to 30,000</option><option>Above 30,000</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Any Medical Conditions or Disabilities?</label>
                        <textarea v-model="form.medical_conditions" rows="2" placeholder="Please mention any chronic illnesses, disabilities, or special medical needs..."></textarea>
                    </div>
                    <div class="form-group">
                        <label class="label-row">Do you currently receive any government welfare support?
                            <div class="radio-group">
                                <label class="radio-label"><input type="radio" v-model="form.govt_support" value="Yes"> Yes</label>
                                <label class="radio-label"><input type="radio" v-model="form.govt_support" value="No"> No</label>
                            </div>
                        </label>
                    </div>
                    <div class="form-group" v-if="form.govt_support === 'Yes'">
                        <label>Please specify the scheme / support received</label>
                        <input type="text" v-model="form.govt_support_details" placeholder="e.g. PM Awas Yojana, Ration Card benefits...">
                    </div>
                    <div class="form-group">
                        <label>Emergency Contact Phone * <small style="color:#64748b;">(10 digits)</small></label>
                        <input type="text" v-model="form.emergency_contact_phone" placeholder="9876543210" maxlength="10" @input="onPhoneInput('emergency_contact_phone', $event)">
                        <small v-if="emergencyPhoneError" style="color:#ef4444;display:block;margin-top:4px;">{{ emergencyPhoneError }}</small>
                    </div>
                    <div class="form-group">
                        <label>Relationship to Emergency Contact</label>
                        <select v-model="form.emergency_contact_relation">
                            <option value="">Select</option>
                            <option>Spouse</option><option>Parent</option><option>Child</option>
                            <option>Sibling</option><option>Friend</option><option>Neighbour</option>
                            <option>Church Member</option><option>Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Church / Community Group (if any)</label>
                        <input type="text" v-model="form.church_name" placeholder="Name of your local church or community group">
                    </div>
                    <div v-if="stepError" class="error-box">{{ stepError }}</div>
                </div>

                <!-- Step 2: Review & Submit -->
                <div v-if="currentStep === 2">
                    <h2>📄 Review & Confirm</h2>
                    <p class="step-desc">Please review your information before submitting your registration</p>
                    <div class="review-section">
                        <div class="review-badge" style="background:linear-gradient(135deg,#f59e0b,#ef4444);color:white;padding:8px 18px;border-radius:20px;display:inline-block;font-weight:600;margin-bottom:1rem;">
                            🌟 Beneficiary Registration
                        </div>
                    </div>
                    <div class="review-grid">
                        <div class="review-item"><span class="rl">Full Name</span><span class="rv">{{ form.full_name }}</span></div>
                        <div class="review-item"><span class="rl">Email</span><span class="rv">{{ form.email }}</span></div>
                        <div class="review-item"><span class="rl">Phone</span><span class="rv">{{ form.phone }}</span></div>
                        <div class="review-item"><span class="rl">Age / Gender</span><span class="rv">{{ form.age || '—' }} / {{ form.gender || '—' }}</span></div>
                        <div class="review-item"><span class="rl">Address</span><span class="rv">{{ form.address || '—' }}</span></div>
                        <div class="review-item"><span class="rl">Needs</span><span class="rv">{{ form.needs_list.join(', ') || '—' }}</span></div>
                        <div class="review-item"><span class="rl">Dependants</span><span class="rv">{{ form.num_dependants || 0 }}</span></div>
                        <div class="review-item"><span class="rl">Income Range</span><span class="rv">{{ form.income_range || '—' }}</span></div>
                        <div class="review-item"><span class="rl">Emergency Phone</span><span class="rv">{{ form.emergency_contact_phone }}</span></div>
                    </div>
                    <div class="faith-statement" style="margin-top:1.5rem;">
                        <div class="declaration-header">📜 Declaration & Consent</div>
                        <ol class="declaration-list">
                            <li><strong>Truthfulness:</strong> I confirm that all the information I have provided is true, accurate, and complete to the best of my knowledge.</li>
                            <li><strong>Verification Consent:</strong> I give consent to this NGO to verify the information provided, including conducting home visits or contacting my references.</li>
                            <li><strong>Data Privacy:</strong> I understand that my personal information will be stored securely and used only for providing support services.</li>
                            <li><strong>Support Conditions:</strong> I acknowledge that approval does not guarantee any specific form of assistance.</li>
                            <li><strong>Updates:</strong> I agree to notify the NGO of any significant changes in my situation.</li>
                        </ol>
                        <label class="faith-check-label" style="margin-top:1rem">
                            <input type="checkbox" v-model="form.agrees_to_terms">
                            <span><strong>I have read, understood, and agree</strong> to the above declaration.</span>
                        </label>
                    </div>
                    <div v-if="stepError" class="error-box">{{ stepError }}</div>
                    <div v-if="submitError" class="error-box">{{ submitError }}</div>
                </div>

                <!-- Navigation -->
                <div class="form-nav">
                    <button class="btn btn-secondary" @click="prevStep" v-if="currentStep > 0">← Back</button>
                    <div style="flex:1"></div>
                    <button class="btn btn-primary" v-if="currentStep < 2" @click="nextStep">
                        {{ currentStep === 0 ? 'Next: Needs & Family →' : 'Review & Submit →' }}
                    </button>
                    <button class="btn btn-primary" v-else @click="submitRegistration"
                            :disabled="submitting || !form.agrees_to_terms"
                            style="background:linear-gradient(135deg,#f59e0b,#ef4444);">
                        {{ submitting ? 'Submitting...' : '✅ Submit Registration' }}
                    </button>
                </div>
            </div>
            <p class="login-link">Already registered? <router-link to="/login">Sign in here</router-link></p>
        </div>
    </div>
    `,
    data() {
        return {
            currentStep: 0, submitted: false, submitting: false,
            submittedId: null, submittedName: '', submittedEmail: '',
            stepError: '', submitError: '', phoneError: '', emergencyPhoneError: '',
            steps: ['Personal Info', 'Needs & Family', 'Review & Submit'],
            photoPreview: null, photoDragging: false, photoUploading: false, photoError: '',
            form_photo_filename: null,
            needOptions: ['Food & Nutrition','Medical Assistance','Education Support','Shelter / Housing','Clothing','Financial Aid','Counselling / Mental Health','Elderly Care','Child Care','Vocational Training','Legal Aid','Other'],
            form: {
                full_name: '', email: '', phone: '', age: null, gender: '', marital_status: '', address: '',
                id_proof_type: '', id_proof_number: '', needs_list: [], situation_description: '',
                num_dependants: 0, income_range: '', medical_conditions: '', govt_support: 'No',
                govt_support_details: '', emergency_contact_phone: '', emergency_contact_relation: '',
                church_name: '', agrees_to_terms: false
            }
        };
    },
    methods: {
        onPhoneInput(field, event) {
            this.form[field] = event.target.value.replace(/\D/g, '').slice(0, 10);
            if (field === 'phone') this.phoneError = '';
            if (field === 'emergency_contact_phone') this.emergencyPhoneError = '';
        },
        validatePhone(value) {
            if (!value) return 'Phone number is required.';
            if (!/^\d{10}$/.test(value)) return 'Phone number must be exactly 10 digits.';
            return '';
        },
        validateStep() {
            this.stepError = '';
            if (this.currentStep === 0) {
                if (!this.form.full_name) { this.stepError = 'Full name is required.'; return false; }
                if (!this.form.email || !this.form.email.includes('@')) { this.stepError = 'A valid email address is required.'; return false; }
                const pe = this.validatePhone(this.form.phone);
                if (pe) { this.phoneError = pe; this.stepError = pe; return false; }
                if (!this.form.age) { this.stepError = 'Age is required.'; return false; }
                if (!this.form.address) { this.stepError = 'Home address is required.'; return false; }
            }
            if (this.currentStep === 1) {
                if (this.form.needs_list.length === 0) { this.stepError = 'Please select at least one type of assistance needed.'; return false; }
                if (!this.form.situation_description) { this.stepError = 'Please briefly describe your situation.'; return false; }
                const ee = this.validatePhone(this.form.emergency_contact_phone);
                if (ee) { this.emergencyPhoneError = ee; this.stepError = 'Emergency contact: ' + ee; return false; }
            }
            if (this.currentStep === 2 && !this.form.agrees_to_terms) { this.stepError = 'You must agree to the declaration to submit.'; return false; }
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
        async submitRegistration() {
            if (!this.validateStep()) return;
            this.submitting = true; this.submitError = '';
            const payload = { ...this.form, needs: this.form.needs_list.join(', '), photo_filename: this.form_photo_filename };
            try {
                const res = await axios.post('/apply/beneficiary', payload);
                this.submittedId = res.data.registration_id; this.submittedName = this.form.full_name;
                this.submittedEmail = this.form.email; this.submitted = true; window.scrollTo(0, 0);
            } catch (e) { this.submitError = e.response?.data?.error || 'Submission failed. Please try again.'; }
            finally { this.submitting = false; }
        }
    }
}