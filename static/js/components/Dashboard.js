import { store } from '../store.js';

export default {
    template: `
    <div class="dashboard-container page-fade-in">
        <div style="margin-bottom: 2rem;">
            <h1 style="font-size: 2rem; margin-bottom: 0.5rem; color: var(--primary-color);">Overview</h1>
            <p style="color: var(--text-muted); font-size: 1.1rem;">Welcome back, {{ user?.name }}! Here's what's happening today.</p>
        </div>

        <div class="verse-of-the-day glass-card" style="margin-bottom: 2.5rem; padding: 1.75rem; border-left: 4px solid var(--primary-color);">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                <i data-lucide="book-open" style="color:var(--primary-color);width:20px;height:20px;"></i>
                <h3 style="font-size: 1.1rem; color: var(--primary-color); margin: 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Verse of the Day</h3>
            </div>
            <p style="font-size: 1.25rem; font-style: italic; color: var(--text-color); margin: 0.75rem 0; line-height: 1.6;">"{{ dailyVerse.text }}"</p>
            <p style="font-size: 0.95rem; color: var(--text-muted); margin: 0; font-weight: 600;">— {{ dailyVerse.ref }}</p>
        </div>

        <div class="dashboard-grid">
            <!-- HR Module (Admin only) -->
            <div class="dashboard-card" v-if="user?.role === 'Admin'" @click="$router.push('/hr')">
                <div class="card-banner" style="background: linear-gradient(135deg, #a5b4fc, #818cf8); position:relative; overflow:hidden;">
                    <div class="card-icon-wrapper glass-icon">
                        <i data-lucide="users" style="color:white;width:28px;height:28px;"></i>
                    </div>
                </div>
                <div class="card-body">
                    <h3 class="card-title">HR Management</h3>
                    <p class="card-desc">Manage Human Resource profiles, access control, and department structures.</p>
                    <div class="card-footer"><span>Manage HR</span><span class="card-arrow">→</span></div>
                </div>
            </div>

            <!-- Employee Module (Admin & HR) -->
            <div class="dashboard-card" v-if="['Admin', 'HR'].includes(user?.role)" @click="$router.push('/employee')">
                <div class="card-banner" style="background: linear-gradient(135deg, #93c5fd, #60a5fa); position:relative; overflow:hidden;">
                    <div class="card-icon-wrapper glass-icon">
                        <i data-lucide="briefcase" style="color:white;width:28px;height:28px;"></i>
                    </div>
                </div>
                <div class="card-body">
                    <h3 class="card-title">Employees</h3>
                    <p class="card-desc">Track employee records, assignments, personal details, and performance.</p>
                    <div class="card-footer"><span>View Employees</span><span class="card-arrow">→</span></div>
                </div>
            </div>

            <!-- Donor Module (Admin, HR, Donor) -->
            <div class="dashboard-card" v-if="['Admin', 'HR', 'Donor'].includes(user?.role)" @click="$router.push('/donor')">
                <div class="card-banner" style="background: linear-gradient(135deg, #f9a8d4, #f472b6); position:relative; overflow:hidden;">
                    <div class="card-icon-wrapper glass-icon">
                        <i data-lucide="hand-coins" style="color:white;width:28px;height:28px;"></i>
                    </div>
                </div>
                <div class="card-body">
                    <h3 class="card-title">Donors</h3>
                    <p class="card-desc">Manage donor records, track contributions, and maintaining relationships.</p>
                    <div class="card-footer"><span>View Donors</span><span class="card-arrow">→</span></div>
                </div>
            </div>

            <!-- Volunteer Module (Admin, HR, Volunteer) -->
            <div class="dashboard-card" v-if="['Admin', 'HR', 'Volunteer'].includes(user?.role)" @click="$router.push('/volunteer')">
                <div class="card-banner" style="background: linear-gradient(135deg, #fcd34d, #fbbf24); position:relative; overflow:hidden;">
                    <div class="card-icon-wrapper glass-icon">
                        <i data-lucide="heart-handshake" style="color:white;width:28px;height:28px;"></i>
                    </div>
                </div>
                <div class="card-body">
                    <h3 class="card-title">Volunteers</h3>
                    <p class="card-desc">Coordinate volunteers, schedule events, and manage beneficiary programs.</p>
                    <div class="card-footer"><span>Manage Volunteers</span><span class="card-arrow">→</span></div>
                </div>
            </div>

            <!-- Projects Module (Everyone) -->
            <div class="dashboard-card" @click="$router.push('/projects')">
                <div class="card-banner" style="background: linear-gradient(135deg, #6ee7b7, #34d399); position:relative; overflow:hidden;">
                    <div class="card-icon-wrapper glass-icon">
                        <i data-lucide="folder-kanban" style="color:white;width:28px;height:28px;"></i>
                    </div>
                </div>
                <div class="card-body">
                    <h3 class="card-title">Projects</h3>
                    <p class="card-desc">Monitor ongoing projects, milestones, and impact assessments.</p>
                    <div class="card-footer"><span>View Projects</span><span class="card-arrow">→</span></div>
                </div>
            </div>

            <!-- Finance Module -->
            <div class="dashboard-card" @click="$router.push('/finance')">
                <div class="card-banner" style="background: linear-gradient(135deg, #7dd3fc, #38bdf8); position:relative; overflow:hidden;">
                    <div class="card-icon-wrapper glass-icon">
                        <i data-lucide="wallet" style="color:white;width:28px;height:28px;"></i>
                    </div>
                </div>
                <div class="card-body">
                    <h3 class="card-title">Finance</h3>
                    <p class="card-desc">Track budgets, expenses, and financial reports.</p>
                    <div class="card-footer"><span>View Finance</span><span class="card-arrow">→</span></div>
                </div>
            </div>

            <!-- Analytics Module -->
            <div class="dashboard-card" @click="$router.push('/analytics')">
                <div class="card-banner" style="background: linear-gradient(135deg, #c4b5fd, #a78bfa); position:relative; overflow:hidden;">
                    <div class="card-icon-wrapper glass-icon">
                        <i data-lucide="bar-chart-3" style="color:white;width:28px;height:28px;"></i>
                    </div>
                </div>
                <div class="card-body">
                    <h3 class="card-title">Analytics</h3>
                    <p class="card-desc">Visual insights and data visualization of organization performance.</p>
                    <div class="card-footer"><span>View Analytics</span><span class="card-arrow">→</span></div>
                </div>
            </div>

            <!-- Logs Module (Admin Only) -->
            <div class="dashboard-card" v-if="user?.role === 'Admin'" @click="$router.push('/activity_logs')">
                <div class="card-banner" style="background: linear-gradient(135deg, #fca5a5, #f87171); position:relative; overflow:hidden;">
                    <div class="card-icon-wrapper glass-icon">
                        <i data-lucide="scroll-text" style="color:white;width:28px;height:28px;"></i>
                    </div>
                </div>
                <div class="card-body">
                    <h3 class="card-title">Activity Logs</h3>
                    <p class="card-desc">Audit trails and system activity history for security.</p>
                    <div class="card-footer"><span>View Logs</span><span class="card-arrow">→</span></div>
                </div>
            </div>
        </div>
    </div>
    `,
    setup() {
        const verses = [
            { text: "For I know the plans I have for you, plans to prosper you and not to harm you, plans to give you hope and a future.", ref: "Jeremiah 29:11" },
            { text: "I can do all things through him who strengthens me.", ref: "Philippians 4:13" },
            { text: "Trust in the LORD with all your heart, and do not lean on your own understanding.", ref: "Proverbs 3:5" },
            { text: "The LORD is my shepherd; I shall not want.", ref: "Psalm 23:1" },
            { text: "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control.", ref: "Galatians 5:22-23" },
            { text: "Be strong and courageous. Do not be frightened, and do not be dismayed, for the LORD your God is with you wherever you go.", ref: "Joshua 1:9" },
            { text: "Come to me, all who labor and are heavy laden, and I will give you rest.", ref: "Matthew 11:28" },
            { text: "And we know that for those who love God all things work together for good.", ref: "Romans 8:28" },
            { text: "Rejoice always, pray without ceasing, give thanks in all circumstances.", ref: "1 Thessalonians 5:16-18" },
            { text: "But they who wait for the LORD shall renew their strength; they shall mount up with wings like eagles.", ref: "Isaiah 40:31" },
            { text: "Let all that you do be done in love.", ref: "1 Corinthians 16:14" },
            { text: "Jesus Christ is the same yesterday and today and forever.", ref: "Hebrews 13:8" },
            { text: "Cast all your anxiety on him because he cares for you.", ref: "1 Peter 5:7" },
            { text: "Your word is a lamp to my feet and a light to my path.", ref: "Psalm 119:105" },
            { text: "If God is for us, who can be against us?", ref: "Romans 8:31" },
            { text: "The steadfast love of the LORD never ceases; his mercies never come to an end.", ref: "Lamentations 3:22" }
        ];

        const getDailyVerse = () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 0);
            const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
            const oneDay = 1000 * 60 * 60 * 24;
            const dayOfYear = Math.floor(diff / oneDay);
            return verses[dayOfYear % verses.length];
        };

        const dailyVerse = Vue.ref(getDailyVerse());

        Vue.onMounted(() => {
            if (window.lucide) {
                window.lucide.createIcons();
            }
        });
        
        return {
            user: store.user,
            dailyVerse
        }
    }
}