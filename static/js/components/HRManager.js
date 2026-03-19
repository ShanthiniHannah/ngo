import { store } from '../store.js';

export default {
    template: `
    <div class="card glass-card">
        <div class="card-header">
            <h3>HR Management</h3>
            <div style="display: flex; gap: 1rem; align-items:center;">
                <button class="btn btn-sm" :class="activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'" @click="activeTab = 'attendance'">Attendance</button>
                <button class="btn btn-sm" :class="activeTab === 'leave' ? 'btn-primary' : 'btn-secondary'" @click="activeTab = 'leave'">Leave Requests</button>
                <button class="btn btn-sm" :class="activeTab === 'payroll' ? 'btn-primary' : 'btn-secondary'" @click="activeTab = 'payroll'">Payroll</button>
                <button v-if="isAdmin" class="btn btn-primary btn-sm" @click="showAddHRModal = true" style="margin-left:auto;">+ Add HR</button>
            </div>
        </div>

        <!-- Attendance Section -->
        <div v-if="activeTab === 'attendance'">
            <div style="margin-bottom: 1rem; display: flex; gap: 0.5rem;">
                <button class="btn btn-primary" @click="checkIn">Check In</button>
                <button class="btn btn-secondary" @click="checkOut">Check Out</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>User</th>
                            <th>Status</th>
                            <th>Check In</th>
                            <th>Check Out</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="attendanceRecords.length === 0">
                            <td colspan="5" style="text-align: center;">No attendance records found</td>
                        </tr>
                        <tr v-for="r in attendanceRecords" :key="r.id">
                            <td>{{ r.date }}</td>
                            <td>{{ r.user_name }}</td>
                            <td><span :class="'status-badge status-' + r.status.toLowerCase()">{{ r.status }}</span></td>
                            <td>{{ r.check_in || '-' }}</td>
                            <td>{{ r.check_out || '-' }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Leave Section -->
        <div v-if="activeTab === 'leave'">
            <button class="btn btn-primary" @click="showLeaveModal = true" style="margin-bottom: 1rem;">Apply for Leave</button>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th v-if="isAdminOrHR">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="leaveRequests.length === 0">
                            <td colspan="6" style="text-align: center;">No leave requests found</td>
                        </tr>
                        <tr v-for="l in leaveRequests" :key="l.id">
                            <td>{{ l.user_name }}</td>
                            <td>{{ l.start_date }}</td>
                            <td>{{ l.end_date }}</td>
                            <td>{{ l.reason }}</td>
                            <td><span :class="'status-badge status-' + l.status.toLowerCase()">{{ l.status }}</span></td>
                            <td v-if="isAdminOrHR">
                                <button v-if="l.status === 'Pending'" class="btn btn-sm btn-success" @click="updateLeave(l.id, 'Approved')">Approve</button>
                                <button v-if="l.status === 'Pending'" class="btn btn-sm btn-danger" @click="updateLeave(l.id, 'Rejected')" style="margin-left: 0.5rem;">Reject</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Payroll Section -->
        <div v-if="activeTab === 'payroll'">
            <div class="card" style="padding: 1rem; text-align: center;">
                <h4>My Payroll</h4>
                <p>Generate your latest payslip.</p>
                <button class="btn btn-primary" @click="generatePayslip">Download Payslip</button>
            </div>
        </div>

        <!-- Add HR Modal -->
        <teleport to="body">
            <div class="modal" v-if="showAddHRModal" style="display:flex;">
                <div class="modal-content glass-card" style="max-width:420px;">
                    <span class="close" @click="closeAddHR">&times;</span>
                    <h2>Add HR</h2>
                    <p style="color:#475569;font-size:0.9rem;">An activation email will be sent so they can set their own password.</p>
                    <div class="form-group" style="margin-top:1rem;">
                        <label>Full Name *</label>
                        <input type="text" v-model="newHR.name" placeholder="HR staff full name">
                    </div>
                    <div class="form-group">
                        <label>Email Address *</label>
                        <input type="email" v-model="newHR.email" placeholder="hr@example.com">
                    </div>
                    <div v-if="addHRError" class="error-box" style="margin-top:0.5rem;">{{ addHRError }}</div>
                    <div v-if="addHRSuccess" style="background:#f0fdf4;border-left:4px solid #059669;padding:12px;border-radius:8px;color:#065f46;margin-top:0.5rem;">{{ addHRSuccess }}</div>
                    <div class="form-actions" style="margin-top:1rem;">
                        <button class="btn btn-secondary" @click="closeAddHR">Cancel</button>
                        <button class="btn btn-primary" @click="submitAddHR" :disabled="addHRLoading">
                            {{ addHRLoading ? 'Sending...' : 'Create & Send Email' }}
                        </button>
                    </div>
                </div>
            </div>
        </teleport>

        <!-- Leave Modal -->
        <teleport to="body">
            <div class="modal" v-if="showLeaveModal" style="display: flex;">
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
                            <textarea v-model="newLeave.reason" rows="3" style="width: 100%; border-radius: 8px; padding: 0.5rem;" required></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Submit Application</button>
                        </div>
                    </form>
                </div>
            </div>
        </teleport>
    </div>
    `,
    data() {
        return {
            activeTab: 'attendance',
            attendanceRecords: [],
            leaveRequests: [],
            showLeaveModal: false,
            newLeave: { start_date: '', end_date: '', reason: '' },
            showAddHRModal: false,
            newHR: { name: '', email: '' },
            addHRLoading: false,
            addHRError: '',
            addHRSuccess: '',
            user: store.user
        }
    },
    computed: {
        isAdmin() {
            return this.user && this.user.role === 'Admin';
        },
        isAdminOrHR() {
            return this.user && (this.user.role === 'Admin' || this.user.role === 'HR');
        }
    },
    mounted() {
        this.fetchAttendance();
        this.fetchLeaves();
    },
    methods: {
        async fetchAttendance() {
            try {
                const response = await axios.get('/attendance');
                this.attendanceRecords = response.data;
            } catch (error) { console.error("Error fetching attendance", error); }
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
        async fetchLeaves() {
            try {
                const response = await axios.get('/leave');
                this.leaveRequests = response.data;
            } catch (error) { console.error("Error fetching leaves", error); }
        },
        async applyLeave() {
            try {
                await axios.post('/leave', this.newLeave);
                this.showLeaveModal = false;
                this.newLeave = { start_date: '', end_date: '', reason: '' };
                this.fetchLeaves();
                window.toast('Leave application submitted', 'success');
            } catch (error) { window.toast('Failed to apply for leave', 'error'); }
        },
        async updateLeave(id, status) {
            try {
                await axios.put(`/leave/${id}/status`, { status });
                this.fetchLeaves();
                window.toast(`Leave ${status}`, 'success');
            } catch (error) { window.toast('Failed to update leave status', 'error'); }
        },
        async generatePayslip() {
            try {
                const response = await axios.get(`/salary/${this.user.id}`);
                const blob = new Blob([response.data.content], { type: 'text/plain' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `payslip_${this.user.id}.txt`;
                link.click();
                window.toast('Payslip downloaded!', 'success');
            } catch (error) { window.toast('Failed to generate payslip', 'error'); }
        },
        closeAddHR() {
            this.showAddHRModal = false;
            this.newHR = { name: '', email: '' };
            this.addHRError = '';
            this.addHRSuccess = '';
        },
        async submitAddHR() {
            this.addHRError = ''; this.addHRSuccess = '';
            if (!this.newHR.name) { this.addHRError = 'Name is required.'; return; }
            if (!this.newHR.email || !this.newHR.email.includes('@')) { this.addHRError = 'Valid email is required.'; return; }
            this.addHRLoading = true;
            try {
                const res = await axios.post('/hr', this.newHR);
                this.addHRSuccess = res.data.message;
                this.newHR = { name: '', email: '' };
                setTimeout(() => this.closeAddHR(), 2500);
            } catch (e) {
                this.addHRError = e.response?.data?.error || 'Failed to create HR account.';
            } finally { this.addHRLoading = false; }
        }
    }
}