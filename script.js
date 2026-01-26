// Configuration Manager
class ConfigManager {
    constructor() {
        this.configKey = 'azureOpenAIConfig';
        this.loadConfig();
    }

    saveConfig() {
        const config = {
            apiEndpoint: document.getElementById('apiEndpoint').value,
            apiKey: document.getElementById('apiKey').value,
            deploymentName: document.getElementById('deploymentName').value,
            apiVersion: document.getElementById('apiVersion').value,
            size: document.getElementById('size').value,
            quality: document.getElementById('quality').value,
            style: document.getElementById('style').value,
            numImages: document.getElementById('numImages').value
        };
        localStorage.setItem(this.configKey, JSON.stringify(config));
        showStatus('Configuration saved successfully!', 'success');
    }

    loadConfig() {
        const savedConfig = localStorage.getItem(this.configKey);
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            if (config.apiEndpoint) document.getElementById('apiEndpoint').value = config.apiEndpoint;
            if (config.apiKey) document.getElementById('apiKey').value = config.apiKey;
            if (config.deploymentName) document.getElementById('deploymentName').value = config.deploymentName;
            if (config.apiVersion) document.getElementById('apiVersion').value = config.apiVersion;
            if (config.size) document.getElementById('size').value = config.size;
            if (config.quality) document.getElementById('quality').value = config.quality;
            if (config.style) document.getElementById('style').value = config.style;
            if (config.numImages) document.getElementById('numImages').value = config.numImages;
        }
    }

    getConfig() {
        return {
            apiEndpoint: document.getElementById('apiEndpoint').value.trim(),
            apiKey: document.getElementById('apiKey').value.trim(),
            deploymentName: document.getElementById('deploymentName').value.trim(),
            apiVersion: document.getElementById('apiVersion').value.trim(),
            prompt: document.getElementById('prompt').value.trim(),
            size: document.getElementById('size').value,
            quality: document.getElementById('quality').value,
            style: document.getElementById('style').value,
            n: parseInt(document.getElementById('numImages').value)
        };
    }

    validateConfig(config) {
        if (!config.apiEndpoint) {
            throw new Error('Azure OpenAI Endpoint is required');
        }
        if (!config.apiKey) {
            throw new Error('API Key is required');
        }
        if (!config.deploymentName) {
            throw new Error('Deployment Name is required');
        }
        if (!config.apiVersion) {
            throw new Error('API Version is required');
        }
        if (!config.prompt) {
            throw new Error('Prompt is required');
        }
        if (config.n < 1 || config.n > 10) {
            throw new Error('Number of images must be between 1 and 10');
        }
    }
}

// Image Generator
class ImageGenerator {
    constructor(configManager) {
        this.configManager = configManager;
        this.generatedImages = [];
    }

    async generateImages() {
        const config = this.configManager.getConfig();
        
        try {
            this.configManager.validateConfig(config);
        } catch (error) {
            showStatus(error.message, 'error');
            return;
        }

        // Show loading state
        showLoading(true);
        hideStatus();

        try {
            // Build the Azure OpenAI API URL
            const endpoint = config.apiEndpoint.replace(/\/$/, ''); // Remove trailing slash
            const url = `${endpoint}/openai/deployments/${config.deploymentName}/images/generations?api-version=${config.apiVersion}`;

            // Prepare request body according to Azure OpenAI API specs
            const requestBody = {
                prompt: config.prompt,
                size: config.size,
                n: config.n,
                quality: config.quality,
                style: config.style
            };

            console.log('Generating images with config:', requestBody);

            // Make API call
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': config.apiKey
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            // Process and display images
            if (data.data && data.data.length > 0) {
                this.displayImages(data.data, config.prompt);
                showStatus(`Successfully generated ${data.data.length} image(s)!`, 'success');
            } else {
                throw new Error('No images returned from API');
            }

        } catch (error) {
            console.error('Error generating images:', error);
            showStatus(`Error: ${error.message}`, 'error');
        } finally {
            showLoading(false);
        }
    }

    displayImages(images, prompt) {
        const gallery = document.getElementById('imageGallery');
        
        images.forEach((imageData, index) => {
            const imageCard = this.createImageCard(imageData, prompt, index);
            gallery.insertBefore(imageCard, gallery.firstChild);
        });

        this.generatedImages.push(...images);
    }

    createImageCard(imageData, prompt, index) {
        const card = document.createElement('div');
        card.className = 'image-card';

        // Get the image URL (could be url or b64_json depending on response_format)
        const imageUrl = imageData.url || (imageData.b64_json ? `data:image/png;base64,${imageData.b64_json}` : '');

        card.innerHTML = `
            <img src="${imageUrl}" alt="${prompt}" loading="lazy">
            <div class="image-card-info">
                <p class="image-card-prompt">${this.escapeHtml(prompt)}</p>
                <div class="image-card-actions">
                    <button onclick="downloadImage('${imageUrl}', 'generated-image-${Date.now()}-${index}.png')">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" stroke-width="2"/>
                            <path d="M2 12V13C2 14.1 2.9 15 4 15H12C13.1 15 14 14.1 14 13V12" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        Download
                    </button>
                    <button onclick="copyToClipboard('${this.escapeHtml(prompt).replace(/'/g, "\\'")}')">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M10 2H4C2.9 2 2 2.9 2 4V12" stroke="currentColor" stroke-width="2"/>
                            <path d="M6 4H12C13.1 4 14 4.9 14 6V12C14 13.1 13.1 14 12 14H6C4.9 14 4 13.1 4 12V6C4 4.9 4.9 4 6 4Z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        Copy Prompt
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// UI Helper Functions
function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    }
}

function hideStatus() {
    const statusEl = document.getElementById('statusMessage');
    statusEl.style.display = 'none';
}

function showLoading(show) {
    const loadingEl = document.getElementById('loadingSpinner');
    const generateBtn = document.getElementById('generateBtn');
    
    loadingEl.style.display = show ? 'block' : 'none';
    generateBtn.disabled = show;
    
    if (show) {
        generateBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="animation: spin 1s linear infinite">
                <path d="M10 2V6M10 14V18M18 10H14M6 10H2" stroke="currentColor" stroke-width="2"/>
            </svg>
            Generating...
        `;
    } else {
        generateBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L2 8L10 14L18 8L10 2Z" fill="currentColor"/>
                <path d="M2 12L10 18L18 12" stroke="currentColor" stroke-width="2"/>
            </svg>
            Generate Image
        `;
    }
}

// Global utility functions
async function downloadImage(url, filename) {
    try {
        showStatus('Downloading image...', 'info');
        
        // For blob URLs or data URLs
        if (url.startsWith('blob:') || url.startsWith('data:')) {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showStatus('Image downloaded successfully!', 'success');
            return;
        }

        // For remote URLs, we need to fetch and create a blob
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(blobUrl);
        showStatus('Image downloaded successfully!', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showStatus('Failed to download image. You can right-click and save the image instead.', 'error');
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            showStatus('Prompt copied to clipboard!', 'success');
        })
        .catch(err => {
            console.error('Failed to copy:', err);
            showStatus('Failed to copy prompt', 'error');
        });
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    const configManager = new ConfigManager();
    const imageGenerator = new ImageGenerator(configManager);

    // Event Listeners
    document.getElementById('generateBtn').addEventListener('click', () => {
        imageGenerator.generateImages();
    });

    document.getElementById('saveConfigBtn').addEventListener('click', () => {
        configManager.saveConfig();
    });

    document.getElementById('loadConfigBtn').addEventListener('click', () => {
        configManager.loadConfig();
        showStatus('Configuration loaded from storage', 'info');
    });

    // Allow Enter key in prompt textarea to generate
    document.getElementById('prompt').addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            imageGenerator.generateImages();
        }
    });

    // Show info message on load
    showStatus('Configure your Azure OpenAI settings and start generating images!', 'info');
    
    console.log('AI Image Generator initialized successfully');
});
