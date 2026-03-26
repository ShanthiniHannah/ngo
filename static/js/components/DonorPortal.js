import { store } from '../store.js';

export default {
    template: `
    <div class="portal-wrapper">
        <daily-verse></daily-verse>
        <div class="portal-header">
            <h1>Welcome, {{ user.name }}</h1>
            <p class="subtitle">Donor Portal — Thank you for your generosity!</p>
        </div>

        <div class="portal-grid">
            <!-- Donor Profile -->
            <div class="card glass-card portal-card">
                <div class="card-icon"><i data-lucide="user"></i></div>
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
                <div class="card-icon"><i data-lucide="heart-handshake"></i></div>
                <h3>My Sponsorships</h3>
                <ul class="portal-list" v-if="sponsorships.length">
                    <li v-for="s in sponsorships" :key="s.id" style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <span style="display:block; font-weight:bold;">{{ s.sponsor_name }}</span>
                            <span style="font-size:0.85rem; color:#64748b;">{{ new Date(s.date).toLocaleDateString() }}</span>
                        </div>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <span class="amount-badge">₹{{ (s.amount || 0).toLocaleString() }}</span>
                            <button class="btn btn-sm btn-secondary" @click="download80G(s.id)" title="Download 80G Certificate" style="padding: 4px 8px; font-size: 0.8rem;">80G</button>
                        </div>
                    </li>
                </ul>
                <p v-else class="muted">No sponsorships recorded yet.</p>
            </div>

            <!-- Supported Projects -->
            <div class="card glass-card portal-card">
                <div class="card-icon"><i data-lucide="folder-kanban"></i></div>
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
                <div class="card-icon"><i data-lucide="bar-chart-3"></i></div>
                <h3>Your Impact</h3>
                <p>Total Donations: <strong>{{ sponsorships.length }}</strong></p>
                <p>Total Amount: <strong>₹{{ totalDonated.toLocaleString() }}</strong></p>
                <p>Projects Supported: <strong>{{ projects.length }}</strong></p>
            </div>

            <!-- Make a Donation Card -->
            <div class="card glass-card portal-card" style="grid-column: 1 / -1;">
                <div class="card-icon"><i data-lucide="hand-coins"></i></div>
                <h3>Make a Donation</h3>
                <p>Your contributions help us reach more communities and transform lives.</p>
                <button class="btn btn-primary" @click="showDonateModal = true" style="margin-top:10px;">Donate Now</button>
            </div>

            <!-- Lives Impacted -->
            <div class="card glass-card portal-card" style="grid-column: 1 / -1; margin-top: 1rem;">
                <div class="card-icon"><i data-lucide="users"></i></div>
                <h3>Lives You Are Impacting</h3>
                <p class="muted">Your generous sponsorships help us uplift those in need. Meet some of the people accessing essential help right now:</p>
                <div style="display: flex; gap: 15px; margin-top: 15px; flex-wrap: wrap;">
                    <div v-for="b in impactedBeneficiaries" :key="b.id" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; flex: 1; min-width: 200px;">
                        <h4 style="margin-bottom: 5px; color: #38bdf8;">{{ b.name.split(' ')[0] }} (Age {{ b.age }})</h4>
                        <p style="font-size: 0.85rem; color: #a1a1aa; line-height: 1.4;">Needs: {{ b.needs }}</p>
                    </div>
                    <div v-if="impactedBeneficiaries.length === 0" class="muted" style="width:100%; text-align:center; padding: 2rem;">
                        No beneficiary data available yet.
                    </div>
                </div>
            </div>
        </div>

        <!-- Donate Modal -->
        <teleport to="body">
            <div class="modal" v-if="showDonateModal" style="display:flex;">
                <div class="modal-content glass-card" style="max-width: 500px;">
                    <span class="close" @click="showDonateModal = false">&times;</span>
                    
                    <div v-if="processingStep === 'success'" style="text-align:center; padding: 2rem 0;">
                        <i data-lucide="check-circle" style="color: #10b981; width: 64px; height: 64px; margin-bottom:1rem;"></i>
                        <h2 style="color: #10b981;">Payment Successful!</h2>
                        <p style="margin-top: 1rem;">Thank you for your generous donation.</p>
                        <p class="muted">Transaction ID: {{ lastTxnId }}</p>
                        <button class="btn btn-primary" @click="closeModal" style="margin-top:2rem;">Close</button>
                    </div>

                    <div v-else-if="processingStep === 'processing'" style="text-align:center; padding: 3rem 0;">
                        <div class="lp-spinner" style="margin: 0 auto 1.5rem auto; width: 40px; height: 40px; border-width: 4px;"></div>
                        <h2>Processing Payment...</h2>
                        <p class="muted">Securely connecting to the payment gateway.</p>
                    </div>

                    <div v-else>
                        <h2>Secure Donation Checkout</h2>
                        <p class="muted" style="margin-bottom: 1.5rem;">All transactions are encrypted and secure.</p>
                        <form @submit.prevent="simulatePaymentGateway">
                            <div class="form-group">
                                <label>Donation Amount (₹)</label>
                                <input type="number" v-model.number="donationForm.amount" min="1" required placeholder="Enter amount">
                            </div>

                            <div class="form-group">
                                <label>Support a Project (Optional)</label>
                                <select v-model="donationForm.project_id">
                                    <option value="">General Fund</option>
                                    <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Payment Method</label>
                                <select v-model="donationForm.payment_method" required>
                                    <option value="" disabled>Select Method</option>
                                    <option value="Credit Card">Credit Card</option>
                                    <option value="Debit Card">Debit Card</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Netbanking">Netbanking</option>
                                </select>
                            </div>

                            <!-- Mock Card Inputs -->
                            <transition name="fade">
                                <div v-if="donationForm.payment_method === 'Credit Card' || donationForm.payment_method === 'Debit Card'" style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid rgba(255,255,255,0.1);">
                                    <div class="form-group">
                                        <label>Card Number</label>
                                        <input type="text" placeholder="XXXX XXXX XXXX XXXX" maxlength="19" required>
                                    </div>
                                    <div style="display:flex; gap:10px;">
                                        <div class="form-group" style="flex:1;">
                                            <label>Expiry (MM/YY)</label>
                                            <input type="text" placeholder="MM/YY" maxlength="5" required>
                                        </div>
                                        <div class="form-group" style="flex:1;">
                                            <label>CVV</label>
                                            <input type="password" placeholder="XXX" maxlength="4" required>
                                        </div>
                                    </div>
                                </div>
                            </transition>

                            <!-- Mock UPI Inputs -->
                            <transition name="fade">
                                <div v-if="donationForm.payment_method === 'UPI'" style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid rgba(255,255,255,0.1);">
                                    <div class="form-group" style="margin-bottom: 0;">
                                        <label>UPI ID</label>
                                        <input type="text" placeholder="yourname@bank" required>
                                    </div>
                                </div>
                            </transition>

                            <div class="form-actions" style="margin-top: 1.5rem;">
                                <button type="button" class="btn btn-secondary" @click="showDonateModal = false">Cancel</button>
                                <button type="submit" class="btn btn-primary" style="background: linear-gradient(135deg, #10b981, #059669); border-color: #059669;">
                                    <i data-lucide="lock" style="width: 16px; height: 16px; display:inline-block; vertical-align:middle; margin-right:5px;"></i>
                                    Pay ₹{{ donationForm.amount || 0 }}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </teleport>
    </div>
    `,
    data() {
        return {
            user: store.user,
            profile: null,
            sponsorships: [],
            projects: [],
            impactedBeneficiaries: [],
            showDonateModal: false,
            donationForm: { amount: '', payment_method: '', project_id: '' },
            processingStep: 'form', // form -> processing -> success
            lastTxnId: ''
        };
    },
    computed: {
        totalDonated() {
            return this.sponsorships.reduce((sum, s) => sum + (s.amount || 0), 0);
        }
    },
    async mounted() {
        await Promise.all([this.fetchProfile(), this.fetchSponsorships(), this.fetchProjects(), this.fetchImpactedBeneficiaries()]);
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
        async fetchSponsorships() {
            try {
                const res = await axios.get('/sponsorships');
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
        },
        async fetchImpactedBeneficiaries() {
            try {
                const res = await axios.get('/beneficiary');
                let approved = res.data.filter(b => b.status === 'Approved' || b.status === 'Served');
                this.impactedBeneficiaries = approved.slice(0, 3);
            } catch (e) { console.error(e); }
        },
        async simulatePaymentGateway() {
            this.processingStep = 'processing';
            
            // Simulate 2s network/bank confirmation delay
            setTimeout(() => {
                this.processDonationAPI();
            }, 2000);
        },
        async processDonationAPI() {
            try {
                const res = await axios.post('/donor/donate', this.donationForm);
                this.lastTxnId = res.data.transaction_id;
                this.processingStep = 'success';
                await Promise.all([this.fetchProfile(), this.fetchSponsorships()]);
            } catch (e) {
                this.processingStep = 'form';
                window.toast(e.response?.data?.error || 'Failed to process donation API. Is the server running?', 'error');
            }
        },
        closeModal() {
            this.showDonateModal = false;
            setTimeout(() => {
                this.processingStep = 'form';
                this.donationForm = { amount: '', payment_method: '', project_id: '' };
                this.lastTxnId = '';
            }, 400);
        },
        download80G(sponsorshipId) {
            window.open(`/donor/certificate/${sponsorshipId}`, '_blank');
        }
    }
}
