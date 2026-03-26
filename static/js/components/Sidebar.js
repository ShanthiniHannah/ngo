import { store } from '../store.js';

export default {
    template: `
    <aside class="sidebar" :class="{ 'collapsed': collapsed }">
        <div class="sidebar-header">
            <div class="logo-container" @click="toggleCollapse" title="Toggle Sidebar">
                 <img src="/static/img/logo.png" alt="NGO" class="sidebar-logo">
                 <span class="brand-name" v-if="!collapsed">ArcMission</span>
                 <span v-if="!collapsed" class="toggle-icon"><i data-lucide="chevron-left"></i></span>
                 <span v-else class="toggle-icon"><i data-lucide="chevron-right"></i></span>
            </div>
        </div>

        <!-- Role Badge -->
        <div class="role-badge-container" v-if="user && !collapsed">
            <span class="role-badge" :class="'role-' + user.role.toLowerCase()">{{ user.role }}</span>
        </div>

        <nav class="sidebar-nav">

            <!-- ── MASTER / ADMIN ──────────────────────── -->
            <template v-if="isAdmin">
                <router-link to="/" class="nav-item" active-class="active" exact>
                    <span class="icon"><i data-lucide="layout-dashboard"></i></span>
                    <span class="label" v-if="!collapsed">Dashboard</span>
                </router-link>
                <router-link to="/hr" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="users"></i></span>
                    <span class="label" v-if="!collapsed">HR Management</span>
                </router-link>
                <router-link to="/employee" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="briefcase"></i></span>
                    <span class="label" v-if="!collapsed">Employees</span>
                </router-link>
                <router-link to="/volunteer" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="heart-handshake"></i></span>
                    <span class="label" v-if="!collapsed">Volunteers</span>
                </router-link>
                <router-link to="/donor" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="hand-coins"></i></span>
                    <span class="label" v-if="!collapsed">Donors</span>
                </router-link>
                <router-link to="/projects" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="folder-kanban"></i></span>
                    <span class="label" v-if="!collapsed">Projects</span>
                </router-link>
                <router-link to="/finance" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="wallet"></i></span>
                    <span class="label" v-if="!collapsed">Finance</span>
                </router-link>
                <router-link to="/analytics" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="bar-chart-3"></i></span>
                    <span class="label" v-if="!collapsed">Analytics</span>
                </router-link>
                <router-link to="/activity_logs" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="scroll-text"></i></span>
                    <span class="label" v-if="!collapsed">Activity Logs</span>
                </router-link>
                <router-link to="/applications" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="file-text"></i></span>
                    <span class="label" v-if="!collapsed">Applications
                        <span class="nav-badge" v-if="!collapsed && pendingCount > 0">{{ pendingCount }}</span>
                    </span>
                </router-link>
            </template>

            <!-- ── HR ──────────────────────────────────── -->
            <template v-else-if="isHR">
                <router-link to="/" class="nav-item" active-class="active" exact>
                    <span class="icon"><i data-lucide="layout-dashboard"></i></span>
                    <span class="label" v-if="!collapsed">Dashboard</span>
                </router-link>
                <router-link to="/hr" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="calendar-check"></i></span>
                    <span class="label" v-if="!collapsed">Attendance & Leave</span>
                </router-link>
                <router-link to="/employee" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="briefcase"></i></span>
                    <span class="label" v-if="!collapsed">Employees</span>
                </router-link>
                <router-link to="/volunteer" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="heart-handshake"></i></span>
                    <span class="label" v-if="!collapsed">Volunteers</span>
                </router-link>
                <router-link to="/donor" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="hand-coins"></i></span>
                    <span class="label" v-if="!collapsed">Donors</span>
                </router-link>
                <router-link to="/projects" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="folder-kanban"></i></span>
                    <span class="label" v-if="!collapsed">Projects</span>
                </router-link>
                <router-link to="/finance" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="wallet"></i></span>
                    <span class="label" v-if="!collapsed">Finance</span>
                </router-link>
                <router-link to="/applications" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="file-text"></i></span>
                    <span class="label" v-if="!collapsed">Applications</span>
                </router-link>
                <router-link to="/my-profile" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="circle-user"></i></span>
                    <span class="label" v-if="!collapsed">My Profile</span>
                </router-link>
            </template>

            <!-- ── EMPLOYEE ─────────────────────────────── -->
            <template v-else-if="isEmployee">
                <router-link to="/employee-portal" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="layout-dashboard"></i></span>
                    <span class="label" v-if="!collapsed">My Dashboard</span>
                </router-link>
                <router-link to="/projects" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="folder-kanban"></i></span>
                    <span class="label" v-if="!collapsed">Projects</span>
                </router-link>
                <router-link to="/my-profile" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="circle-user"></i></span>
                    <span class="label" v-if="!collapsed">My Profile</span>
                </router-link>
            </template>

            <!-- ── VOLUNTEER ────────────────────────────── -->
            <template v-else-if="isVolunteer">
                <router-link to="/volunteer-portal" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="layout-dashboard"></i></span>
                    <span class="label" v-if="!collapsed">My Dashboard</span>
                </router-link>
                <router-link to="/projects" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="folder-kanban"></i></span>
                    <span class="label" v-if="!collapsed">View Projects</span>
                </router-link>
                <router-link to="/my-profile" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="circle-user"></i></span>
                    <span class="label" v-if="!collapsed">My Profile</span>
                </router-link>
            </template>

            <!-- ── DONOR ────────────────────────────────── -->
            <template v-else-if="isDonor">
                <router-link to="/donor-portal" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="layout-dashboard"></i></span>
                    <span class="label" v-if="!collapsed">My Dashboard</span>
                </router-link>
                <router-link to="/projects" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="folder-kanban"></i></span>
                    <span class="label" v-if="!collapsed">Funded Projects</span>
                </router-link>
                <router-link to="/my-profile" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="circle-user"></i></span>
                    <span class="label" v-if="!collapsed">My Profile</span>
                </router-link>
            </template>

            <!-- ── BENEFICIARY ──────────────────────────── -->
            <template v-else-if="isBeneficiary">
                <router-link to="/beneficiary-portal" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="layout-dashboard"></i></span>
                    <span class="label" v-if="!collapsed">My Dashboard</span>
                </router-link>
                <router-link to="/my-profile" class="nav-item" active-class="active">
                    <span class="icon"><i data-lucide="circle-user"></i></span>
                    <span class="label" v-if="!collapsed">My Profile</span>
                </router-link>
            </template>

        </nav>

        <div class="sidebar-footer" v-if="user">
            <div class="user-info" v-if="!collapsed">
                <div class="user-avatar">{{ user.name.charAt(0) }}</div>
                <div class="user-details">
                    <span class="user-name">{{ user.name }}</span>
                    <span class="user-role">{{ user.role }}</span>
                </div>
            </div>
            <button @click="handleLogout" class="logout-btn" :title="collapsed ? 'Logout' : ''">
                <i data-lucide="log-out" style="width:18px;height:18px;"></i>
                <span class="label" v-if="!collapsed">Logout</span>
            </button>
        </div>
    </aside>
    `,
    props: ['user', 'collapsed'],
    data() { return { pendingCount: 0 }; },
    emits: ['logout', 'toggle-sidebar'],
    computed: {
        isAdmin()       { return this.user && this.user.role === 'Admin'; },
        isHR()          { return this.user && this.user.role === 'HR'; },
        isEmployee()    { return this.user && this.user.role === 'Employee'; },
        isVolunteer()   { return this.user && this.user.role === 'Volunteer'; },
        isDonor()       { return this.user && this.user.role === 'Donor'; },
        isBeneficiary() { return this.user && this.user.role === 'Beneficiary'; },
    },
    mounted() {
        if (this.user && ['Admin', 'HR'].includes(this.user.role)) {
            this.fetchPendingCount();
        }
        // Initialize Lucide icons after DOM renders
        this.$nextTick(() => {
            if (window.lucide) { window.lucide.createIcons(); }
        });
    },
    updated() {
        // Re-render icons when sidebar expands/collapses or route changes
        this.$nextTick(() => {
            if (window.lucide) { window.lucide.createIcons(); }
        });
    },
    methods: {
        toggleCollapse() { this.$emit('toggle-sidebar'); },
        async fetchPendingCount() {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/applications', { headers: { 'Authorization': 'Bearer ' + token } });
                const data = await res.json();
                this.pendingCount = data.filter(a => a.status === 'Pending').length;
            } catch(e) { this.pendingCount = 0; }
        },
        async handleLogout() {
            try {
                // Call /logout to trigger auto CHECK_OUT in activity log + attendance
                const token = localStorage.getItem('token');
                if (token) {
                    await fetch('/logout', {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                }
            } catch(e) {
                // Don't block logout if API call fails
                console.warn('[LOGOUT] API call failed, proceeding anyway:', e);
            } finally {
                // Always emit logout to clear token and redirect
                this.$emit('logout');
            }
        }
    }
}