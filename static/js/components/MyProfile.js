import { store } from '../store.js';

export default {
    template: `
    <div class="portal-wrapper">
        <div class="portal-header">
            <h1>My Profile</h1>
            <p class="subtitle">{{ user.name }} — {{ user.role }}</p>
        </div>

        <div class="portal-grid" style="grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));">
            <!-- Account Info -->
            <div class="card glass-card portal-card">
                <h3>Account Information</h3>
                <p><strong>Name:</strong> {{ user.name }}</p>
                <p><strong>Email:</strong> {{ user.email }}</p>
                <p><strong>Role:</strong> <span class="role-badge" :class="'role-' + user.role.toLowerCase()">{{ user.role }}</span></p>
                <p><strong>User ID:</strong> #{{ user.id }}</p>
            </div>

            <!-- Role-specific profile details -->
            <div class="card glass-card portal-card">
                <h3>{{ roleLabel }} Details</h3>
                <div v-if="profile">
                    <template v-for="(val, key) in profile" :key="key">
                        <p v-if="key !== 'employee_id' && key !== 'volunteer_id' && key !== 'donor_id' && key !== 'beneficiary_id'">
                            <strong>{{ formatKey(key) }}:</strong> {{ val || 'N/A' }}
                        </p>
                    </template>
                </div>
                <p v-else class="muted">No additional profile information available.</p>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            user: store.user,
            profile: null
        };
    },
    computed: {
        roleIcon() {
            const icons = { Admin: '', HR: '', Employee: '', Volunteer: '', Donor: '', Beneficiary: '' };
            return icons[this.user?.role] || '';
        },
        roleLabel() {
            return this.user?.role || '';
        }
    },
    async mounted() {
        try {
            const res = await axios.get('/me');
            this.profile = res.data.profile || null;
        } catch (e) { console.error(e); }
    },
    methods: {
        formatKey(key) {
            return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
    }
}
