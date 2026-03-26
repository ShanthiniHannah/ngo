import { store } from '../store.js';

export default {
    emits: ['login-success'],
    template: `
    <div class="lp-root">

        <!-- Animated canvas background -->
        <canvas class="lp-canvas" ref="canvas"></canvas>

        <!-- Floating orbs -->
        <div class="lp-orb lp-orb1"></div>
        <div class="lp-orb lp-orb2"></div>
        <div class="lp-orb lp-orb3"></div>

        <!-- Centered Card -->
        <div class="lp-wrapper">

            <!-- LEFT: Branding -->
            <div class="lp-left">
                <div class="lp-brand-wrap">
                    <div class="lp-leaf"></div>
                    <h1 class="lp-title">ArcMission</h1>
                    <p class="lp-tagline">"For we are God's handiwork, created in Christ Jesus to do good works."<br>— Ephesians 2:10</p>
                </div>
                <div class="lp-roles">
                    <div class="lpr-chip role-admin">Admin</div>
                    <div class="lpr-chip role-hr">HR</div>
                    <div class="lpr-chip role-employee">Employee</div>
                    <div class="lpr-chip role-volunteer">Volunteer</div>
                    <div class="lpr-chip role-donor">Donor</div>
                    <div class="lpr-chip role-beneficiary">Beneficiary</div>
                </div>
                <div class="lp-apply-box">
                    <p>New here?</p>
                    <router-link to="/apply" class="lp-apply-btn">Apply to Join</router-link>
                    <router-link to="/apply/beneficiary" class="lp-apply-btn" style="margin-top:10px; background: linear-gradient(135deg,#f59e0b,#ef4444);">Register as Beneficiary</router-link>
                </div>
            </div>


            <!-- RIGHT: Form Area -->
            <div class="lp-right">

                <!-- ── LOGIN VIEW ────────────────────────── -->
                <div class="lp-form-panel" v-if="view === 'login'">
                    <div class="lp-form-header">
                        <h2>Welcome Back</h2>
                        <p>Sign in to continue to your portal</p>
                    </div>

                    <form @submit.prevent="handleLogin" autocomplete="on">
                        <div class="lp-field">
                            <span class="lp-field-icon">&#9993;</span>
                            <input id="login-email" type="email" v-model="email" placeholder="Email address" required autocomplete="email">
                        </div>
                        <div class="lp-field">
                            <span class="lp-field-icon">&#128274;</span>
                            <input id="login-password" :type="showPw ? 'text' : 'password'" v-model="password" placeholder="Password" required autocomplete="current-password">
                            <button type="button" class="lp-eye" @click="showPw=!showPw" tabindex="-1">{{ showPw ? 'Hide' : 'Show' }}</button>
                        </div>

                        <div class="lp-row">
                            <label class="lp-remember"><input type="checkbox" v-model="remember"> Remember me</label>
                            <button type="button" class="lp-forgot-link" @click="view='forgot'">Forgot password?</button>
                        </div>

                        <div class="lp-error" v-if="error">{{ error }}</div>

                        <button type="submit" class="lp-submit" :disabled="loading">
                            <span v-if="loading" class="lp-spinner"></span>
                            <span v-else>Sign In →</span>
                        </button>
                    </form>
                </div>

                <!-- ── OTP VERIFICATION VIEW ───────────────────────── -->
                <div class="lp-form-panel" v-else-if="view === 'otp'">
                    <button class="lp-back" @click="view='login'">← Back to Login</button>
                    <div class="lp-form-header">
                        <div class="lp-fp-icon">&#128241;</div>
                        <h2>Phone Verification</h2>
                        <p>Enter the 6-digit OTP sent to<br><strong>{{ otpPhoneHint }}</strong></p>
                    </div>

                    <div class="lp-otp-timer" :class="{ 'lp-otp-expired': otpSecondsLeft === 0 }">
                        <span v-if="otpSecondsLeft > 0">OTP expires in {{ otpTimerDisplay }}</span>
                        <span v-else style="color:#ef4444;">OTP expired — please resend</span>
                    </div>

                    <form @submit.prevent="verifyLoginOtp">
                        <div class="lp-field">
                            <span class="lp-field-icon">&#128272;</span>
                            <input
                                id="otp-input"
                                type="text"
                                :value="otpCode"
                                @input="otpCode = $event.target.value.replace(/\\D/g, '').slice(0, 6)"
                                placeholder="Enter 6-digit OTP"
                                maxlength="10"
                                autocomplete="one-time-code"
                                required
                            >
                        </div>
                        <div class="lp-error" v-if="otpError">{{ otpError }}</div>
                        <button type="submit" class="lp-submit" :disabled="otpLoading || otpSecondsLeft === 0">
                            <span v-if="otpLoading" class="lp-spinner"></span>
                            <span v-else>Verify OTP</span>
                        </button>
                    </form>

                    <div style="text-align:center;margin-top:16px;">
                        <button
                            class="lp-forgot-link"
                            @click="resendOtp"
                            :disabled="resendCooldown > 0 || resendLoading"
                            style="font-size:0.9rem;"
                        >
                            <span v-if="resendLoading" class="lp-spinner" style="width:12px;height:12px;"></span>
                            <span v-else-if="resendCooldown > 0">Resend OTP in {{ resendCooldown }}s</span>
                            <span v-else>Resend OTP</span>
                        </button>
                    </div>
                </div>

                <!-- ── FORGOT PASSWORD VIEW ──────────────── -->
                <div class="lp-form-panel" v-else-if="view === 'forgot'">
                    <button class="lp-back" @click="view='login'">← Back to Login</button>
                    <div class="lp-form-header">
                        <div class="lp-fp-icon">&#128273;</div>
                        <h2>Forgot Password?</h2>
                        <p>Enter your registered email and we'll send you a password reset link.</p>
                    </div>
                    <form @submit.prevent="handleForgot">
                        <div class="lp-field">
                            <span class="lp-field-icon">&#9993;</span>
                            <input type="email" v-model="forgotEmail" placeholder="Your registered email" required>
                        </div>
                        <div class="lp-error" v-if="forgotError">{{ forgotError }}</div>
                        <div class="lp-success" v-if="forgotSuccess">{{ forgotSuccess }}</div>
                        <button type="submit" class="lp-submit" :disabled="forgotLoading">
                            <span v-if="forgotLoading" class="lp-spinner"></span>
                            <span v-else>Send Reset Link</span>
                        </button>
                    </form>
                </div>

                <!-- ── SET PASSWORD VIEW ── -->
                <div class="lp-form-panel" v-else-if="view === 'set-password'">
                    <div class="lp-form-header">
                        <div class="lp-fp-icon">&#127881;</div>
                        <h2>Welcome to ArcMission!</h2>
                        <p>Please set a password to activate your account.</p>
                    </div>
                    <form @submit.prevent="handleSetPassword">
                        <div class="lp-field">
                            <span class="lp-field-icon">&#128274;</span>
                            <input :type="showNew ? 'text' : 'password'" v-model="newPassword" placeholder="Create a password (min 6 chars)" required minlength="6">
                            <button type="button" class="lp-eye" @click="showNew=!showNew" tabindex="-1">{{ showNew ? 'Hide' : 'Show' }}</button>
                        </div>
                        <div class="lp-field">
                            <span class="lp-field-icon">&#128274;</span>
                            <input :type="showNew ? 'text' : 'password'" v-model="confirmPassword" placeholder="Confirm your password" required>
                        </div>
                        <div class="lp-error" v-if="resetError">{{ resetError }}</div>
                        <div class="lp-success" v-if="resetSuccess">{{ resetSuccess }}</div>
                        <button type="submit" class="lp-submit" :disabled="resetLoading || !!resetSuccess">
                            <span v-if="resetLoading" class="lp-spinner"></span>
                            <span v-else>Activate My Account</span>
                        </button>
                    </form>
                </div>

                <!-- ── RESET PASSWORD VIEW ──────────────── -->
                <div class="lp-form-panel" v-else-if="view === 'reset'">
                    <button class="lp-back" @click="view='login'">← Back to Login</button>
                    <div class="lp-form-header">
                        <div class="lp-fp-icon">&#128737;</div>
                        <h2>Set New Password</h2>
                        <p>Choose a strong new password for your account.</p>
                    </div>
                    <form @submit.prevent="handleReset">
                        <div class="lp-field">
                            <span class="lp-field-icon">&#128274;</span>
                            <input :type="showNew ? 'text' : 'password'" v-model="newPassword" placeholder="New password (min 6 chars)" required minlength="6">
                            <button type="button" class="lp-eye" @click="showNew=!showNew" tabindex="-1">{{ showNew ? 'Hide' : 'Show' }}</button>
                        </div>
                        <div class="lp-field">
                            <span class="lp-field-icon">&#128274;</span>
                            <input :type="showNew ? 'text' : 'password'" v-model="confirmPassword" placeholder="Confirm new password" required>
                        </div>
                        <div class="lp-error" v-if="resetError">{{ resetError }}</div>
                        <div class="lp-success" v-if="resetSuccess">{{ resetSuccess }}</div>
                        <button type="submit" class="lp-submit" :disabled="resetLoading || !!resetSuccess">
                            <span v-if="resetLoading" class="lp-spinner"></span>
                            <span v-else>Reset Password</span>
                        </button>
                    </form>
                </div>

            </div>
        </div>
    </div>
    `,
    data() {
        return {
            view: 'login',
            email: '', password: '', error: null, loading: false,
            showPw: false, remember: false,
            otpPhoneHint: '',
            otpCode: '',
            otpError: '',
            otpLoading: false,
            otpSecondsLeft: 0,
            _otpTimerInterval: null,
            resendCooldown: 0,
            resendLoading: false,
            _pendingPhone: '',
            _pendingToken: null,
            forgotEmail: '', forgotError: '', forgotSuccess: '', forgotLoading: false,
            newPassword: '', confirmPassword: '', resetError: '', resetSuccess: '',
            resetLoading: false, showNew: false,
            resetToken: null,
        };
    },
    mounted() {
        this.initCanvas();
        const hash = window.location.hash;
        const resetMatch = hash.match(/reset-token=([^&]+)/);
        if (resetMatch) {
            this.resetToken = resetMatch[1];
            this.view = 'reset';
            return;
        }
        const setMatch = hash.match(/set-token=([^&]+)/);
        if (setMatch) {
            this.resetToken = setMatch[1];
            this.view = 'set-password';
        }
    },
    beforeUnmount() {
        if (this._canvasRAF) cancelAnimationFrame(this._canvasRAF);
        clearInterval(this._otpTimerInterval);
    },
    computed: {
        otpTimerDisplay() {
            const m = Math.floor(this.otpSecondsLeft / 60).toString().padStart(2, '0');
            const s = (this.otpSecondsLeft % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        }
    },
    methods: {
        async handleLogin() {
            this.loading = true; this.error = null;
            try {
                const res = await axios.post('/login', { email: this.email, password: this.password });
                if (res.data.otp_required) {
                    this._pendingPhone = res.data.phone_number;
                    this._pendingToken = res.data.partial_token;
                    this.otpPhoneHint  = res.data.phone_hint;
                    this.otpCode = ''; this.otpError = '';
                    this.view = 'otp';
                    await this.sendLoginOtp();
                } else {
                    this.$emit('login-success', res.data.user, res.data.token);
                }
            } catch (err) {
                this.error = err.response?.data?.error || 'Invalid email or password.';
            } finally { this.loading = false; }
        },

        async sendLoginOtp() {
            try {
                const res = await axios.post('/otp/send', { phone_number: this._pendingPhone });
                this.otpSecondsLeft = res.data.expires_in || 300;
                this.startOtpTimer();
                this.resendCooldown = 30;
                this.startResendCooldown();
            } catch (err) {
                this.otpError = err.response?.data?.error || 'Could not send OTP.';
            }
        },

        async verifyLoginOtp() {
            this.otpLoading = true; this.otpError = '';
            try {
                await axios.post('/otp/verify', { phone_number: this._pendingPhone, otp: this.otpCode });
                const res = await axios.post('/login/complete-otp', { partial_token: this._pendingToken });
                clearInterval(this._otpTimerInterval);
                this.$emit('login-success', res.data.user, res.data.token);
            } catch (err) {
                this.otpError = err.response?.data?.error || 'OTP verification failed.';
            } finally { this.otpLoading = false; }
        },

        async resendOtp() {
            this.resendLoading = true; this.otpError = '';
            try {
                const res = await axios.post('/otp/resend', { phone_number: this._pendingPhone });
                this.otpSecondsLeft = res.data.expires_in || 300;
                clearInterval(this._otpTimerInterval);
                this.startOtpTimer();
                this.resendCooldown = 30;
                this.startResendCooldown();
            } catch (err) {
                this.otpError = err.response?.data?.error || 'Could not resend OTP.';
            } finally { this.resendLoading = false; }
        },

        startOtpTimer() {
            clearInterval(this._otpTimerInterval);
            this._otpTimerInterval = setInterval(() => {
                if (this.otpSecondsLeft > 0) this.otpSecondsLeft--;
                else clearInterval(this._otpTimerInterval);
            }, 1000);
        },

        startResendCooldown() {
            const cd = setInterval(() => {
                if (this.resendCooldown > 0) this.resendCooldown--;
                else clearInterval(cd);
            }, 1000);
        },

        async handleForgot() {
            this.forgotLoading = true; this.forgotError = ''; this.forgotSuccess = '';
            try {
                const res = await axios.post('/forgot-password', { email: this.forgotEmail });
                this.forgotSuccess = res.data.message;
            } catch (err) {
                this.forgotError = err.response?.data?.error || 'Could not send reset email. Please try again.';
            } finally { this.forgotLoading = false; }
        },

        async handleSetPassword() {
            if (this.newPassword !== this.confirmPassword) { this.resetError = 'Passwords do not match.'; return; }
            if (this.newPassword.length < 6) { this.resetError = 'Password must be at least 6 characters.'; return; }
            this.resetLoading = true; this.resetError = '';
            try {
                await axios.post('/set-password', { token: this.resetToken, new_password: this.newPassword });
                this.resetSuccess = 'Account activated! Redirecting to login...';
                setTimeout(() => { this.view = 'login'; window.location.hash = '/login'; }, 2500);
            } catch (err) {
                this.resetError = err.response?.data?.error || 'Activation failed. The link may have expired.';
            } finally { this.resetLoading = false; }
        },

        async handleReset() {
            if (this.newPassword !== this.confirmPassword) { this.resetError = 'Passwords do not match.'; return; }
            if (this.newPassword.length < 6) { this.resetError = 'Password must be at least 6 characters.'; return; }
            this.resetLoading = true; this.resetError = '';
            try {
                await axios.post('/reset-password', { token: this.resetToken, new_password: this.newPassword });
                this.resetSuccess = 'Password reset successfully! Redirecting to login...';
                setTimeout(() => { this.view = 'login'; window.location.hash = '/login'; }, 2500);
            } catch (err) {
                this.resetError = err.response?.data?.error || 'Reset failed. The link may have expired.';
            } finally { this.resetLoading = false; }
        },

        initCanvas() {
            const canvas = this.$refs.canvas;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            let W, H, particles;

            const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
            resize();
            window.addEventListener('resize', resize);

            const makeParticles = () => {
                particles = Array.from({ length: 60 }, () => ({
                    x: Math.random() * W, y: Math.random() * H,
                    r: Math.random() * 2 + 0.5,
                    dx: (Math.random() - 0.5) * 0.4,
                    dy: (Math.random() - 0.5) * 0.4,
                    o: Math.random() * 0.5 + 0.1
                }));
            };
            makeParticles();

            const draw = () => {
                ctx.clearRect(0, 0, W, H);
                for (let i = 0; i < particles.length; i++) {
                    for (let j = i + 1; j < particles.length; j++) {
                        const dx = particles[i].x - particles[j].x;
                        const dy = particles[i].y - particles[j].y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 120) {
                            ctx.beginPath();
                            ctx.strokeStyle = `rgba(255,255,255,${0.08 * (1 - dist / 120)})`;
                            ctx.lineWidth = 0.5;
                            ctx.moveTo(particles[i].x, particles[i].y);
                            ctx.lineTo(particles[j].x, particles[j].y);
                            ctx.stroke();
                        }
                    }
                    const p = particles[i];
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255,255,255,${p.o})`;
                    ctx.fill();
                    p.x += p.dx; p.y += p.dy;
                    if (p.x < 0 || p.x > W) p.dx *= -1;
                    if (p.y < 0 || p.y > H) p.dy *= -1;
                }
                this._canvasRAF = requestAnimationFrame(draw);
            };
            draw();
        }
    }
}