import { store } from '../store.js';

export default {
    template: `
    <div class="glass-container" style="padding: 2rem;">
        <h2 style="margin-bottom: 2rem;">Analytics & Insights</h2>
        
        <div class="analytics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem;">
            
            <!-- Donation Trends Section -->
            <div class="card glass-card">
                <h3>Donation Trends ({{ currentYear }})</h3>
                <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">Monthly sponsorship volume</p>
                <div style="height: 300px; position: relative;">
                    <canvas id="donationChart"></canvas>
                </div>
            </div>

            <!-- Beneficiary Growth Section -->
            <div class="card glass-card">
                <h3>Beneficiary Demographics</h3>
                <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">Distribution by current status</p>
                <div style="height: 300px; position: relative;">
                    <canvas id="beneficiaryChart"></canvas>
                </div>
            </div>

            <!-- Volunteer Activity Section -->
            <div class="card glass-card">
                <h3>Volunteer Growth ({{ currentYear }})</h3>
                <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">New volunteers onboarding over time</p>
                <div style="height: 300px; position: relative;">
                    <canvas id="volunteerChart"></canvas>
                </div>
            </div>

            <!-- Spiritual Growth Section (Legacy) -->
            <div class="card glass-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3>Spiritual Impact</h3>
                    <button class="btn btn-sm btn-primary" @click="showLogModal = true">Log Activity</button>
                </div>
                
                <div style="height: 300px; position: relative;">
                    <canvas id="spiritualChart"></canvas>
                </div>
                
                <h4 style="margin-top: 1.5rem;">Recent Logs</h4>
                <ul style="font-size: 0.9rem; padding-left: 1.2rem; margin-top: 0.5rem; max-height: 150px; overflow-y: auto;">
                    <li v-for="log in spiritualLogs" :key="log.id" style="margin-bottom: 0.5rem;">
                        <strong>{{ log.user_name }}</strong>: {{ log.activity_type }} ({{ log.duration }}m) <br>
                        <small style="color: var(--text-muted)">{{ log.date }} - {{ log.notes }}</small>
                    </li>
                </ul>
            </div>

        </div>

        <!-- Log Modal -->
        <teleport to="body">
            <div class="modal" v-if="showLogModal" style="display: flex;">
                <div class="modal-content glass-card">
                    <span class="close" @click="showLogModal = false">&times;</span>
                    <h2>Log Spiritual Activity</h2>
                    <form @submit.prevent="logActivity">
                        <div class="form-group">
                            <label>Activity Type</label>
                            <select v-model="newLog.activity_type" style="width: 100%; padding: 0.5rem; border-radius: 8px;" required>
                                <option value="Prayer">Prayer</option>
                                <option value="Meditation">Meditation</option>
                                <option value="Service">Service</option>
                                <option value="Study">Study</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Duration (minutes)</label>
                            <input type="number" v-model="newLog.duration" required>
                        </div>
                         <div class="form-group">
                            <label>Date</label>
                            <input type="date" v-model="newLog.date">
                        </div>
                        <div class="form-group">
                            <label>Notes</label>
                            <textarea v-model="newLog.notes" rows="2"></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Log Entry</button>
                        </div>
                    </form>
                </div>
            </div>
        </teleport>
    </div>
    `,
    data() {
        return {
            spiritualStats: [],
            spiritualLogs: [],
            activityStats: [],
            showLogModal: false,
            newLog: { activity_type: 'Prayer', duration: 30, notes: '', date: new Date().toISOString().split('T')[0] },
            currentYear: new Date().getFullYear(),
            chartsData: null,
            charts: {
                spiritual: null,
                donation: null,
                beneficiary: null,
                volunteer: null
            }
        }
    },
    mounted() {
        this.fetchAnalytics();
        this.fetchSpiritualLogs();
    },
    methods: {
        async fetchAnalytics() {
            try {
                const [perfRes, dashRes] = await Promise.all([
                    axios.get('/analytics/performance'),
                    axios.get('/analytics/dashboard-charts')
                ]);
                this.activityStats = perfRes.data.activity_stats;
                this.spiritualStats = perfRes.data.spiritual_stats;
                this.chartsData = dashRes.data;
                this.currentYear = dashRes.data.year;
                this.renderCharts();
            } catch (error) { console.error("Error fetching analytics", error); }
        },
        async fetchSpiritualLogs() {
            try {
                const response = await axios.get('/analytics/spiritual');
                this.spiritualLogs = response.data;
            } catch (error) { console.error("Error fetching spiritual logs", error); }
        },
        async logActivity() {
            try {
                await axios.post('/analytics/spiritual', this.newLog);
                this.showLogModal = false;
                this.newLog = { activity_type: 'Prayer', duration: 30, notes: '', date: new Date().toISOString().split('T')[0] };
                this.fetchAnalytics();
                this.fetchSpiritualLogs();
            } catch (error) { alert('Failed to log activity'); }
        },
        renderCharts() {
            const getMonthArray = (dataMap) => {
                const arr = new Array(12).fill(0);
                for(let i=1; i<=12; i++) {
                    if (dataMap[i]) arr[i-1] = dataMap[i];
                }
                return arr;
            };
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            // 1. Donation Trends Chart
            const donCtx = document.getElementById('donationChart').getContext('2d');
            if (this.charts.donation) this.charts.donation.destroy();
            this.charts.donation = new Chart(donCtx, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Donations (Rs)',
                        data: getMonthArray(this.chartsData.donation_trends),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });

            // 2. Beneficiary Chart
            const benCtx = document.getElementById('beneficiaryChart').getContext('2d');
            if (this.charts.beneficiary) this.charts.beneficiary.destroy();
            const benLabels = Object.keys(this.chartsData.beneficiary_breakdown);
            const benData = Object.values(this.chartsData.beneficiary_breakdown);
            this.charts.beneficiary = new Chart(benCtx, {
                type: 'doughnut',
                data: {
                    labels: benLabels.length ? benLabels : ['No Data'],
                    datasets: [{
                        data: benData.length ? benData : [1],
                        backgroundColor: ['#6366f1', '#f43f5e', '#f59e0b', '#8b5cf6', '#e2e8f0']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });

            // 3. Volunteer Chart
            const volCtx = document.getElementById('volunteerChart').getContext('2d');
            if (this.charts.volunteer) this.charts.volunteer.destroy();
            this.charts.volunteer = new Chart(volCtx, {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'New Volunteers',
                        data: getMonthArray(this.chartsData.volunteer_trends),
                        backgroundColor: '#8b5cf6',
                        borderRadius: 4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });

            // Spiritual Chart (Existing)
            const spiritualCtx = document.getElementById('spiritualChart').getContext('2d');
            if (this.charts.spiritual) this.charts.spiritual.destroy();
            this.charts.spiritual = new Chart(spiritualCtx, {
                type: 'pie',
                data: {
                    labels: this.spiritualStats.map(s => s.name),
                    datasets: [{
                        data: this.spiritualStats.map(s => s.total_hours),
                        backgroundColor: ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }
}
