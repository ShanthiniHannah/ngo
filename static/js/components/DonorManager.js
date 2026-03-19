import { store } from '../store.js';

export default {
    template: `
    <div class="manager-page">
        <div class="page-header">
            <div>
                <h2>❤️ Donor Management</h2>
                <p class="page-subtitle">Track donors and their contributions</p>
            </div>
            <button class="btn btn-primary" @click="openAdd" v-if="isAdminOrHR">+ Add Donor</button>
        </div>

        <div class="stats-bar">
            <div class="stat-chip">Total Donors: <strong>{{ donors.length }}</strong></div>
            <div class="stat-chip success">Total Received: <strong>Rs.{{ totalAmount.toLocaleString() }}</strong></div>
        </div>

        <div class="search-bar">
            <input type="text" v-model="search" placeholder="🔍  Search by name or email..." class="search-input">
        </div>

        <div v-if="loading" class="loading-state"><div class="spinner"></div> Loading donors...</div>

        <div class="card glass-card table-card" v-else>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th><th>Name</th><th>Email</th><th>Phone</th>
                            <th>Donation Amount</th><th v-if="isAdminOrHR">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="filtered.length === 0">
                            <td :colspan="isAdminOrHR ? 6 : 5" class="empty-row">No donors found</td>
                        </tr>
                        <tr v-for="d in filtered" :key="d.id">
                            <td><span class="id-badge">#{{ d.id }}</span></td>
                            <td><strong>{{ d.name }}</strong></td>
                            <td class="muted-cell">{{ d.email }}</td>
                            <td>{{ d.phone || '—' }}</td>
                            <td><span class="amount-badge">Rs.{{ (d.donation_amount || 0).toLocaleString() }}</span></td>
                            <td v-if="isAdminOrHR">
                                <div class="action-btns">
                                    <button class="btn btn-sm btn-secondary" @click="openEdit(d)">✏️</button>
                                    <button class="btn btn-sm btn-danger" @click="deleteTarget=d">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <teleport to="body">
            <div class="modal" v-if="showModal" style="display:flex;">
                <div class="modal-content glass-card">
                    <span class="close" @click="closeModal">&times;</span>
                    <h2>{{ editing ? 'Edit Donor' : 'Add New Donor' }}</h2>
                    <form @submit.prevent="saveDonor">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Full Name *</label>
                                <input type="text" v-model="form.name" required placeholder="Name">
                            </div>
                            <div class="form-group">
                                <label>Email *</label>
                                <input type="email" v-model="form.email" :required="!editing" placeholder="email@example.com">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Phone <small style="color:#64748b;">(10 digits)</small></label>
                                <input type="text" v-model="form.phone" placeholder="9876543210" maxlength="10" @input="onPhoneInput">
                                <small v-if="phoneError" style="color:#ef4444;display:block;margin-top:4px;">{{ phoneError }}</small>
                            </div>
                            <div class="form-group">
                                <label>Donation Amount (Rs.)</label>
                                <input type="number" v-model="form.donation_amount" step="0.01" min="0" placeholder="0.00">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Address</label>
                            <input type="text" v-model="form.address" placeholder="City, State">
                        </div>
                        <div v-if="formError" class="error-box">{{ formError }}</div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
                            <button type="submit" class="btn btn-primary" :disabled="saving">
                                {{ saving ? 'Saving...' : (editing ? 'Update Donor' : 'Add Donor') }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </teleport>

        <teleport to="body">
            <div class="modal" v-if="deleteTarget" style="display:flex;">
                <div class="modal-content glass-card" style="max-width:400px;text-align:center;">
                    <h2>Confirm Delete</h2>
                    <p style="margin:1rem 0;">Remove donor <strong>{{ deleteTarget.name }}</strong>?</p>
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
            donors: [], loading: true, saving: false,
            search: '', showModal: false, editing: null, deleteTarget: null,
            formError: '', phoneError: '',
            form: { name: '', email: '', phone: '', donation_amount: 0, address: '' }
        };
    },
    computed: {
        isAdminOrHR() { return store.user && ['Admin', 'HR'].includes(store.user.role); },
        filtered() {
            const q = this.search.toLowerCase();
            return this.donors.filter(d => (d.name || '').toLowerCase().includes(q) || (d.email || '').toLowerCase().includes(q));
        },
        totalAmount() { return this.donors.reduce((s, d) => s + (d.donation_amount || 0), 0); }
    },
    mounted() { this.fetch(); },
    methods: {
        async fetch() {
            this.loading = true;
            try { const r = await axios.get('/donor'); this.donors = r.data; }
            catch (e) { window.toast('Failed to load donors', 'error'); }
            finally { this.loading = false; }
        },
        onPhoneInput(event) {
            this.form.phone = event.target.value.replace(/\D/g, '').slice(0, 10);
            this.phoneError = '';
        },
        validatePhone() {
            if (this.form.phone && !/^\d{10}$/.test(this.form.phone)) {
                this.phoneError = 'Phone must be exactly 10 digits.';
                return false;
            }
            return true;
        },
        openAdd() {
            this.editing = null; this.formError = ''; this.phoneError = '';
            this.form = { name: '', email: '', phone: '', donation_amount: 0, address: '' };
            this.showModal = true;
        },
        openEdit(d) {
            this.editing = d; this.formError = ''; this.phoneError = '';
            this.form = { name: d.name, email: d.email, phone: d.phone, donation_amount: d.donation_amount, address: d.address };
            this.showModal = true;
        },
        closeModal() { this.showModal = false; this.editing = null; this.phoneError = ''; },
        async saveDonor() {
            if (!this.validatePhone()) return;
            this.saving = true; this.formError = '';
            try {
                if (this.editing) {
                    await axios.put(`/donor/${this.editing.id}`, this.form);
                    window.toast('Donor updated', 'success');
                } else {
                    await axios.post('/donor', this.form);
                    window.toast('Donor added successfully', 'success');
                }
                this.closeModal(); this.fetch();
            } catch (e) { this.formError = e.response?.data?.error || 'Failed to save'; }
            finally { this.saving = false; }
        },
        async doDelete() {
            try {
                await axios.delete(`/donor/${this.deleteTarget.id}`);
                window.toast(`${this.deleteTarget.name} deleted`, 'info');
                this.deleteTarget = null; this.fetch();
            } catch (e) { window.toast('Delete failed', 'error'); this.deleteTarget = null; }
        }
    }
}