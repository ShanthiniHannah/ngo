import { store } from '../store.js';

export default {
    template: `
    <div class="portal-wrapper">
        <div class="portal-header">
            <h1>🌟 Welcome, {{ user.name }}</h1>
            <p class="subtitle">Beneficiary Portal — We are here to help you</p>
        </div>

        <div class="portal-grid">
            <!-- My Status Card -->
            <div class="card glass-card portal-card">
                <div class="card-icon">🌟</div>
                <h3>My Application Status</h3>
                <div v-if="profile">
                    <p><strong>Beneficiary ID:</strong> #{{ profile.beneficiary_id }}</p>
                    <p><strong>Status:</strong>
                        <span :class="'status-badge status-' + profile.status.toLowerCase()">{{ profile.status }}</span>
                    </p>
                    <p><strong>Needs Declared:</strong> {{ profile.needs || 'N/A' }}</p>
                    <p><strong>Age:</strong> {{ profile.age || 'N/A' }}</p>
                    <p><strong>Gender:</strong> {{ profile.gender || 'N/A' }}</p>
                </div>
                <div v-else class="loading-text">Loading profile...</div>
            </div>

            <!-- My Volunteer -->
            <div class="card glass-card portal-card">
                <div class="card-icon">🤝</div>
                <h3>My Assigned Volunteer</h3>
                <div v-if="assignedVolunteer">
                    <p><strong>Name:</strong> {{ assignedVolunteer.name }}</p>
                    <p><strong>Skills:</strong> {{ assignedVolunteer.skills || 'N/A' }}</p>
                    <p><strong>Availability:</strong> {{ assignedVolunteer.availability || 'N/A' }}</p>
                </div>
                <p v-else class="muted">No volunteer assigned yet. Our team will contact you soon.</p>
            </div>

            <!-- NGO Info -->
            <div class="card glass-card portal-card">
                <div class="card-icon">ℹ️</div>
                <h3>About Our NGO</h3>
                <p>We are committed to uplifting every individual in our community. Your case is our priority.</p>
                <p>For urgent needs, please contact your assigned volunteer or visit our office.</p>
            </div>

            <!-- Status Guide -->
            <div class="card glass-card portal-card">
                <div class="card-icon">📋</div>
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
            assignedVolunteer: null
        };
    },
    async mounted() {
        await this.fetchProfile();
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
        }
    }
}
