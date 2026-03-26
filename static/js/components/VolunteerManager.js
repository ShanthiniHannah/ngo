import { store } from '../store.js';

export default {
    template: `
    <div class="manager-page">
        <div class="page-header">
            <div>
                <h2>{{ activeTab === 'volunteers' ? 'Volunteer Management' : 'Beneficiary Management' }}</h2>
                <p class="page-subtitle">{{ activeTab === 'volunteers' ? 'Manage community volunteers' : 'Track beneficiaries and their needs' }}</p>
            </div>
            <button class="btn btn-primary" @click="openAdd" v-if="isAdminOrHR">+ Add {{ activeTab === 'volunteers' ? 'Volunteer' : 'Beneficiary' }}</button>
        </div>

        <div class="tab-group">
            <button :class="activeTab === 'volunteers' ? 'tab-btn active' : 'tab-btn'" @click="activeTab='volunteers'">
                Volunteers <span class="tab-count">{{ volunteers.length }}</span>
            </button>
            <button :class="activeTab === 'beneficiaries' ? 'tab-btn active' : 'tab-btn'" @click="activeTab='beneficiaries'">
                Beneficiaries <span class="tab-count">{{ beneficiaries.length }}</span>
            </button>
        </div>

        <div class="search-bar">
            <input v-model="search" type="text" placeholder="Search by name or skills..." class="search-input">
        </div>

        <div v-if="loading" class="loading-state"><div class="spinner"></div> Loading...</div>

        <!-- Volunteers Table -->
        <div class="card glass-card table-card" v-else-if="activeTab === 'volunteers'">
            <div class="table-container">
                <table>
                    <thead>
                        <tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Skills</th><th>Availability</th><th>Feedback</th><th v-if="isAdminOrHR">Actions</th></tr>
                    </thead>
                    <tbody>
                        <tr v-if="filteredVols.length === 0"><td :colspan="isAdminOrHR?8:7" class="empty-row">No volunteers found</td></tr>
                        <tr v-for="v in filteredVols" :key="v.id">
                            <td><span class="id-badge">#{{ v.id }}</span></td>
                            <td><strong>{{ v.name }}</strong></td>
                            <td class="muted-cell">{{ v.email }}</td>
                            <td>{{ v.phone || '—' }}</td>
                            <td>
                                <span v-for="s in (v.skills || '').split(',').filter(Boolean)" :key="s" class="skill-tag">{{ s.trim() }}</span>
                                <span v-if="!v.skills">—</span>
                            </td>
                            <td>{{ v.availability || '—' }}</td>
                            <td>
                                <span v-if="ackSummaries[v.id]" class="avg-rating-badge">
                                    ★ {{ ackSummaries[v.id].average_rating }} ({{ ackSummaries[v.id].total }})
                                </span>
                                <span v-else class="muted">No feedback</span>
                            </td>
                            <td v-if="isAdminOrHR">
                                <div class="action-btns">
                                    <button class="btn btn-sm btn-secondary" @click="openEditVol(v)">Edit</button>
                                    <button class="btn btn-sm btn-danger" @click="deleteTarget={item:v,type:'volunteer'}">Delete</button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Beneficiaries Table -->
        <div class="card glass-card table-card" v-else>
            <div class="table-container">
                <table>
                    <thead>
                        <tr><th>#</th><th>Name</th><th>Age</th><th>Gender</th><th>Needs</th><th>Status</th><th>Assigned Volunteer</th><th v-if="isAdminOrHR">Contact</th><th v-if="isAdminOrHR">Actions</th></tr>
                    </thead>
                    <tbody>
                        <tr v-if="filteredBens.length === 0"><td :colspan="isAdminOrHR?9:7" class="empty-row">No beneficiaries found</td></tr>
                        <tr v-for="b in filteredBens" :key="b.id">
                            <td><span class="id-badge">#{{ b.id }}</span></td>
                            <td><strong>{{ b.name }}</strong></td>
                            <td>{{ b.age || '—' }}</td>
                            <td>{{ b.gender || '—' }}</td>
                            <td class="muted-cell">{{ firstLine(b.needs) }}</td>
                            <td><span :class="'status-badge status-' + (b.status||'pending').toLowerCase()">{{ b.status }}</span></td>
                            <td>{{ getVolName(b.assigned_volunteer_id) }}</td>
                            <td v-if="isAdminOrHR" class="muted-cell">
                                <div v-if="b.email">{{ b.email }}</div>
                                <div v-if="b.phone">{{ b.phone }}</div>
                                <span v-if="!b.email && !b.phone">—</span>
                            </td>
                            <td v-if="isAdminOrHR">
                                <div class="action-btns">
                                    <template v-if="b.status === 'Pending'">
                                        <button class="btn btn-sm" style="background:#d1fae5;color:#065f46;font-weight:600" @click="reviewBen(b, 'Approved')" title="Approve">Approve</button>
                                        <button class="btn btn-sm btn-danger" @click="openRejectBen(b)" title="Reject">Reject</button>
                                    </template>
                                    <button class="btn btn-sm btn-ai-suggest" @click="getAiSuggestion(b)" title="Get AI Suggestion" :disabled="aiLoading">AI Suggest</button>
                                    <button class="btn btn-sm btn-secondary" @click="openEditBen(b)">Edit</button>
                                    <button class="btn btn-sm btn-danger" @click="deleteTarget={item:b,type:'beneficiary'}">Delete</button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- ═══ AI SUGGESTION REVIEW PANEL ═══ -->
        <div v-if="aiSuggestions.length > 0" class="ai-suggestions-panel card glass-card" style="margin-top:1.5rem;">
            <div class="ai-panel-header">
                <div class="ai-panel-title">
                    <span class="ai-icon"></span>
                    <div>
                        <h3>AI Volunteer Suggestions</h3>
                        <p>for <strong>{{ aiBeneficiaryName }}</strong> — Powered by Decision Tree Classifier</p>
                    </div>
                    <button @click="aiSuggestions=[];aiBeneficiaryName=''" class="ai-close-btn">✕</button>
                </div>
                <div class="ai-meta-bar">
                    <div class="ai-meta-item">
                        <span class="ai-meta-label">Model Accuracy</span>
                        <span class="ai-meta-value ai-accent">{{ aiAccuracy }}%</span>
                    </div>
                    <div class="ai-meta-item">
                        <span class="ai-meta-label">Candidates</span>
                        <span class="ai-meta-value">{{ aiSuggestions.length }}</span>
                    </div>
                    <div class="ai-meta-item">
                        <span class="ai-meta-label">Decision Type</span>
                        <span class="ai-meta-value">ML Suggestion</span>
                    </div>
                </div>
            </div>

            <div class="ai-suggestions-grid">
                <div v-for="(s, idx) in aiSuggestions" :key="s.id" class="suggestion-card" :class="{'suggestion-approved': s.status==='Approved', 'suggestion-rejected': s.status==='Rejected'}">
                    <div class="suggestion-rank">#{{ idx + 1 }}</div>
                    <div class="suggestion-body">
                        <div class="suggestion-header">
                            <h4>{{ s.volunteer_name }}</h4>
                            <span class="score-badge" :class="s.score >= 5 ? 'score-high' : s.score >= 3 ? 'score-mid' : 'score-low'">
                                Score: {{ s.score }}
                            </span>
                        </div>
                        <div class="suggestion-details">
                            <div class="detail-item">
                                <span class="detail-label">Skills</span>
                                <span class="detail-value">
                                    <span v-for="sk in (s.volunteer_skills || '').split(',').filter(Boolean)" :key="sk" class="skill-tag-sm">{{ sk.trim() }}</span>
                                    <span v-if="!s.volunteer_skills" class="muted-cell">—</span>
                                </span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Availability</span>
                                <span class="detail-value">{{ s.volunteer_availability || '—' }}</span>
                            </div>
                            <div class="detail-row">
                                <div class="detail-item">
                                    <span class="detail-label">Skill Match</span>
                                    <span class="detail-value" :style="s.skill_match ? 'color:#059669;font-weight:700' : 'color:#94a3b8'">{{ s.skill_match ? 'Yes' : '—' }}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Current Workload</span>
                                    <span class="detail-value">{{ s.workload }} beneficiaries</span>
                                </div>
                            </div>
                        </div>
                        <div class="suggestion-actions" v-if="s.status === 'Pending'">
                            <button class="btn btn-sm btn-approve" @click="approveSuggestion(s)" :disabled="saving">Approve & Assign</button>
                            <button class="btn btn-sm btn-reject-outline" @click="rejectSuggestion(s)" :disabled="saving">Reject</button>
                        </div>
                        <div v-else class="suggestion-status-badge">
                            <span :class="s.status === 'Approved' ? 'status-badge status-approved' : 'status-badge status-rejected'">{{ s.status }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="aiMessage" class="ai-message">{{ aiMessage }}</div>
        </div>

        <!-- Add/Edit Volunteer Modal -->
        <teleport to="body">
            <div class="modal" v-if="showVolModal" style="display:flex;">
                <div class="modal-content glass-card">
                    <span class="close" @click="showVolModal=false">&times;</span>
                    <h2>{{ editingVol ? 'Edit Volunteer' : 'Add Volunteer' }}</h2>
                    <form @submit.prevent="saveVol">
                        <div class="form-row">
                            <div class="form-group"><label>Name *</label><input type="text" v-model="volForm.name" required placeholder="Full name"></div>
                            <div class="form-group"><label>Email *</label><input type="email" v-model="volForm.email" :required="!editingVol" placeholder="email@example.com"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Phone <small style="color:#64748b;">(10 digits)</small></label>
                                <input type="text" v-model="volForm.phone" placeholder="9876543210" maxlength="10" @input="onVolPhoneInput">
                                <small v-if="volPhoneError" style="color:#ef4444;display:block;margin-top:4px;">{{ volPhoneError }}</small>
                            </div>
                            <div class="form-group"><label>Availability</label><input type="text" v-model="volForm.availability" placeholder="Weekends, Evenings..."></div>
                        </div>
                        <div class="form-group"><label>Skills <small>(comma separated)</small></label><input type="text" v-model="volForm.skills" placeholder="Teaching, Cooking, Driving"></div>
                        <div v-if="formError" class="error-box">{{ formError }}</div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" @click="showVolModal=false">Cancel</button>
                            <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving?'Saving...':(editingVol?'Update':'Add Volunteer') }}</button>
                        </div>
                    </form>
                </div>
            </div>
        </teleport>

        <!-- Add/Edit Beneficiary Modal -->
        <teleport to="body">
            <div class="modal" v-if="showBenModal" style="display:flex;">
                <div class="modal-content glass-card">
                    <span class="close" @click="showBenModal=false">&times;</span>
                    <h2>{{ editingBen ? 'Edit Beneficiary' : 'Add Beneficiary' }}</h2>
                    <form @submit.prevent="saveBen">
                        <div class="form-row">
                            <div class="form-group"><label>Name *</label><input type="text" v-model="benForm.name" required placeholder="Full name"></div>
                            <div class="form-group"><label>Age</label><input type="number" v-model="benForm.age" placeholder="25"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Gender</label>
                                <select v-model="benForm.gender"><option value="">—</option><option>Male</option><option>Female</option><option>Other</option></select>
                            </div>
                            <div class="form-group">
                                <label>Status</label>
                                <select v-model="benForm.status"><option>Pending</option><option>Approved</option><option>Rejected</option><option>Served</option></select>
                            </div>
                        </div>
                        <div class="form-group"><label>Needs</label><textarea v-model="benForm.needs" rows="2" placeholder="Food, Shelter, Education..."></textarea></div>
                        <div class="form-group">
                            <label>Assign Volunteer</label>
                            <select v-model="benForm.assigned_volunteer_id">
                                <option :value="null">— Unassigned —</option>
                                <option v-for="v in volunteers" :key="v.id" :value="v.id">{{ v.name }}</option>
                            </select>
                        </div>
                        <div v-if="formError" class="error-box">{{ formError }}</div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" @click="showBenModal=false">Cancel</button>
                            <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving?'Saving...':(editingBen?'Update':'Add Beneficiary') }}</button>
                        </div>
                    </form>
                </div>
            </div>
        </teleport>

        <!-- Reject Beneficiary Modal -->
        <teleport to="body">
            <div class="modal" v-if="rejectBen" style="display:flex;">
                <div class="modal-content glass-card" style="max-width:420px;">
                    <span class="close" @click="rejectBen=null">&times;</span>
                    <h2>Reject Registration</h2>
                    <p>Reject the registration of <strong>{{ rejectBen.name }}</strong>?
                        <span v-if="rejectBen.email"> A notification will be sent to <strong>{{ rejectBen.email }}</strong>.</span>
                    </p>
                    <div class="form-group" style="margin-top:1rem;">
                        <label>Reason for Rejection <small>(optional)</small></label>
                        <textarea v-model="rejectReason" rows="3" placeholder="e.g. Insufficient supporting information, Outside service area..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-secondary" @click="rejectBen=null">Cancel</button>
                        <button class="btn btn-danger" @click="confirmRejectBen" :disabled="saving">{{ saving ? 'Processing...' : 'Confirm Rejection' }}</button>
                    </div>
                </div>
            </div>
        </teleport>

        <!-- Delete Confirm -->
        <teleport to="body">
            <div class="modal" v-if="deleteTarget" style="display:flex;">
                <div class="modal-content glass-card" style="max-width:380px;text-align:center;">
                    <h2>Confirm Delete</h2>
                    <p style="margin:1rem 0;">Remove <strong>{{ deleteTarget.item.name }}</strong>?</p>
                    <div class="form-actions" style="justify-content:center;">
                        <button class="btn btn-secondary" @click="deleteTarget=null">Cancel</button>
                        <button class="btn btn-danger" @click="doDelete">Yes, Delete</button>
                    </div>
                </div>
            </div>
        </teleport>
    </div>
    `,
    data() {
        return {
            activeTab: 'volunteers', volunteers: [], beneficiaries: [], loading: true, saving: false,
            search: '', showVolModal: false, showBenModal: false, deleteTarget: null,
            formError: '', volPhoneError: '',
            editingVol: null, editingBen: null, rejectBen: null, rejectReason: '',
            volForm: { name: '', email: '', phone: '', skills: '', availability: '' },
            benForm: { name: '', age: null, gender: '', needs: '', status: 'Pending', assigned_volunteer_id: null },
            // AI Suggestion state (replaces old aiResult)
            aiSuggestions: [],
            aiBeneficiaryName: '',
            aiAccuracy: null,
            aiMessage: '',
            aiLoading: false,
            ackSummaries: {}
        };
    },
    computed: {
        isAdminOrHR() { return store.user && ['Admin', 'HR'].includes(store.user.role); },
        filteredVols() {
            const q = this.search.toLowerCase();
            return this.volunteers.filter(v => (v.name || '').toLowerCase().includes(q) || (v.skills || '').toLowerCase().includes(q));
        },
        filteredBens() {
            const q = this.search.toLowerCase();
            return this.beneficiaries.filter(b => (b.name || '').toLowerCase().includes(q) || (b.needs || '').toLowerCase().includes(q));
        }
    },
    mounted() { this.fetch(); },
    methods: {
        async fetch() {
            this.loading = true;
            try { const [v, b] = await Promise.all([axios.get('/volunteer'), axios.get('/beneficiary')]); this.volunteers = v.data; this.beneficiaries = b.data; this.fetchAckSummaries(); }
            catch (e) { window.toast('Failed to load data', 'error'); }
            finally { this.loading = false; }
        },
        async fetchAckSummaries() {
            try {
                for (const v of this.volunteers) {
                    const res = await axios.get(`/acknowledgments/volunteer/${v.id}`);
                    if (res.data.total > 0) {
                        this.ackSummaries[v.id] = { average_rating: res.data.average_rating, total: res.data.total };
                    }
                }
            } catch (e) { /* non-critical */ }
        },
        getVolName(id) { const v = this.volunteers.find(v => v.id === id); return v ? v.name : '—'; },
        firstLine(text) { if (!text) return '—'; const idx = text.indexOf('\n'); return idx > -1 ? text.substring(0, idx) : text; },
        onVolPhoneInput(event) {
            this.volForm.phone = event.target.value.replace(/\D/g, '').slice(0, 10);
            this.volPhoneError = '';
        },
        validateVolPhone() {
            if (this.volForm.phone && !/^\d{10}$/.test(this.volForm.phone)) {
                this.volPhoneError = 'Phone must be exactly 10 digits.';
                return false;
            }
            return true;
        },
        openAdd() {
            this.formError = ''; this.volPhoneError = '';
            if (this.activeTab === 'volunteers') {
                this.editingVol = null; this.volForm = { name: '', email: '', phone: '', skills: '', availability: '' }; this.showVolModal = true;
            } else {
                this.editingBen = null; this.benForm = { name: '', age: null, gender: '', needs: '', status: 'Pending', assigned_volunteer_id: null }; this.showBenModal = true;
            }
        },
        openEditVol(v) { this.editingVol = v; this.formError = ''; this.volPhoneError = ''; this.volForm = { name: v.name, email: v.email, phone: v.phone, skills: v.skills, availability: v.availability }; this.showVolModal = true; },
        openEditBen(b) { this.editingBen = b; this.formError = ''; this.benForm = { name: b.name, age: b.age, gender: b.gender, needs: b.needs, status: b.status, assigned_volunteer_id: b.assigned_volunteer_id }; this.showBenModal = true; },
        async saveVol() {
            if (!this.validateVolPhone()) return;
            this.saving = true; this.formError = '';
            try {
                if (this.editingVol) { await axios.put(`/volunteer/${this.editingVol.id}`, this.volForm); window.toast('Volunteer updated', 'success'); }
                else { await axios.post('/volunteer', this.volForm); window.toast('Volunteer added', 'success'); }
                this.showVolModal = false; this.fetch();
            } catch (e) { this.formError = e.response?.data?.error || 'Failed'; } finally { this.saving = false; }
        },
        async saveBen() {
            this.saving = true; this.formError = '';
            try {
                if (this.editingBen) { await axios.put(`/beneficiary/${this.editingBen.id}`, this.benForm); window.toast('Beneficiary updated', 'success'); }
                else { await axios.post('/beneficiary', this.benForm); window.toast('Beneficiary added', 'success'); }
                this.showBenModal = false; this.fetch();
            } catch (e) { this.formError = e.response?.data?.error || 'Failed'; } finally { this.saving = false; }
        },
        async reviewBen(ben, status) {
            this.saving = true;
            try {
                await axios.put(`/beneficiary/${ben.id}/review`, { status, email: ben.email });
                window.toast(`Beneficiary ${status}!${ben.email ? ' Email sent to ' + ben.email : ''}`, status === 'Approved' ? 'success' : 'info');
                this.fetch();
            } catch (e) { window.toast(e.response?.data?.error || 'Action failed', 'error'); }
            finally { this.saving = false; }
        },
        openRejectBen(ben) { this.rejectBen = ben; this.rejectReason = ''; },
        async confirmRejectBen() {
            if (!this.rejectBen) return;
            this.saving = true;
            try {
                await axios.put(`/beneficiary/${this.rejectBen.id}/review`, { status: 'Rejected', rejection_reason: this.rejectReason, email: this.rejectBen.email });
                window.toast(`Registration of ${this.rejectBen.name} rejected.${this.rejectBen.email ? ' Email sent.' : ''}`, 'info');
                this.rejectBen = null; this.fetch();
            } catch (e) { window.toast(e.response?.data?.error || 'Failed to reject', 'error'); }
            finally { this.saving = false; }
        },
        async doDelete() {
            const { item, type } = this.deleteTarget;
            try {
                await axios.delete(type === 'volunteer' ? `/volunteer/${item.id}` : `/beneficiary/${item.id}`);
                window.toast(`${item.name} deleted`, 'info');
                this.deleteTarget = null; this.fetch();
            } catch (e) { window.toast('Delete failed', 'error'); this.deleteTarget = null; }
        },

        // ═══════════════════════════════════════════════════════════
        // AI SUGGESTION WORKFLOW (replaces old aiAssign)
        // ═══════════════════════════════════════════════════════════
        async getAiSuggestion(beneficiary) {
            this.aiLoading = true;
            this.aiSuggestions = [];
            this.aiBeneficiaryName = beneficiary.name;
            this.aiMessage = '';
            this.aiAccuracy = null;
            try {
                const res = await axios.post(`/ai-suggest/${beneficiary.id}`);
                this.aiSuggestions = res.data.suggestions || [];
                this.aiAccuracy    = res.data.accuracy;
                this.aiMessage     = res.data.message;
                if (this.aiSuggestions.length > 0) {
                    window.toast(`${this.aiSuggestions.length} volunteer suggestions generated for ${beneficiary.name}`, 'success');
                } else {
                    window.toast('No suitable volunteers found by AI', 'info');
                }
            } catch (e) {
                const msg = e.response?.data?.error || 'AI suggestion failed';
                window.toast(msg, 'error');
                this.aiMessage = msg;
            } finally {
                this.aiLoading = false;
            }
        },

        async approveSuggestion(suggestion) {
            this.saving = true;
            try {
                const res = await axios.post(`/ai-suggestions/${suggestion.id}/approve`);
                window.toast(`${res.data.volunteer_name} assigned to ${this.aiBeneficiaryName}`, 'success');
                // Update local state
                suggestion.status = 'Approved';
                this.aiSuggestions.forEach(s => {
                    if (s.id !== suggestion.id && s.status === 'Pending') {
                        s.status = 'Rejected';
                    }
                });
                this.fetch(); // Refresh table data
            } catch (e) {
                window.toast(e.response?.data?.error || 'Approval failed', 'error');
            } finally {
                this.saving = false;
            }
        },

        async rejectSuggestion(suggestion) {
            this.saving = true;
            try {
                await axios.post(`/ai-suggestions/${suggestion.id}/reject`, { reason: 'Rejected by HR' });
                suggestion.status = 'Rejected';
                window.toast('Suggestion rejected', 'info');
            } catch (e) {
                window.toast(e.response?.data?.error || 'Rejection failed', 'error');
            } finally {
                this.saving = false;
            }
        }
    }
}