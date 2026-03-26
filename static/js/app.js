import Login from './components/Login.js';
import Toast from './components/Toast.js';
import Dashboard from './components/Dashboard.js';
import HRManager from './components/HRManager.js';
import EmployeeManager from './components/EmployeeManager.js';
import DonorManager from './components/DonorManager.js';
import VolunteerManager from './components/VolunteerManager.js';
import ProjectManager from './components/ProjectManager.js';
import FinanceManager from './components/FinanceManager.js';
import AnalyticsDashboard from './components/AnalyticsDashboard.js';
import ActivityLogs from './components/ActivityLogs.js';
import Sidebar from './components/Sidebar.js';
import MyProfile from './components/MyProfile.js';
import VolunteerPortal from './components/VolunteerPortal.js';
import DonorPortal from './components/DonorPortal.js';
import BeneficiaryPortal from './components/BeneficiaryPortal.js';
import EmployeePortal from './components/EmployeePortal.js';
import ApplicationForm from './components/ApplicationForm.js';
import ApplicationReview from './components/ApplicationReview.js';
import BeneficiaryApplicationForm from './components/BeneficiaryApplicationForm.js';
import DailyVerse from './components/DailyVerse.js';

const { createApp, reactive, computed } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

import { store } from './store.js';

// ─── Axios Config ────────────────────────────────────────────────
axios.defaults.baseURL = '';
if (store.token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${store.token}`;
}

// ─── Role Permission Map ─────────────────────────────────────────
// roles that are allowed on each route (empty = all authenticated)
const ROUTE_ROLES = {
    '/hr': ['Admin', 'HR'],
    '/employee': ['Admin', 'HR'],
    '/donor': ['Admin', 'HR'],
    '/volunteer': ['Admin', 'HR'],
    '/projects': ['Admin', 'HR', 'Employee', 'Volunteer', 'Donor'],
    '/finance': ['Admin', 'HR'],
    '/analytics': ['Admin', 'HR'],
    '/activity_logs': ['Admin'],
    // portals – only for that specific role
    '/my-profile': ['Employee', 'Volunteer', 'Donor', 'Beneficiary', 'HR', 'Admin'],
    '/volunteer-portal': ['Volunteer'],
    '/donor-portal': ['Donor'],
    '/beneficiary-portal': ['Beneficiary'],
    '/employee-portal': ['Employee'],
    '/applications': ['Admin', 'HR'],
};

// ─── Routes ──────────────────────────────────────────────────────
const routes = [
    { path: '/login', component: Login, meta: { guest: true } },
    { path: '/', component: Dashboard, meta: { requiresAuth: true } },

    // Admin + HR routes
    { path: '/hr', component: HRManager, meta: { requiresAuth: true } },
    { path: '/employee', component: EmployeeManager, meta: { requiresAuth: true } },
    { path: '/donor', component: DonorManager, meta: { requiresAuth: true } },
    { path: '/volunteer', component: VolunteerManager, meta: { requiresAuth: true } },
    { path: '/projects', component: ProjectManager, meta: { requiresAuth: true } },
    { path: '/finance', component: FinanceManager, meta: { requiresAuth: true } },
    { path: '/analytics', component: AnalyticsDashboard, meta: { requiresAuth: true } },
    { path: '/activity_logs', component: ActivityLogs, meta: { requiresAuth: true } },

    // Role-specific portals
    { path: '/my-profile', component: MyProfile, meta: { requiresAuth: true } },
    { path: '/volunteer-portal', component: VolunteerPortal, meta: { requiresAuth: true } },
    { path: '/donor-portal', component: DonorPortal, meta: { requiresAuth: true } },
    { path: '/beneficiary-portal', component: BeneficiaryPortal, meta: { requiresAuth: true } },
    { path: '/employee-portal', component: EmployeePortal, meta: { requiresAuth: true } },

    // Public application forms (no auth required)
    { path: '/apply', component: ApplicationForm, meta: { guest: false } },
    { path: '/apply/beneficiary', component: BeneficiaryApplicationForm, meta: { guest: false } },

    // HR / Admin — applications review
    { path: '/applications', component: ApplicationReview, meta: { requiresAuth: true } },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

// ─── Navigation Guard ────────────────────────────────────────────
router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth && !store.token) {
        next('/login');
        return;
    }
    if (to.meta.guest && store.token) {
        next('/');
        return;
    }

    const allowedRoles = ROUTE_ROLES[to.path];
    if (allowedRoles && store.user && !allowedRoles.includes(store.user.role)) {
        // Redirect to the user's home page instead of showing an alert
        const roleHome = getRoleHome(store.user.role);
        next(roleHome);
        return;
    }

    next();
});

// Return the correct landing page for each role after login
function getRoleHome(role) {
    switch (role) {
        case 'Admin': return '/';
        case 'HR': return '/';
        case 'Employee': return '/employee-portal';
        case 'Volunteer': return '/volunteer-portal';
        case 'Donor': return '/donor-portal';
        case 'Beneficiary': return '/beneficiary-portal';
        default: return '/';
    }
}

// ─── App ──────────────────────────────────────────────────────────
const app = createApp({
    setup() {
        const user = computed(() => store.user);
        const isLoginPage = computed(() => {
            const p = router.currentRoute.value.path;
            return p === '/login' || p === '/apply' || p === '/apply/beneficiary';
        });
        const isSidebarCollapsed = Vue.ref(false);

        const logout = () => {
            store.clearUser();
            router.push('/login');
        };

        const toggleSidebar = () => {
            isSidebarCollapsed.value = !isSidebarCollapsed.value;
        };

        // After login, redirect to role-appropriate home
        const handleLoginSuccess = (userData, token) => {
            store.setUser(userData, token);
            const home = getRoleHome(userData.role);
            router.push(home);
        };

        // Verify Token on Load
        const checkAuth = async () => {
            if (store.token) {
                try {
                    await axios.get('/check-auth');
                } catch (error) {
                    logout();
                }
            }
        };
        checkAuth();

        return {
            user,
            logout,
            isLoginPage,
            isSidebarCollapsed,
            toggleSidebar,
            handleLoginSuccess,
        };
    },
    template: `
    <div class="app-wrapper">
        <toast-notifications />
        <template v-if="!isLoginPage">
            <sidebar-component
                :user="user"
                :collapsed="isSidebarCollapsed"
                @logout="logout"
                @toggle-sidebar="toggleSidebar"
            />
            <main class="main-content" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
                <router-view @login-success="handleLoginSuccess" />
            </main>
        </template>
        <template v-else>
            <router-view @login-success="handleLoginSuccess" />
        </template>
    </div>
    `
});

app.component('sidebar-component', Sidebar);
app.component('toast-notifications', Toast);
app.component('daily-verse', DailyVerse);
app.use(router);
app.mount('#app');
