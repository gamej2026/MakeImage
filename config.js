// Configuration placeholder
// This file will be auto-generated during GitHub Pages deployment with actual secrets
// For local development, you can manually set values here or use the UI to configure

window.GITHUB_CONFIG = {
    AZURE_OPENAI_ENDPOINT: '',
    DEPLOYMENT_NAME: '',
    API_KEY: ''
};

// Usage Tracker
class UsageTracker {
    constructor() {
        this.usageKey = 'imageGenerationUsage';
        this.totalCount = this.loadUsage();
        console.log('[UsageTracker] Initialized with total count:', this.totalCount);
    }

    loadUsage() {
        const saved = localStorage.getItem(this.usageKey);
        return saved ? parseInt(saved, 10) : 0;
    }

    saveUsage() {
        localStorage.setItem(this.usageKey, this.totalCount.toString());
        console.log('[UsageTracker] Saved usage count:', this.totalCount);
    }

    addImages(count) {
        this.totalCount += count;
        this.saveUsage();
        this.updateDisplay();
        console.log('[UsageTracker] Added', count, 'images. New total:', this.totalCount);
    }

    updateDisplay() {
        const displayElement = document.getElementById('totalUsageCount');
        if (displayElement) {
            displayElement.textContent = this.totalCount.toLocaleString();
            // Add a pulse animation when updated
            displayElement.style.animation = 'none';
            setTimeout(() => {
                displayElement.style.animation = 'pulse 0.5s ease';
            }, 10);
        }
    }

    getTotalCount() {
        return this.totalCount;
    }
}
