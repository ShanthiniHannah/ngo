export default {
    template: `
        <div class="bible-banner" style="margin-bottom: 24px; padding: 1.25rem 2rem; background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08)); border: 1px solid rgba(168, 85, 247, 0.15); border-radius: 12px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 0.5rem; justify-content: center; align-items: center;">
            <i data-lucide="book-open" style="width: 24px; height: 24px; color: #8b5cf6; margin-bottom: 4px;"></i>
            <span class="bible-quote" style="font-size: 1.1rem; font-weight: 500; font-style: italic; color: var(--text-color);">"{{ verse.text }}"</span>
            <span class="bible-ref" style="font-size: 0.9rem; font-weight: 700; color: #8b5cf6; letter-spacing: 0.5px;">— {{ verse.reference }}</span>
        </div>
    `,
    setup() {
        const verse = Vue.ref({
            text: "Loading...",
            reference: "..."
        });

        const fetchVerse = async () => {
            try {
                const res = await fetch('/api/bible-verse/daily');
                const data = await res.json();
                if (data.text) {
                    verse.value = data;
                }
            } catch (err) {
                console.error("Verse fetch failed:", err);
            }
        };

        Vue.onMounted(() => {
            fetchVerse();
            // Lucide icons handling
            Vue.nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
        });

        return { verse };
    }
};
