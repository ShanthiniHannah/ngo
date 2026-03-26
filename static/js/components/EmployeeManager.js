import { store } from '../store.js';

export default {
    template: `
    <div class="manager-page page-fade-in">
        <!-- Page Header -->
        <div class="page-header">
            <div>
                <h2>Employee Roster</h2>
                <p class="page-subtitle">Manage all staff members</p>
            </div>
            <div style="display: flex; gap: 1rem;">
                <button class="btn btn-secondary" @click="exportCSV">Export CSV</button>
                <button class="btn btn-primary" @click="openAdd" v-if="isAdminOrHR">+ Add Employee</button>
            </div>
        </div>

        <!-- Stats Bar -->
        <div class="stats-bar">
            <div class="stat-chip">Total: <strong>{{ employees.length }}</strong></div>
            <div class="stat-chip male">Male: <strong>{{ employees.filter(e => e.gender === 'Male').length }}</strong></div>
            <div class="stat-chip female">Female: <strong>{{ employees.filter(e => e.gender === 'Female').length }}</strong></div>
        </div>

        <!-- Search -->
        <div class="search-bar">
            <input type="text" v-model="search" placeholder="Search by name, email or sponsor..." class="search-input">
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-state">
            <div class="spinner"></div> Loading employees...
        </div>

        <!-- Table -->
        <div class="card glass-card table-card" v-else>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Age</th>
                            <th>Gender</th>
                            <th>Address</th>
                            <th>HR Manager</th>
                            <th>Sponsor</th>
                            <th v-if="isAdminOrHR">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="filtered.length === 0">
                            <td :colspan="isAdminOrHR ? 9 : 8" class="empty-row">No employees found</td>
                        </tr>
                        <tr v-for="emp in filtered" :key="emp.id">
                            <td><span class="id-badge">#{{ emp.id }}</span></td>
                            <td><strong>{{ emp.name }}</strong></td>
                            <td class="muted-cell">{{ emp.email || '—' }}</td>
                            <td>{{ emp.age || '—' }}</td>
                            <td>
                                <span class="gender-badge" :class="(emp.gender || '').toLowerCase()">{{ emp.gender || '—' }}</span>
                            </td>
                            <td class="muted-cell">{{ emp.address || '—' }}</td>
                            <td>{{ emp.hr_name || 'Unassigned' }}</td>
                            <td>{{ emp.sponsor || '—' }}</td>
                            <td v-if="isAdminOrHR">
                                <div class="action-btns">
                                    <button class="btn btn-sm btn-secondary" @click="openEdit(emp)" title="Edit">Edit</button>
                                    <button class="btn btn-sm btn-danger" @click="confirmDelete(emp)" title="Delete">Delete</button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Add / Edit Modal -->
        <teleport to="body">
            <div class="modal" v-if="showModal" style="display:flex;">
                <div class="modal-content glass-card">
                    <span class="close" @click="closeModal">&times;</span>
                    <h2>{{ editing ? 'Edit Employee' : 'Add New Employee' }}</h2>
                    <form @submit.prevent="saveEmployee">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Full Name *</label>
                                <input type="text" v-model="form.name" required placeholder="John Doe">
                            </div>
                            <div class="form-group">
                                <label>Email *</label>
                                <input type="email" v-model="form.email" :required="!editing" placeholder="john@example.com">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Age</label>
                                <input type="number" v-model="form.age" placeholder="25" min="18" max="80">
                            </div>
                            <div class="form-group">
                                <label>Gender</label>
                                <select v-model="form.gender">
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Address</label>
                            <input type="text" v-model="form.address" placeholder="123 Main St, City">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Sponsor</label>
                                <input type="text" v-model="form.sponsor" placeholder="Sponsor name">
                            </div>
                            <div class="form-group">
                                <label>Assign HR Manager</label>
                                <select v-model="form.hr_id">
                                    <option :value="null">— Unassigned —</option>
                                    <option v-for="hr in hrs" :key="hr.id" :value="hr.id">{{ hr.name }}</option>
                                </select>
                            </div>
                        </div>
                        <div v-if="formError" class="error-box">{{ formError }}</div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
                            <button type="submit" class="btn btn-primary" :disabled="saving">
                                {{ saving ? 'Saving...' : (editing ? 'Update Employee' : 'Create Employee') }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </teleport>

        <!-- Confirm Delete -->
        <teleport to="body">
            <div class="modal" v-if="deleteTarget" style="display:flex;">
                <div class="modal-content glass-card" style="max-width:400px;text-align:center;">
                    <h2>Confirm Delete</h2>
                    <p style="margin:1rem 0;">Are you sure you want to remove <strong>{{ deleteTarget.name }}</strong>? This cannot be undone.</p>
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
            employees: [], hrs: [], loading: true, saving: false,
            search: '', showModal: false, editing: null, deleteTarget: null,
            formError: '',
            form: { name: '', email: '', age: null, gender: '', address: '', sponsor: '', hr_id: null }
        };
    },
    computed: {
        isAdminOrHR() {
            return store.user && ['Admin', 'HR'].includes(store.user.role);
        },
        filtered() {
            const q = this.search.toLowerCase();
            return this.employees.filter(e =>
                (e.name || '').toLowerCase().includes(q) ||
                (e.email || '').toLowerCase().includes(q) ||
                (e.sponsor || '').toLowerCase().includes(q)
            );
        }
    },
    mounted() { this.fetch(); },
    methods: {
        async fetch() {
            this.loading = true;
            try {
                const [empRes, hrRes] = await Promise.all([axios.get('/employee'), axios.get('/hr')]);
                this.employees = empRes.data;
                this.hrs = hrRes.data;
            } catch (e) { window.toast('Failed to load employees', 'error'); }
            finally { this.loading = false; }
        },
        openAdd() {
            this.editing = null;
            this.form = { name: '', email: '', age: null, gender: '', address: '', sponsor: '', hr_id: null };
            this.formError = '';
            this.showModal = true;
        },
        openEdit(emp) {
            this.editing = emp;
            this.form = { name: emp.name, email: emp.email, age: emp.age, gender: emp.gender, address: emp.address, sponsor: emp.sponsor, hr_id: emp.hr_id };
            this.formError = '';
            this.showModal = true;
        },
        closeModal() { this.showModal = false; this.editing = null; },
        async saveEmployee() {
            this.saving = true; this.formError = '';
            try {
                if (this.editing) {
                    await axios.put(`/employee/${this.editing.id}`, this.form);
                    window.toast(`${this.form.name} updated successfully`, 'success');
                } else {
                    await axios.post('/employee', this.form);
                    window.toast(`${this.form.name} added successfully`, 'success');
                }
                this.closeModal();
                this.fetch();
            } catch (e) {
                this.formError = e.response?.data?.error || 'Failed to save. Please try again.';
            } finally { this.saving = false; }
        },
        confirmDelete(emp) { this.deleteTarget = emp; },
        async doDelete() {
            try {
                await axios.delete(`/employee/${this.deleteTarget.id}`);
                window.toast(`${this.deleteTarget.name} deleted`, 'info');
                this.deleteTarget = null;
                this.fetch();
            } catch (e) { window.toast('Failed to delete employee', 'error'); this.deleteTarget = null; }
        },
        exportCSV() {
            if (!this.employees.length) return window.toast('No data to export', 'warning');
            const headers = ['id', 'name', 'email', 'age', 'gender', 'address', 'sponsor', 'hr_name'];
            const rows = [headers.join(',')];
            for (const e of this.employees) {
                const row = headers.map(h => `"${(e[h] || '').toString().replace(/"/g, '""')}"`);
                rows.push(row.join(','));
            }
            const blob = new Blob([rows.join('\\n')], { type: 'text/csv' });
            const a = document.createElement('a');
            a.href = window.URL.createObjectURL(blob); a.download = 'employees_export.csv';
            a.click();
        }
    }
}
