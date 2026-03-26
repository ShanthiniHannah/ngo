import { store } from '../store.js';

export default {
    template: `
    <div class="portal-wrapper">
        <daily-verse></daily-verse>
        <div class="portal-header">
            <h1>Welcome, {{ user.name }}</h1>
            <p class="subtitle">Volunteer Portal</p>
        </div>

        <div class="portal-grid">
            <!-- Profile Card -->
            <div class="card glass-card portal-card">
                <h3>My Volunteer Profile</h3>
                <div v-if="profile">
                    <p><strong>Volunteer ID:</strong> #{{ profile.volunteer_id }}</p>
                    <p><strong>Skills:</strong> {{ profile.skills || 'N/A' }}</p>
                    <p><strong>Availability:</strong> {{ profile.availability || 'N/A' }}</p>
                    <p><strong>Phone:</strong> {{ profile.phone || 'N/A' }}</p>
                </div>
                <div v-else class="loading-text">Loading profile...</div>
            </div>

            <!-- Active Projects -->
            <div class="card glass-card portal-card">
                <h3>Active Projects</h3>
                <ul class="portal-list" v-if="projects.length">
                    <li v-for="p in projects" :key="p.id">
                        <span>{{ p.name }}</span>
                        <span :class="'status-badge status-' + p.status.toLowerCase().replace(' ','-')">{{ p.status }}</span>
                    </li>
                </ul>
                <p v-else class="muted">No active projects.</p>
            </div>

            <!-- Assigned Beneficiaries -->
            <div class="card glass-card portal-card">
                <h3>My Beneficiaries</h3>
                <ul class="portal-list" v-if="beneficiaries.length">
                    <li v-for="b in beneficiaries" :key="b.id">
                        <span>{{ b.name }}</span>
                        <span :class="'status-badge status-' + b.status.toLowerCase()">{{ b.status }}</span>
                    </li>
                </ul>
                <p v-else class="muted">No beneficiaries assigned to you yet.</p>
            </div>

            <!-- Summary Card -->
            <div class="card glass-card portal-card">
                <h3>My Summary</h3>
                <p>Projects involved: <strong>{{ projects.length }}</strong></p>
                <p>Beneficiaries assigned: <strong>{{ beneficiaries.length }}</strong></p>
                <router-link to="/projects" class="btn btn-secondary">View All Projects</router-link>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            user: store.user,
            profile: null,
            projects: [],
            beneficiaries: []
        };
    },
    async mounted() {
        await Promise.all([this.fetchProfile(), this.fetchProjects(), this.fetchBeneficiaries()]);
    },
    methods: {
        async fetchProfile() {
            try {
                const res = await axios.get('/me');
                this.profile = res.data.profile || null;
            } catch (e) { console.error(e); }
        },
        async fetchProjects() {
            try {
                const res = await axios.get('/projects');
                this.projects = res.data.filter(p => p.status === 'In Progress' || p.status === 'Planned');
            } catch (e) { console.error(e); }
        },
        async fetchBeneficiaries() {
            try {
                const res = await axios.get('/beneficiary');
                // Show beneficiaries assigned to this volunteer
                if (this.profile && this.profile.volunteer_id) {
                    this.beneficiaries = res.data.filter(b => b.assigned_volunteer_id === this.profile.volunteer_id);
                } else {
                    this.beneficiaries = [];
                }
            } catch (e) { console.error(e); }
        }
    }
}
