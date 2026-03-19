/**
 * Global Toast Notification System
 * Usage: window.toast('Message here', 'success' | 'error' | 'warning' | 'info')
 */
export default {
    template: `
    <teleport to="body">
        <transition-group name="toast" tag="div" class="toast-container">
            <div
                v-for="t in toasts"
                :key="t.id"
                class="toast-item"
                :class="'toast-' + t.type"
                @click="remove(t.id)"
            >
                <span class="toast-icon">{{ icons[t.type] }}</span>
                <span class="toast-msg">{{ t.message }}</span>
            </div>
        </transition-group>
    </teleport>
    `,
    data() {
        return {
            toasts: [],
            icons: { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }
        };
    },
    mounted() {
        window.toast = (message, type = 'info') => {
            const id = Date.now() + Math.random();
            this.toasts.push({ id, message, type });
            setTimeout(() => this.remove(id), 3500);
        };
    },
    methods: {
        remove(id) {
            this.toasts = this.toasts.filter(t => t.id !== id);
        }
    }
}
