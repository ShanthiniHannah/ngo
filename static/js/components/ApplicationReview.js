import { store } from '../store.js';

export default {
    template: `
    <div class="manager-page">
        <div class="page-header">
            <div>
                <h2>📝 Application Review</h2>
                <p class="page-subtitle">Review membership applications, schedule interviews, and send decisions</p>
            </div>
            <div style="display:flex;gap:0.75rem;align-items:center;">
                <select v-model="typeFilter" class="filter-select" @change="fetch">
                    <option value="">All Types</option>
                    <option value="Volunteer">Volunteer</option>
                    <option value="Donor">Donor</option>
                </select>
                <select v-model="statusFilter" class="filter-select" @change="fetch">
                    <option value="">All Statuses</option>
                    <option>Pending</option>
                    <option>Under Review</option>
                    <option>Interview Scheduled</option>
                    <option>Approved</option>
                    <option>Rejected</option>
                </select>
            </div>
        </div>

        <!-- Stats -->
        <div class="stats-bar">
            <div class="stat-chip">Total: <strong>{{ applications.length }}</strong></div>
            <div class="stat-chip warning">Pending: <strong>{{ count('Pending') }}</strong></div>
            <div class="stat-chip">Reviewing: <strong>{{ count('Under Review') }}</strong></div>
            <div class="stat-chip">Interview: <strong>{{ count('Interview Scheduled') }}</strong></div>
            <div class="stat-chip success">Approved: <strong>{{ count('Approved') }}</strong></div>
            <div class="stat-chip" style="border-color:#fecaca;background:#fee2e2;color:#991b1b">Rejected: <strong>{{ count('Rejected') }}</strong></div>
        </div>

        <div class="search-bar">
            <input v-model="search" type="text" placeholder="🔍  Search by name or email..." class="search-input">
        </div>

        <div v-if="loading" class="loading-state"><div class="spinner"></div> Loading applications...</div>

        <!-- Table -->
        <div class="card glass-card table-card" v-else>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th><th>Type</th><th>Name</th><th>Email</th><th>Church</th><th>Submitted</th><th>Status</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="filtered.length === 0"><td colspan="8" class="empty-row">No applications found</td></tr>
                        <tr v-for="a in filtered" :key="a.id">
                            <td><span class="id-badge">#{{ a.id }}</span></td>
                            <td>
                                <span :class="a.application_type === 'Volunteer' ? 'role-volunteer role-badge' : 'role-donor role-badge'">
                                    {{ a.application_type }}
                                </span>
                            </td>
                            <td><strong>{{ a.full_name }}</strong></td>
                            <td class="muted-cell">{{ a.email }}</td>
                            <td class="muted-cell">{{ a.church_name || '—' }}</td>
                            <td class="muted-cell">{{ a.submitted_at }}</td>
                            <td>
                                <span :class="'status-badge ' + statusClass(a.status)">{{ a.status }}</span>
                            </td>
                            <td>
                                <div class="action-btns">
                                    <button class="btn btn-sm btn-secondary" @click="viewDetails(a.id)" title="View Full Application">👁️</button>
                                    <button class="btn btn-sm btn-primary" @click="openInterview(a)" title="Schedule Interview"
                                        v-if="['Pending','Under Review'].includes(a.status)">📅</button>
                                    <button class="btn btn-sm" style="background:#d1fae5;color:#065f46" @click="setStatus(a,'Approved')"
                                        v-if="a.status === 'Interview Scheduled'" title="Approve">✅</button>
                                    <button class="btn btn-sm btn-danger" @click="openReject(a)"
                                        v-if="!['Rejected','Approved'].includes(a.status)" title="Reject">❌</button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- View Application Modal -->
        <teleport to="body">
            <div class="modal" v-if="viewApp" style="display:flex;">
                <div class="modal-content glass-card" style="max-width:700px;">
                    <span class="close" @click="viewApp=null">&times;</span>
                    <div v-if="loadingApp" class="loading-state"><div class="spinner"></div> Loading...</div>
                    <div v-else-if="viewApp.id">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                            <h2>Application #{{ viewApp.id }} — {{ viewApp.full_name }}</h2>
                            <span :class="'status-badge ' + statusClass(viewApp.status)">{{ viewApp.status }}</span>
                        </div>

                        <div class="app-section">
                            <h4>👤 Personal Information</h4>
                            <div class="app-grid">
                                <div class="app-field"><span class="afl">Type</span><span class="afv">{{ viewApp.application_type }}</span></div>
                                <div class="app-field"><span class="afl">Email</span><span class="afv">{{ viewApp.email }}</span></div>
                                <div class="app-field"><span class="afl">Phone</span><span class="afv">{{ viewApp.phone }}</span></div>
                                <div class="app-field"><span class="afl">Age / Gender</span><span class="afv">{{ viewApp.age }} / {{ viewApp.gender }}</span></div>
                                <div class="app-field"><span class="afl">Occupation</span><span class="afv">{{ viewApp.occupation }}</span></div>
                                <div class="app-field"><span class="afl">ID Proof</span><span class="afv">{{ viewApp.id_proof_type }}: {{ viewApp.id_proof_number }}</span></div>
                                <div class="app-field full"><span class="afl">Address</span><span class="afv">{{ viewApp.address }}</span></div>
                            </div>
                        </div>

                        <div class="app-section">
                            <h4>📋 Background</h4>
                            <div class="app-grid">
                                <div class="app-field"><span class="afl">Education</span><span class="afv">{{ viewApp.education }}</span></div>
                                <div class="app-field"><span class="afl">Criminal Record</span>
                                    <span :class="viewApp.criminal_record === 'Yes' ? 'status-badge status-absent' : 'status-badge status-approved'">{{ viewApp.criminal_record }}</span>
                                </div>
                                <div class="app-field"><span class="afl">Skills</span><span class="afv">{{ viewApp.skills }}</span></div>
                                <div class="app-field"><span class="afl">Reference</span><span class="afv">{{ viewApp.reference_name }} — {{ viewApp.reference_contact }}</span></div>
                                <div class="app-field full"><span class="afl">Work Experience</span><span class="afv">{{ viewApp.work_experience }}</span></div>
                                <div class="app-field full"><span class="afl">NGO Experience</span><span class="afv">{{ viewApp.previous_ngo_experience }}</span></div>
                            </div>
                        </div>

                        <div class="app-section">
                            <h4>✝️ Spiritual Life</h4>
                            <div class="app-grid">
                                <div class="app-field"><span class="afl">Christian</span><span class="afv">{{ viewApp.is_christian }}</span></div>
                                <div class="app-field"><span class="afl">Years as Believer</span><span class="afv">{{ viewApp.years_as_believer }}</span></div>
                                <div class="app-field"><span class="afl">Church</span><span class="afv">{{ viewApp.church_name }}, {{ viewApp.church_location }}</span></div>
                                <div class="app-field"><span class="afl">Pastor</span><span class="afv">{{ viewApp.pastor_name }} — {{ viewApp.pastor_contact }}</span></div>
                                <div class="app-field"><span class="afl">Spiritual Gifts</span><span class="afv">{{ viewApp.spiritual_gifts }}</span></div>
                                <div class="app-field full"><span class="afl">Ministry Involvement</span><span class="afv">{{ viewApp.ministry_involvement }}</span></div>
                                <div class="app-field full testimony"><span class="afl">Personal Testimony</span><span class="afv">{{ viewApp.personal_testimony }}</span></div>
                                <div class="app-field full"><span class="afl">Reason to Join</span><span class="afv">{{ viewApp.reason_to_join }}</span></div>
                            </div>
                        </div>

                        <div class="app-section" v-if="viewApp.interview_date">
                            <h4>📅 Interview</h4>
                            <div class="app-grid">
                                <div class="app-field"><span class="afl">Scheduled</span><span class="afv">{{ viewApp.interview_date }}</span></div>
                                <div class="app-field full"><span class="afl">Notes</span><span class="afv">{{ viewApp.interview_notes }}</span></div>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button class="btn btn-secondary" @click="viewApp=null">Close</button>
                            <button class="btn btn-primary" @click="openInterview(viewApp); viewApp=null"
                                v-if="['Pending','Under Review'].includes(viewApp.status)">📅 Schedule Interview</button>
                        </div>
                    </div>
                </div>
            </div>
        </teleport>

        <!-- Schedule Interview Modal -->
        <teleport to="body">
            <div class="modal" v-if="interviewTarget" style="display:flex;">
                <div class="modal-content glass-card" style="max-width:450px;">
                    <span class="close" @click="interviewTarget=null">&times;</span>
                    <h2>📅 Schedule Interview</h2>
                    <p>Scheduling for <strong>{{ interviewTarget.full_name }}</strong> ({{ interviewTarget.application_type }}). An email will be sent to <strong>{{ interviewTarget.email }}</strong>.</p>
                    <form @submit.prevent="confirmInterview">
                        <div class="form-group" style="margin-top:1rem;">
                            <label>Interview Date & Time *</label>
                            <input type="datetime-local" v-model="interviewForm.date" :min="minInterviewDate" required>
                        </div>
                        <div class="form-group">
                            <label>Additional Notes / Location / Meeting Link</label>
                            <textarea v-model="interviewForm.notes" rows="3" placeholder="e.g. Google Meet link, Office address, What to bring..."></textarea>
                        </div>
                        <div v-if="formError" class="error-box">{{ formError }}</div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" @click="interviewTarget=null">Cancel</button>
                            <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? 'Sending...' : '📧 Confirm & Send Email' }}</button>
                        </div>
                    </form>
                </div>
            </div>
        </teleport>

        <!-- Reject Modal -->
        <teleport to="body">
            <div class="modal" v-if="rejectTarget" style="display:flex;">
                <div class="modal-content glass-card" style="max-width:420px;">
                    <span class="close" @click="rejectTarget=null">&times;</span>
                    <h2>❌ Reject Application</h2>
                    <p>Reject the application of <strong>{{ rejectTarget.full_name }}</strong>? They will receive a rejection email.</p>
                    <div class="form-group" style="margin-top:1rem;">
                        <label>Reason for Rejection (optional)</label>
                        <textarea v-model="rejectReason" rows="3" placeholder="e.g. Does not meet faith requirements, Incomplete background..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-secondary" @click="rejectTarget=null">Cancel</button>
                        <button class="btn btn-danger" @click="confirmReject">Confirm Rejection</button>
                    </div>
                </div>
            </div>
        </teleport>
    </div>
    `,
    data() {
        return {
            applications: [], loading: true, loadingApp: false, saving: false,
            search: '', typeFilter: '', statusFilter: '',
            viewApp: null, interviewTarget: null, rejectTarget: null, rejectReason: '',
            formError: '',
            interviewForm: { date: '', notes: '' }
        };
    },
    computed: {
        filtered() {
            const q = this.search.toLowerCase();
            return this.applications.filter(a =>
                (a.full_name || '').toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q)
            );
        },
        minInterviewDate() {
            const d = new Date();
            d.setDate(d.getDate() + 2);
            d.setSeconds(0, 0);
            return d.toISOString().slice(0, 16);
        },
        minInterviewDateDisplay() {
            const d = new Date();
            d.setDate(d.getDate() + 2);
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
    },
    mounted() { this.fetch(); },
    methods: {
        async fetch() {
            this.loading = true;
            const params = {};
            if (this.typeFilter) params.type = this.typeFilter;
            if (this.statusFilter) params.status = this.statusFilter;
            try { const r = await axios.get('/applications', { params }); this.applications = r.data; }
            catch (e) { window.toast('Failed to load applications', 'error'); }
            finally { this.loading = false; }
        },
        count(status) { return this.applications.filter(a => a.status === status).length; },
        statusClass(status) {
            const map = {
                'Pending': 'status-pending', 'Under Review': 'status-on-leave',
                'Interview Scheduled': 'status-in-progress', 'Approved': 'status-approved', 'Rejected': 'status-absent'
            };
            return map[status] || '';
        },
        async viewDetails(id) {
            this.viewApp = {}; this.loadingApp = true;
            try {
                const r = await axios.get('/applications/' + id);
                this.viewApp = r.data;
            } catch (e) { window.toast('Failed to load details', 'error'); this.viewApp = null; }
            finally { this.loadingApp = false; }
        },
        openInterview(a) {
            this.interviewTarget = a; this.formError = '';
            this.interviewForm = { date: '', notes: '' };
        },
        async confirmInterview() {
            if (!this.interviewForm.date) { this.formError = 'Date is required'; return; }
            if (this.interviewForm.date < this.minInterviewDate) {
                this.formError = `Interview must be at least 2 days from today (earliest: ${this.minInterviewDateDisplay})`;
                return;
            }
            this.saving = true; this.formError = '';
            try {
                await axios.post('/applications/' + this.interviewTarget.id + '/schedule-interview', {
                    interview_date: this.interviewForm.date, notes: this.interviewForm.notes
                });
                window.toast('Interview scheduled — email sent to ' + this.interviewTarget.email, 'success');
                this.interviewTarget = null; this.fetch();
            } catch (e) { this.formError = e.response?.data?.error || 'Failed'; }
            finally { this.saving = false; }
        },
        openReject(a) { this.rejectTarget = a; this.rejectReason = ''; },
        async confirmReject() {
            try {
                await axios.put('/applications/' + this.rejectTarget.id + '/status', {
                    status: 'Rejected', rejection_reason: this.rejectReason
                });
                window.toast('Application rejected — email sent', 'info');
                this.rejectTarget = null; this.fetch();
            } catch (e) { window.toast('Failed to reject', 'error'); }
        },
        async setStatus(a, status) {
            try {
                await axios.put('/applications/' + a.id + '/status', { status });
                window.toast('Application ' + status + '!', 'success');
                this.fetch();
            } catch (e) { window.toast('Update failed', 'error'); }
        }
    }
}