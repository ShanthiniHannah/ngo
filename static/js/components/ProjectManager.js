import { store } from '../store.js';

export default {
    template: `
    <div class="manager-page page-fade-in">
        <div class="page-header">
            <div>
                <h2>Project Management</h2>
                <p class="page-subtitle">Track projects, timelines, budgets and deliverables</p>
            </div>
            <div style="display:flex;gap:0.75rem;">
                <select v-model="statusFilter" class="filter-select">
                    <option value="">All Statuses</option>
                    <option>Planned</option><option>In Progress</option><option>Completed</option>
                </select>
                <button class="btn btn-primary" @click="openAdd" v-if="isAdminOrHR">+ New Project</button>
            </div>
        </div>

        <div class="search-bar">
            <input v-model="search" type="text" placeholder="Search projects..." class="search-input">
        </div>

        <!-- Stats -->
        <div class="stats-bar">
            <div class="stat-chip">Total: <strong>{{ projects.length }}</strong></div>
            <div class="stat-chip warning">Planned: <strong>{{ projects.filter(p=>p.status==='Planned').length }}</strong></div>
            <div class="stat-chip success">In Progress: <strong>{{ projects.filter(p=>p.status==='In Progress').length }}</strong></div>
            <div class="stat-chip">Completed: <strong>{{ projects.filter(p=>p.status==='Completed').length }}</strong></div>
        </div>

        <div v-if="loading" class="loading-state"><div class="spinner"></div> Loading projects...</div>

        <!-- Project Cards Grid -->
        <div class="project-grid" v-else>
            <div v-if="filtered.length === 0" class="empty-projects">
                <p>No projects found. Create your first project!</p>
            </div>
            <div v-for="p in filtered" :key="p.id" class="project-card glass-card">
                <div class="project-card-header">
                    <div>
                        <h3>{{ p.name }}</h3>
                        <p class="project-desc">{{ p.description || 'No description provided' }}</p>
                    </div>
                    <span :class="'status-badge status-' + p.status.toLowerCase().replace(' ','-')">{{ p.status }}</span>
                </div>

                <div class="project-meta">
                    <div class="meta-item">
                        <span class="meta-label">Budget:</span>
                        <span>Rs.{{ (p.budget || 0).toLocaleString() }}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Timeline:</span>
                        <span>{{ p.start_date || 'N/A' }} → {{ p.end_date || 'N/A' }}</span>
                    </div>
                </div>

                <!-- Progress Bar -->
                <div class="progress-wrap" v-if="p.deliverables && p.deliverables.length">
                    <div class="progress-label">
                        Deliverables: {{ p.deliverables.filter(d=>d.status==='Completed').length }}/{{ p.deliverables.length }}
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" :style="{width: deliverableProgress(p) + '%'}"></div>
                    </div>
                </div>

                <!-- Deliverables List -->
                <ul class="deliverable-list" v-if="p.deliverables && p.deliverables.length">
                    <li v-for="d in p.deliverables" :key="d.id" class="deliverable-item">
                        <label class="deliverable-check">
                            <input type="checkbox" :checked="d.status === 'Completed'" @change="toggleDeliverable(d)" :disabled="!isAdminOrHR">
                            <span :class="{ done: d.status === 'Completed' }">{{ d.title }}</span>
                        </label>
                        <span class="del-date">{{ d.due_date || '' }}</span>
                    </li>
                </ul>

                <div class="project-actions" v-if="isAdminOrHR">
                    <button class="btn btn-sm btn-secondary" @click="openDeliverableModal(p)">+ Deliverable</button>
                    <button class="btn btn-sm btn-secondary" @click="openEdit(p)">Edit</button>
                    <select class="status-select" :value="p.status" @change="changeStatus(p, $event.target.value)">
                        <option>Planned</option><option>In Progress</option><option>Completed</option>
                    </select>
                    <button class="btn btn-sm btn-danger" @click="deleteTarget=p">Delete</button>
                </div>
            </div>
        </div>

        <!-- Project Modal -->
        <teleport to="body">
            <div class="modal" v-if="showModal" style="display:flex;">
                <div class="modal-content glass-card">
                    <span class="close" @click="showModal=false">&times;</span>
                    <h2>{{ editing ? 'Edit Project' : 'New Project' }}</h2>
                    <form @submit.prevent="saveProject">
                        <div class="form-group"><label>Project Name *</label><input type="text" v-model="form.name" required placeholder="Project name"></div>
                        <div class="form-group"><label>Description</label><textarea v-model="form.description" rows="2" placeholder="What is this project about?"></textarea></div>
                        <div class="form-row">
                            <div class="form-group"><label>Budget (Rs.)</label><input type="number" v-model="form.budget" min="0" placeholder="0"></div>
                            <div class="form-group" v-if="editing">
                                <label>Status</label>
                                <select v-model="form.status"><option>Planned</option><option>In Progress</option><option>Completed</option></select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>Start Date</label><input type="date" v-model="form.start_date"></div>
                            <div class="form-group"><label>End Date</label><input type="date" v-model="form.end_date"></div>
                        </div>
                        <div v-if="formError" class="error-box">{{ formError }}</div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" @click="showModal=false">Cancel</button>
                            <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving?'Saving...':(editing?'Update Project':'Create Project') }}</button>
                        </div>
                    </form>
                </div>
            </div>
        </teleport>

        <!-- Deliverable Modal -->
        <teleport to="body">
            <div class="modal" v-if="showDelivModal" style="display:flex;">
                <div class="modal-content glass-card">
                    <span class="close" @click="showDelivModal=false">&times;</span>
                    <h2>Add Deliverable — {{ selectedProject?.name }}</h2>
                    <form @submit.prevent="createDeliverable">
                        <div class="form-group"><label>Title *</label><input type="text" v-model="delivForm.title" required placeholder="Deliverable title"></div>
                        <div class="form-group"><label>Due Date</label><input type="date" v-model="delivForm.due_date"></div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" @click="showDelivModal=false">Cancel</button>
                            <button type="submit" class="btn btn-primary" :disabled="saving">Add Deliverable</button>
                        </div>
                    </form>
                </div>
            </div>
        </teleport>

        <!-- Delete Confirm -->
        <teleport to="body">
            <div class="modal" v-if="deleteTarget" style="display:flex;">
                <div class="modal-content glass-card" style="max-width:380px;text-align:center;">
                    <h2>Delete Project?</h2>
                    <p style="margin:1rem 0;">This will permanently delete <strong>{{ deleteTarget.name }}</strong> and all its deliverables.</p>
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
            projects: [], loading: true, saving: false, search: '', statusFilter: '',
            showModal: false, showDelivModal: false, editing: null, deleteTarget: null, selectedProject: null, formError: '',
            form: { name: '', description: '', budget: 0, start_date: '', end_date: '', status: 'Planned' },
            delivForm: { title: '', due_date: '' }
        };
    },
    computed: {
        isAdminOrHR() { return store.user && ['Admin', 'HR'].includes(store.user.role); },
        filtered() {
            return this.projects.filter(p => {
                const q = this.search.toLowerCase();
                const matchSearch = (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
                const matchStatus = !this.statusFilter || p.status === this.statusFilter;
                return matchSearch && matchStatus;
            });
        }
    },
    mounted() { this.fetch(); },
    methods: {
        async fetch() {
            this.loading = true;
            try { const r = await axios.get('/projects'); this.projects = r.data; }
            catch (e) { window.toast('Failed to load projects', 'error'); }
            finally { this.loading = false; }
        },
        deliverableProgress(p) {
            if (!p.deliverables || !p.deliverables.length) return 0;
            return Math.round((p.deliverables.filter(d => d.status === 'Completed').length / p.deliverables.length) * 100);
        },
        openAdd() { this.editing = null; this.formError = ''; this.form = { name: '', description: '', budget: 0, start_date: '', end_date: '', status: 'Planned' }; this.showModal = true; },
        openEdit(p) { this.editing = p; this.formError = ''; this.form = { name: p.name, description: p.description, budget: p.budget, start_date: p.start_date, end_date: p.end_date, status: p.status }; this.showModal = true; },
        openDeliverableModal(p) { this.selectedProject = p; this.delivForm = { title: '', due_date: '' }; this.showDelivModal = true; },
        async saveProject() {
            this.saving = true; this.formError = '';
            try {
                if (this.editing) { await axios.put(`/projects/${this.editing.id}`, this.form); window.toast('Project updated', 'success'); }
                else { await axios.post('/projects', this.form); window.toast('Project created', 'success'); }
                this.showModal = false; this.fetch();
            } catch (e) { this.formError = e.response?.data?.error || 'Failed'; } finally { this.saving = false; }
        },
        async changeStatus(p, status) {
            try { await axios.put(`/projects/${p.id}`, { ...p, status }); window.toast(`Status → ${status}`, 'info'); this.fetch(); }
            catch (e) { window.toast('Update failed', 'error'); }
        },
        async createDeliverable() {
            this.saving = true;
            try { await axios.post(`/projects/${this.selectedProject.id}/deliverables`, this.delivForm); window.toast('Deliverable added', 'success'); this.showDelivModal = false; this.fetch(); }
            catch (e) { window.toast('Failed to add deliverable', 'error'); } finally { this.saving = false; }
        },
        async toggleDeliverable(d) {
            const newStatus = d.status === 'Completed' ? 'Pending' : 'Completed';
            try { await axios.put(`/deliverables/${d.id}`, { status: newStatus }); this.fetch(); }
            catch (e) { window.toast('Update failed', 'error'); }
        },
        async doDelete() {
            try { await axios.delete(`/projects/${this.deleteTarget.id}`); window.toast('Project deleted', 'info'); this.deleteTarget = null; this.fetch(); }
            catch (e) { window.toast('Delete failed', 'error'); this.deleteTarget = null; }
        }
    }
}
