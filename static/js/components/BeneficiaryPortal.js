import { store } from '../store.js';

export default {
    template: `
    <div class="portal-wrapper">
        <daily-verse></daily-verse>
        <div class="portal-header">
            <h1>Welcome, {{ user.name }}</h1>
            <p class="subtitle">Beneficiary Portal — We are here to help you</p>
        </div>

        <div class="portal-grid">
            <!-- My Status Card -->
            <div class="card glass-card portal-card">
                <h3>My Application Status</h3>
                <div v-if="profile">
                    <p><strong>Beneficiary ID:</strong> #{{ profile.beneficiary_id }}</p>
                    <p><strong>Status:</strong>
                        <span :class="'status-badge status-' + profile.status.toLowerCase()">{{ profile.status }}</span>
                    </p>
                    <p><strong>Services:</strong> {{ profile.needs || 'N/A' }}</p>
                    <p><strong>Age:</strong> {{ profile.age || 'N/A' }}</p>
                    <p><strong>Gender:</strong> {{ profile.gender || 'N/A' }}</p>
                </div>
                <div v-else class="loading-text">Loading profile...</div>
            </div>

            <!-- My Volunteer -->
            <div class="card glass-card portal-card">
                <h3>My Assigned Volunteer</h3>
                <div v-if="assignedVolunteer">
                    <p><strong>Name:</strong> {{ assignedVolunteer.name }}</p>
                    <p><strong>Phone:</strong> {{ assignedVolunteer.phone || 'N/A' }}</p>
                    <p><strong>Skills:</strong> {{ assignedVolunteer.skills || 'N/A' }}</p>
                    <p><strong>Availability:</strong> {{ assignedVolunteer.availability || 'N/A' }}</p>
                </div>
                <p v-else class="muted">No volunteer assigned yet. Our team will contact you soon.</p>
            </div>

            <!-- Service Feedback Card -->
            <div class="card glass-card portal-card" v-if="assignedVolunteer" style="grid-column: 1 / -1;">
                <h3>Service Feedback</h3>
                <p class="muted" style="margin-bottom:0.75rem;">Help us ensure quality service — rate your volunteer's work</p>

                <div class="ack-card">
                    <div class="form-group">
                        <label>Rating *</label>
                        <div class="star-rating">
                            <button v-for="s in 5" :key="s" type="button"
                                :class="['star-btn', s <= ackForm.rating ? 'star-btn--filled' : '']"
                                @click="ackForm.rating = s"
                                @mouseenter="hoverRating = s"
                                @mouseleave="hoverRating = 0">
                                {{ (hoverRating || ackForm.rating) >= s ? '★' : '☆' }}
                            </button>
                        </div>
                    </div>
                    <div class="form-row" style="margin-top:0.75rem;">
                        <div class="form-group">
                            <label>Service Type</label>
                            <select v-model="ackForm.service_type">
                                <option value="">Select service</option>
                                <option v-for="svc in myServices" :key="svc">{{ svc }}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select v-model="ackForm.status">
                                <option>Satisfied</option>
                                <option>Needs Improvement</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group" style="margin-top:0.5rem;">
                        <label>Feedback (optional)</label>
                        <textarea v-model="ackForm.feedback" rows="2" placeholder="Share your experience with the volunteer's service..." style="width:100%;border-radius:8px;padding:0.5rem;border:1px solid #e2e8f0;"></textarea>
                    </div>
                    <button class="btn btn-primary" @click="submitAck" :disabled="ackSubmitting || !ackForm.rating" style="margin-top:0.5rem;">
                        {{ ackSubmitting ? 'Submitting...' : 'Submit Feedback' }}
                    </button>
                    <div v-if="ackError" class="lp-error" style="margin-top:0.5rem;">{{ ackError }}</div>
                    <div v-if="ackSuccess" class="lp-success" style="margin-top:0.5rem;">{{ ackSuccess }}</div>
                </div>

                <!-- Past Acknowledgments -->
                <div v-if="pastAcks.length > 0" class="ack-history" style="margin-top:1.5rem;">
                    <h4 style="margin-bottom:0.5rem;">Your Past Feedback</h4>
                    <div v-for="a in pastAcks" :key="a.id" class="ack-item">
                        <div>
                            <div class="ack-stars">{{ '★'.repeat(a.rating) }}{{ '☆'.repeat(5 - a.rating) }}</div>
                        </div>
                        <div style="flex:1;">
                            <div style="display:flex;gap:0.5rem;align-items:center;">
                                <span :class="['ack-status', a.status === 'Satisfied' ? 'ack-status--satisfied' : 'ack-status--needs-improvement']">{{ a.status }}</span>
                                <span v-if="a.service_type" style="font-size:0.8rem;color:#64748b;">{{ a.service_type }}</span>
                            </div>
                            <div v-if="a.feedback" class="ack-feedback">{{ a.feedback }}</div>
                            <div class="ack-meta">{{ a.acknowledged_at }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Status Guide -->
            <div class="card glass-card portal-card">
                <h3>Status Guide</h3>
                <p><span class="status-badge status-pending">Pending</span> — Under review</p>
                <p><span class="status-badge status-approved">Approved</span> — Accepted, help incoming</p>
                <p><span class="status-badge status-served">Served</span> — Support delivered</p>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            user: store.user,
            profile: null,
            assignedVolunteer: null,
            hoverRating: 0,
            ackForm: { rating: 0, feedback: '', service_type: '', status: 'Satisfied' },
            ackSubmitting: false, ackError: '', ackSuccess: '',
            pastAcks: []
        };
    },
    computed: {
        myServices() {
            if (!this.profile || !this.profile.needs) return [];
            return this.profile.needs.split(',').map(s => s.trim()).filter(Boolean);
        }
    },
    async mounted() {
        await this.fetchProfile();
        await this.fetchAcks();
    },
    methods: {
        async fetchProfile() {
            try {
                const res = await axios.get('/me');
                this.profile = res.data.profile || null;
                if (this.profile && this.profile.beneficiary_id) {
                    await this.fetchAssignedVolunteer();
                }
            } catch (e) { console.error(e); }
        },
        async fetchAssignedVolunteer() {
            try {
                const res = await axios.get('/beneficiary');
                const myRecord = res.data.find(b => b.id === this.profile.beneficiary_id);
                if (myRecord && myRecord.assigned_volunteer_id) {
                    const volRes = await axios.get('/volunteer');
                    this.assignedVolunteer = volRes.data.find(v => v.id === myRecord.assigned_volunteer_id) || null;
                }
            } catch (e) { console.error(e); }
        },
        async fetchAcks() {
            try {
                const res = await axios.get('/acknowledgments');
                this.pastAcks = res.data;
            } catch (e) { console.error(e); }
        },
        async submitAck() {
            if (!this.ackForm.rating) { this.ackError = 'Please select a rating.'; return; }
            this.ackSubmitting = true; this.ackError = ''; this.ackSuccess = '';
            try {
                await axios.post('/acknowledgment', this.ackForm);
                this.ackSuccess = 'Feedback submitted successfully. Thank you!';
                this.ackForm = { rating: 0, feedback: '', service_type: '', status: 'Satisfied' };
                this.hoverRating = 0;
                await this.fetchAcks();
            } catch (e) {
                this.ackError = e.response?.data?.error || 'Failed to submit feedback.';
            } finally { this.ackSubmitting = false; }
        }
    }
}
