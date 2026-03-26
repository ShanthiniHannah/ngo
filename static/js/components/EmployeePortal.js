import { store } from '../store.js';

export default {
    template: `
    <div class="portal-wrapper">
        <daily-verse></daily-verse>
        <div class="portal-header">
            <h1>Welcome, {{ user.name }}</h1>
            <p class="subtitle">Employee Self-Service Portal</p>
        </div>

        <!-- Profile Card -->
        <div class="portal-grid">
            <div class="card glass-card portal-card">
                <div class="card-icon"><i data-lucide="user"></i></div>
                <h3>My Profile</h3>
                <div v-if="profile">
                    <p><strong>Employee ID:</strong> #{{ profile.employee_id }}</p>
                    <p><strong>Age:</strong> {{ profile.age || 'N/A' }}</p>
                    <p><strong>Gender:</strong> {{ profile.gender || 'N/A' }}</p>
                    <p><strong>Address:</strong> {{ profile.address || 'N/A' }}</p>
                </div>
                <div v-else class="loading-text">Loading profile...</div>
            </div>

            <!-- Attendance Quick Card -->
            <div class="card glass-card portal-card">
                <div class="card-icon"><i data-lucide="calendar"></i></div>
                <h3>Today's Attendance</h3>
                <div v-if="todayAttendance">
                    <p>Status: <span :class="'status-badge status-' + todayAttendance.status.toLowerCase()">{{ todayAttendance.status }}</span><br>
                    Check In: {{ todayAttendance.check_in || 'Not yet' }}<br>
                    Check Out: {{ todayAttendance.check_out || 'Not yet' }}</p>
                    <button v-if="!todayAttendance.check_out && todayAttendance.check_in" class="btn btn-sm btn-secondary" @click="checkOut" style="margin-top:10px;">Check Out</button>
                </div>
                <div v-else>
                    <p class="muted">No attendance record for today yet.</p>
                    <button class="btn btn-sm btn-primary" @click="checkIn" style="margin-top:10px;">Check In Now</button>
                </div>
            </div>

            <!-- Leave Card -->
            <div class="card glass-card portal-card" style="grid-column: 1 / -1;">
                <div class="card-icon"><i data-lucide="calendar-off"></i></div>
                <h3>My Leave Requests</h3>
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <span class="muted">Pending: <strong>{{ pendingLeaves }}</strong></span>
                    <span class="muted">Approved: <strong>{{ approvedLeaves }}</strong></span>
                    <button class="btn btn-primary btn-sm" @click="showLeaveModal = true" style="margin-left:auto;">Apply for Leave</button>
                </div>
                <table v-if="leaves.length > 0" style="width:100%; border-collapse:collapse; margin-top:10px; font-size:0.9rem;">
                    <thead>
                        <tr style="border-bottom:1px solid #e2e8f0; text-align:left;">
                            <th style="padding:8px;">Start</th><th style="padding:8px;">End</th><th style="padding:8px;">Reason</th><th style="padding:8px;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="l in leaves" :key="l.id" style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:8px;">{{ l.start_date }}</td><td style="padding:8px;">{{ l.end_date }}</td><td style="padding:8px;">{{ l.reason }}</td>
                            <td style="padding:8px;"><span :class="'status-badge status-' + l.status.toLowerCase()">{{ l.status }}</span></td>
                        </tr>
                    </tbody>
                </table>
                <p v-else class="muted">No leave requests found.</p>
            </div>

            <!-- Projects Card -->
            <div class="card glass-card portal-card">
                <div class="card-icon"><i data-lucide="folder-kanban"></i></div>
                <h3>Active Projects</h3>
                <p><strong>{{ activeProjects }}</strong> projects currently running</p>
                <router-link to="/projects" class="btn btn-secondary">View Projects</router-link>
            </div>
        </div>

        <!-- Leave Modal -->
        <teleport to="body">
            <div class="modal" v-if="showLeaveModal" style="display:flex;">
                <div class="modal-content glass-card">
                    <span class="close" @click="showLeaveModal = false">&times;</span>
                    <h2>Apply for Leave</h2>
                    <form @submit.prevent="applyLeave">
                        <div class="form-group">
                            <label>Start Date</label>
                            <input type="date" v-model="newLeave.start_date" required>
                        </div>
                        <div class="form-group">
                            <label>End Date</label>
                            <input type="date" v-model="newLeave.end_date" required>
                        </div>
                        <div class="form-group">
                            <label>Reason</label>
                            <textarea v-model="newLeave.reason" rows="3" style="width:100%;border-radius:8px;padding:0.5rem;" required></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Submit</button>
                            <button type="button" class="btn btn-secondary" @click="showLeaveModal = false">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </teleport>
    </div>
    `,
    data() {
        return {
            user: store.user,
            profile: null,
            todayAttendance: null,
            leaves: [],
            activeProjects: 0,
            showLeaveModal: false,
            newLeave: { start_date: '', end_date: '', reason: '' }
        };
    },
    computed: {
        pendingLeaves()  { return this.leaves.filter(l => l.status === 'Pending').length; },
        approvedLeaves() { return this.leaves.filter(l => l.status === 'Approved').length; },
    },
    async mounted() {
        await Promise.all([this.fetchProfile(), this.fetchAttendance(), this.fetchLeaves(), this.fetchProjects()]);
        this.$nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
    },
    updated() {
        this.$nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
    },
    methods: {
        async fetchProfile() {
            try {
                const res = await axios.get('/me');
                this.profile = res.data.profile || null;
            } catch (e) { console.error(e); }
        },
        async fetchAttendance() {
            try {
                const res = await axios.get('/attendance');
                const today = new Date().toISOString().split('T')[0];
                this.todayAttendance = res.data.find(r => r.date === today && r.user_id === this.user.id) || null;
            } catch (e) { console.error(e); }
        },
        async fetchLeaves() {
            try {
                const res = await axios.get('/leave');
                this.leaves = res.data;
            } catch (e) { console.error(e); }
        },
        async fetchProjects() {
            try {
                const res = await axios.get('/projects');
                this.activeProjects = res.data.filter(p => p.status === 'In Progress').length;
            } catch (e) { console.error(e); }
        },
        async checkIn() {
            try {
                await axios.post('/attendance/checkin');
                window.toast('Checked in successfully', 'success');
                this.fetchAttendance();
            } catch (e) { window.toast(e.response?.data?.message || 'Failed to check in', 'error'); }
        },
        async checkOut() {
            try {
                await axios.post('/attendance/checkout');
                window.toast('Checked out successfully', 'success');
                this.fetchAttendance();
            } catch (e) { window.toast(e.response?.data?.message || 'Failed to check out', 'error'); }
        },
        async applyLeave() {
            try {
                await axios.post('/leave', this.newLeave);
                this.showLeaveModal = false;
                this.newLeave = { start_date: '', end_date: '', reason: '' };
                this.fetchLeaves();
            } catch (e) { window.toast('Failed to apply for leave', 'error'); }
        }
    }
}