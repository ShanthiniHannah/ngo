import { store } from '../store.js';

export default {
    template: `
    <div class="portal-wrapper">
        <div class="portal-header">
            <h1>❤️ Welcome, {{ user.name }}</h1>
            <p class="subtitle">Donor Portal — Thank you for your generosity!</p>
        </div>

        <div class="portal-grid">
            <!-- Donor Profile -->
            <div class="card glass-card portal-card">
                <div class="card-icon">❤️</div>
                <h3>My Donor Profile</h3>
                <div v-if="profile">
                    <p><strong>Donor ID:</strong> #{{ profile.donor_id }}</p>
                    <p><strong>Total Donated:</strong> ₹{{ (profile.donation_amount || 0).toLocaleString() }}</p>
                    <p><strong>Phone:</strong> {{ profile.phone || 'N/A' }}</p>
                </div>
                <div v-else class="loading-text">Loading profile...</div>
            </div>

            <!-- My Sponsorships -->
            <div class="card glass-card portal-card">
                <div class="card-icon">💰</div>
                <h3>My Sponsorships</h3>
                <ul class="portal-list" v-if="sponsorships.length">
                    <li v-for="s in sponsorships" :key="s.id">
                        <span>{{ s.sponsor_name }}</span>
                        <span class="amount-badge">₹{{ s.amount.toLocaleString() }}</span>
                    </li>
                </ul>
                <p v-else class="muted">No sponsorships recorded yet.</p>
            </div>

            <!-- Supported Projects -->
            <div class="card glass-card portal-card">
                <div class="card-icon">🚀</div>
                <h3>Projects Being Supported</h3>
                <ul class="portal-list" v-if="projects.length">
                    <li v-for="p in projects" :key="p.id">
                        <span>{{ p.name }}</span>
                        <span :class="'status-badge status-' + p.status.toLowerCase().replace(' ','-')">{{ p.status }}</span>
                    </li>
                </ul>
                <p v-else class="muted">No active projects to display.</p>
            </div>

            <!-- Impact Summary -->
            <div class="card glass-card portal-card">
                <div class="card-icon">📊</div>
                <h3>Your Impact</h3>
                <p>Total Donations: <strong>{{ sponsorships.length }}</strong></p>
                <p>Total Amount: <strong>₹{{ totalDonated.toLocaleString() }}</strong></p>
                <p>Projects Supported: <strong>{{ projects.length }}</strong></p>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            user: store.user,
            profile: null,
            sponsorships: [],
            projects: []
        };
    },
    computed: {
        totalDonated() {
            return this.sponsorships.reduce((sum, s) => sum + (s.amount || 0), 0);
        }
    },
    async mounted() {
        await Promise.all([this.fetchProfile(), this.fetchSponsorships(), this.fetchProjects()]);
    },
    methods: {
        async fetchProfile() {
            try {
                const res = await axios.get('/me');
                this.profile = res.data.profile || null;
            } catch (e) { console.error(e); }
        },
        async fetchSponsorships() {
            try {
                const res = await axios.get('/sponsorships');
                // Filter sponsorships where donor_id matches our profile
                if (this.profile && this.profile.donor_id) {
                    this.sponsorships = res.data.filter(s => s.donor_id === this.profile.donor_id);
                } else {
                    this.sponsorships = res.data;
                }
            } catch (e) { console.error(e); }
        },
        async fetchProjects() {
            try {
                const res = await axios.get('/projects');
                this.projects = res.data.filter(p => p.status !== 'Completed');
            } catch (e) { console.error(e); }
        }
    }
}
