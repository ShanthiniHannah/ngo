import { store } from '../store.js';

export default {
    template: `
    <div class="manager-page page-fade-in">
        <div class="page-header">
            <div>
                <h2>Finance Management</h2>
                <p class="page-subtitle">Track sponsorships, receipts and financial records</p>
            </div>
            <div style="display: flex; gap: 1rem;">
                <button class="btn btn-secondary" @click="exportCSV">Export CSV</button>
                <button class="btn btn-primary" @click="showModal=true" v-if="isAdminOrHR">+ Record Sponsorship</button>
            </div>
        </div>

        <!-- Stats -->
        <div class="stats-bar">
            <div class="stat-chip">Total Records: <strong>{{ sponsorships.length }}</strong></div>
            <div class="stat-chip success">Total Received: <strong>Rs.{{ totalAmount.toLocaleString() }}</strong></div>
            <div class="stat-chip warning">This Month: <strong>Rs.{{ monthAmount.toLocaleString() }}</strong></div>
        </div>

        <div class="search-bar">
            <input v-model="search" type="text" placeholder="Search by sponsor name or project..." class="search-input">
        </div>

        <div v-if="loading" class="loading-state"><div class="spinner"></div> Loading records...</div>

        <div class="card glass-card table-card" v-else>
            <div class="table-container">
                <table>
                    <thead>
                        <tr><th>Date</th><th>Sponsor</th><th>Donor</th><th>Project / Fund</th><th>Amount</th><th>Receipt</th></tr>
                    </thead>
                    <tbody>
                        <tr v-if="filtered.length===0"><td colspan="6" class="empty-row">No sponsorships recorded</td></tr>
                        <tr v-for="s in filtered" :key="s.id">
                            <td class="muted-cell">{{ s.date }}</td>
                            <td><strong>{{ s.sponsor_name }}</strong></td>
                            <td class="muted-cell">{{ s.donor_name !== 'Anonymous' ? s.donor_name : '—' }}</td>
                            <td>
                                <span class="project-tag" v-if="s.project_name !== 'General Fund'">{{ s.project_name }}</span>
                                <span class="muted-cell" v-else>General Fund</span>
                            </td>
                            <td><span class="amount-badge">Rs.{{ (s.amount || 0).toLocaleString() }}</span></td>
                            <td>
                                <div style="display:flex; gap:5px;">
                                    <button class="btn btn-sm btn-secondary" @click="downloadReceipt(s)" title="Download Receipt">Receipt</button>
                                    <button class="btn btn-sm btn-secondary" @click="download80G(s.id)" title="Download 80G Certificate">80G</button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Add Sponsorship Modal -->
        <teleport to="body">
            <div class="modal" v-if="showModal" style="display:flex;">
                <div class="modal-content glass-card">
                    <span class="close" @click="showModal=false">&times;</span>
                    <h2>Record New Sponsorship</h2>
                    <form @submit.prevent="addSponsorship">
                        <div class="form-group">
                            <label>Sponsor Name *</label>
                            <input type="text" v-model="form.sponsor_name" required placeholder="Organisation or individual name">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Amount (Rs.) *</label>
                                <input type="number" v-model="form.amount" step="0.01" min="1" required placeholder="0.00">
                            </div>
                            <div class="form-group">
                                <label>Link to Donor</label>
                                <select v-model="form.donor_id">
                                    <option :value="null">— Anonymous —</option>
                                    <option v-for="d in donors" :key="d.id" :value="d.id">{{ d.name }}</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Link to Project</label>
                            <select v-model="form.project_id">
                                <option :value="null">General Fund</option>
                                <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                            </select>
                        </div>
                        <div v-if="formError" class="error-box">{{ formError }}</div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" @click="showModal=false">Cancel</button>
                            <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving?'Saving...':'Record Sponsorship' }}</button>
                        </div>
                    </form>
                </div>
            </div>
        </teleport>
    </div>
    `,
    data() {
        return {
            sponsorships: [], donors: [], projects: [], loading: true, saving: false,
            search: '', showModal: false, formError: '',
            form: { sponsor_name: '', amount: '', donor_id: null, project_id: null }
        };
    },
    computed: {
        isAdminOrHR() { return store.user && ['Admin', 'HR'].includes(store.user.role); },
        filtered() {
            const q = this.search.toLowerCase();
            return this.sponsorships.filter(s =>
                (s.sponsor_name || '').toLowerCase().includes(q) || (s.project_name || '').toLowerCase().includes(q)
            );
        },
        totalAmount() { return this.sponsorships.reduce((sum, s) => sum + (s.amount || 0), 0); },
        monthAmount() {
            const now = new Date();
            return this.sponsorships
                .filter(s => { const d = new Date(s.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
                .reduce((sum, s) => sum + (s.amount || 0), 0);
        }
    },
    mounted() { this.fetch(); },
    methods: {
        async fetch() {
            this.loading = true;
            try {
                const [sr, dr, pr] = await Promise.all([axios.get('/sponsorships'), axios.get('/donor'), axios.get('/projects')]);
                this.sponsorships = sr.data; this.donors = dr.data; this.projects = pr.data;
            } catch (e) { window.toast('Failed to load finance data', 'error'); }
            finally { this.loading = false; }
        },
        async addSponsorship() {
            this.saving = true; this.formError = '';
            try {
                await axios.post('/sponsorships', this.form);
                window.toast('Sponsorship recorded successfully', 'success');
                this.showModal = false;
                this.form = { sponsor_name: '', amount: '', donor_id: null, project_id: null };
                this.fetch();
            } catch (e) { this.formError = e.response?.data?.error || 'Failed to record'; }
            finally { this.saving = false; }
        },
        downloadReceipt(s) {
            const parts = [
                '<!DOCTYPE html><html><head>',
                '<title>Receipt #' + s.id + '</title>',
                '<style>body{font-family:Arial,sans-serif;max-width:600px;margin:40px auto;color:#1e293b}',
                '.header{text-align:center;border-bottom:2px solid #6366f1;padding-bottom:20px;margin-bottom:20px}',
                '.header h1{color:#6366f1;margin:0}.badge{background:#e0e7ff;color:#3730a3;padding:4px 12px;border-radius:20px;font-weight:bold}',
                '.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0}',
                '.label{color:#64748b}.amount{font-size:2rem;color:#059669;font-weight:700;text-align:center;margin:20px 0}',
                '.footer{text-align:center;margin-top:30px;color:#64748b;font-size:.85rem}</style></head><body>',
                '<div class="header"><h1>ArcMission</h1><p>Official Donation Receipt</p>',
                '<span class="badge">RECEIPT #' + s.id + '</span></div>',
                '<div class="amount">Rs. ' + (s.amount || 0).toLocaleString() + '</div>',
                '<div class="row"><span class="label">Date</span><span>' + s.date + '</span></div>',
                '<div class="row"><span class="label">Received From</span><strong>' + s.sponsor_name + '</strong></div>',
                '<div class="row"><span class="label">Donor</span><span>' + (s.donor_name !== 'Anonymous' ? s.donor_name : 'Anonymous') + '</span></div>',
                '<div class="row"><span class="label">Designated For</span><span>' + (s.project_name || 'General Fund') + '</span></div>',
                '<div class="footer"><p>Thank you for your generous support! &#10084;</p>',
                '<p>This is a computer-generated receipt and does not require a signature.</p></div>',
                '</body></html>'
            ];
            const win = window.open('', '_blank');
            win.document.write(parts.join(''));
            win.document.close();
            win.focus();
            setTimeout(() => win.print(), 500);
            window.toast('Receipt opened — use Print to save as PDF', 'info');
        },
        download80G(sponsorshipId) {
            window.open(`/donor/certificate/${sponsorshipId}`, '_blank');
        },
        exportCSV() {
            if (!this.sponsorships.length) return window.toast('No data to export', 'warning');
            const headers = ['id', 'date', 'sponsor_name', 'amount', 'donor_name', 'project_name'];
            const rows = [headers.join(',')];
            for (const s of this.sponsorships) {
                const row = headers.map(h => `"${(s[h] || '').toString().replace(/"/g, '""')}"`);
                rows.push(row.join(','));
            }
            const blob = new Blob([rows.join('\\n')], { type: 'text/csv' });
            const a = document.createElement('a');
            a.href = window.URL.createObjectURL(blob); a.download = 'finance_export.csv';
            a.click();
        }
    }
}
