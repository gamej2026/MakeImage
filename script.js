// Configuration Manager
class ConfigManager {
    constructor() {
        this.configKey = 'azureOpenAIConfig';
        this.loadConfig();
        this.loadSecretsFromGitHub();
    }

    loadSecretsFromGitHub() {
        console.log('[ConfigManager] Checking for GitHub secrets...');
        // Check if config.js loaded GitHub secrets
        if (typeof window.GITHUB_CONFIG !== 'undefined') {
            console.log('[ConfigManager] GitHub secrets found, applying...');
            if (window.GITHUB_CONFIG.AZURE_OPENAI_ENDPOINT) {
                document.getElementById('apiEndpoint').value = window.GITHUB_CONFIG.AZURE_OPENAI_ENDPOINT;
                console.log('[ConfigManager] Applied AZURE_OPENAI_ENDPOINT from GitHub secrets');
            }
            if (window.GITHUB_CONFIG.API_KEY) {
                document.getElementById('apiKey').value = window.GITHUB_CONFIG.API_KEY;
                console.log('[ConfigManager] Applied API_KEY from GitHub secrets');
            }
        } else {
            console.log('[ConfigManager] No GitHub secrets found, using localStorage or manual config');
        }
        
        // Set hardcoded deployment name
        if (typeof window.DEPLOYMENT_NAME !== 'undefined') {
            document.getElementById('deploymentName').value = window.DEPLOYMENT_NAME;
            console.log('[ConfigManager] Applied hardcoded DEPLOYMENT_NAME:', window.DEPLOYMENT_NAME);
        } else {
            document.getElementById('deploymentName').value = 'gpt-image-1.5';
            console.log('[ConfigManager] Using default DEPLOYMENT_NAME: gpt-image-1.5');
        }
    }

    saveConfig() {
        console.log('[ConfigManager] Saving configuration...');
        const config = {
            apiEndpoint: document.getElementById('apiEndpoint').value,
            apiKey: document.getElementById('apiKey').value,
            deploymentName: document.getElementById('deploymentName').value,
            apiVersion: document.getElementById('apiVersion').value,
            size: document.getElementById('size').value,
            quality: document.getElementById('quality').value,
            style: document.getElementById('style').value,
            customStyle: document.getElementById('customStyle').value,
            numImages: document.getElementById('numImages').value
        };
        localStorage.setItem(this.configKey, JSON.stringify(config));
        console.log('[ConfigManager] Configuration saved successfully');
        showStatus('Configuration saved successfully!', 'success');
    }

    loadConfig() {
        console.log('[ConfigManager] Loading saved configuration...');
        const savedConfig = localStorage.getItem(this.configKey);
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            if (config.apiEndpoint) document.getElementById('apiEndpoint').value = config.apiEndpoint;
            if (config.apiKey) document.getElementById('apiKey').value = config.apiKey;
            if (config.deploymentName) document.getElementById('deploymentName').value = config.deploymentName;
            if (config.apiVersion) document.getElementById('apiVersion').value = config.apiVersion;
            if (config.size) document.getElementById('size').value = config.size;
            if (config.quality) document.getElementById('quality').value = config.quality;
            if (config.style) {
                document.getElementById('style').value = config.style;
                // Show custom style input if style is 'custom'
                if (config.style === 'custom') {
                    document.getElementById('customStyleGroup').style.display = 'block';
                }
            }
            if (config.customStyle) document.getElementById('customStyle').value = config.customStyle;
            if (config.numImages) document.getElementById('numImages').value = config.numImages;
            console.log('[ConfigManager] Configuration loaded from localStorage');
        } else {
            console.log('[ConfigManager] No saved configuration found');
        }
    }

    getConfig() {
        const styleValue = document.getElementById('style').value;
        const customStyle = document.getElementById('customStyle').value.trim();
        
        const config = {
            apiEndpoint: document.getElementById('apiEndpoint').value.trim(),
            apiKey: document.getElementById('apiKey').value.trim(),
            deploymentName: document.getElementById('deploymentName').value.trim(),
            apiVersion: document.getElementById('apiVersion').value.trim(),
            prompt: document.getElementById('prompt').value.trim(),
            size: document.getElementById('size').value,
            quality: document.getElementById('quality').value,
            style: styleValue,
            customStyle: customStyle,
            n: parseInt(document.getElementById('numImages').value),
            generationMode: document.getElementById('generationMode').value
        };
        console.log('[ConfigManager] Current configuration:', {
            ...config,
            apiKey: config.apiKey ? '[REDACTED]' : '[EMPTY]'
        });
        return config;
    }

    validateConfig(config) {
        console.log('[ConfigManager] Validating configuration...');
        if (!config.apiEndpoint) {
            throw new Error('Azure OpenAI Endpoint is required');
        }
        // Validate Azure OpenAI endpoint format
        if (!config.apiEndpoint.match(/^https:\/\/[a-zA-Z0-9-]+\.openai\.azure\.com\/?$/)) {
            throw new Error('Invalid Azure OpenAI Endpoint format. Expected: https://your-resource.openai.azure.com');
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
        if (config.style === 'custom' && !config.customStyle?.trim()) {
            throw new Error('Custom style description is required when using custom style');
        }
        if (config.n < 1 || config.n > 10) {
            throw new Error('Number of images must be between 1 and 10');
        }
        console.log('[ConfigManager] Configuration validation passed');
    }
}

// Image Generator
class ImageGenerator {
    constructor(configManager, usageTracker) {
        this.configManager = configManager;
        this.usageTracker = usageTracker;
        this.generatedImages = [];
        this.referenceImageBase64 = null;
    }

    setReferenceImage(base64Data) {
        console.log('[ImageGenerator] Setting reference image');
        this.referenceImageBase64 = base64Data;
    }

    clearReferenceImage() {
        console.log('[ImageGenerator] Clearing reference image');
        this.referenceImageBase64 = null;
    }

    async generateImages() {
        console.log('[ImageGenerator] ==================== STARTING IMAGE GENERATION ====================');
        const config = this.configManager.getConfig();
        
        try {
            console.log('[ImageGenerator] Step 1: Validating configuration...');
            this.configManager.validateConfig(config);
            console.log('[ImageGenerator] ✓ Configuration validated successfully');
        } catch (error) {
            console.error('[ImageGenerator] ✗ Configuration validation failed:', error.message);
            showStatus(error.message, 'error');
            return;
        }

        // Show loading state
        console.log('[ImageGenerator] Step 2: Showing loading UI...');
        showLoading(true);
        hideStatus();

        try {
            // Build the Azure OpenAI API URL
            const endpoint = config.apiEndpoint.replace(/\/$/, ''); // Remove trailing slash
            const url = `${endpoint}/openai/deployments/${config.deploymentName}/images/generations?api-version=${config.apiVersion}`;
            
            console.log('[ImageGenerator] Step 3: Building API request...');
            console.log('[ImageGenerator] API Endpoint:', url);

            // Build the prompt with style enhancements
            let enhancedPrompt = config.prompt.trim();
            let apiStyle = config.style;
            
            // Azure OpenAI only supports 'vivid' and 'natural' styles directly
            // For other styles, we enhance the prompt with style descriptions
            if (config.style !== 'vivid' && config.style !== 'natural') {
                const styleDescriptions = {
                    'artistic': 'in an artistic and painterly style',
                    'photorealistic': 'in a photorealistic style, like a high-quality photograph',
                    'cinematic': 'in a cinematic style with dramatic lighting and composition',
                    'anime': 'in anime style, Japanese animation art',
                    'watercolor': 'in a soft watercolor painting style',
                    'oil-painting': 'in a classic oil painting style',
                    'sketch': 'as a hand-drawn sketch or pencil drawing',
                    '3d-render': 'as a 3D computer graphics render',
                    'custom': config.customStyle?.trim() || ''
                };
                
                const styleDesc = (styleDescriptions[config.style] || '').trim();
                if (styleDesc) {
                    enhancedPrompt = `${enhancedPrompt} ${styleDesc}`;
                    console.log('[ImageGenerator] Enhanced prompt with style:', styleDesc);
                }
                // Default to 'vivid' for custom styles to get better results
                apiStyle = 'vivid';
            }

            // Prepare request body according to Azure OpenAI API specs
            const requestBody = {
                prompt: enhancedPrompt,
                size: config.size,
                n: config.n,
                quality: config.quality,
                style: apiStyle
            };

            // Add reference image context if in image+text mode
            if (config.generationMode === 'image-with-text' && this.referenceImageBase64) {
                console.log('[ImageGenerator] Reference image uploaded - enhancing prompt with context');
                console.log('[ImageGenerator] Note: Azure DALL-E 3 API does not accept image input directly');
                console.log('[ImageGenerator] The uploaded image serves as visual reference for prompt creation');
                // Note: Azure DALL-E 3 doesn't support direct image input in API,
                // The reference image is stored for user reference but not sent to API
                requestBody.prompt = `${requestBody.prompt} (Style reference: uploaded image)`;
            }

            console.log('[ImageGenerator] Request body:', {
                ...requestBody,
                prompt: requestBody.prompt.substring(0, 100) + (requestBody.prompt.length > 100 ? '...' : '')
            });

            // Make API call
            console.log('[ImageGenerator] Step 4: Sending API request to Azure OpenAI...');
            const startTime = Date.now();
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': config.apiKey
                },
                body: JSON.stringify(requestBody)
            });

            const responseTime = Date.now() - startTime;
            console.log(`[ImageGenerator] API response received in ${responseTime}ms`);
            console.log('[ImageGenerator] Response status:', response.status, response.statusText);

            if (!response.ok) {
                console.error('[ImageGenerator] ✗ API request failed with status:', response.status);
                const errorData = await response.json().catch(() => ({}));
                console.error('[ImageGenerator] Error details:', errorData);
                throw new Error(errorData.error?.message || `API Error: ${response.status} ${response.statusText}`);
            }

            console.log('[ImageGenerator] Step 5: Parsing API response...');
            const data = await response.json();
            console.log('[ImageGenerator] API Response data:', {
                created: data.created,
                imageCount: data.data?.length || 0
            });

            // Process and display images
            if (data.data && data.data.length > 0) {
                console.log('[ImageGenerator] Step 6: Processing and displaying images...');
                this.displayImages(data.data, config.prompt);
                console.log(`[ImageGenerator] ✓ Successfully generated and displayed ${data.data.length} image(s)!`);
                
                // Update usage tracker
                try {
                    this.usageTracker.addImages(data.data.length);
                } catch (error) {
                    console.error('[UsageTracker] Failed to update usage count:', error);
                    // Don't let tracker errors affect image generation success
                }
                
                showStatus(`Successfully generated ${data.data.length} image(s)!`, 'success');
            } else {
                console.error('[ImageGenerator] ✗ No images returned from API');
                throw new Error('No images returned from API');
            }

            console.log('[ImageGenerator] ==================== IMAGE GENERATION COMPLETED ====================');

        } catch (error) {
            console.error('[ImageGenerator] ✗✗✗ ERROR DURING IMAGE GENERATION ✗✗✗');
            console.error('[ImageGenerator] Error type:', error.name);
            console.error('[ImageGenerator] Error message:', error.message);
            console.error('[ImageGenerator] Error stack:', error.stack);
            showStatus(`Error: ${error.message}`, 'error');
        } finally {
            console.log('[ImageGenerator] Step 7: Hiding loading UI...');
            showLoading(false);
        }
    }

    displayImages(images, prompt) {
        console.log(`[ImageGenerator] Displaying ${images.length} images in gallery...`);
        const gallery = document.getElementById('imageGallery');
        
        images.forEach((imageData, index) => {
            console.log(`[ImageGenerator] Creating image card ${index + 1}/${images.length}`);
            const imageCard = this.createImageCard(imageData, prompt, index);
            gallery.insertBefore(imageCard, gallery.firstChild);
        });

        this.generatedImages.push(...images);
        console.log(`[ImageGenerator] Total images in history: ${this.generatedImages.length}`);
    }

    createImageCard(imageData, prompt, index) {
        const card = document.createElement('div');
        card.className = 'image-card';

        // Get the image URL (could be url or b64_json depending on response_format)
        const imageUrl = imageData.url || (imageData.b64_json ? `data:image/png;base64,${imageData.b64_json}` : '');
        console.log(`[ImageGenerator] Image ${index + 1} URL type:`, imageUrl.startsWith('data:') ? 'base64' : 'url');

        // Create image element safely
        const img = document.createElement('img');
        img.src = this.sanitizeUrl(imageUrl);
        img.alt = prompt;
        img.loading = 'lazy';

        // Create info section
        const infoDiv = document.createElement('div');
        infoDiv.className = 'image-card-info';

        const promptP = document.createElement('p');
        promptP.className = 'image-card-prompt';
        promptP.textContent = prompt;

        // Create actions div
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'image-card-actions';

        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" stroke-width="2"/>
                <path d="M2 12V13C2 14.1 2.9 15 4 15H12C13.1 15 14 14.1 14 13V12" stroke="currentColor" stroke-width="2"/>
            </svg>
            Download
        `;
        downloadBtn.addEventListener('click', () => {
            console.log(`[ImageGenerator] Download button clicked for image ${index + 1}`);
            downloadImage(this.sanitizeUrl(imageUrl), `generated-image-${Date.now()}-${index}.png`);
        });

        // Copy button
        const copyBtn = document.createElement('button');
        copyBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 2H4C2.9 2 2 2.9 2 4V12" stroke="currentColor" stroke-width="2"/>
                <path d="M6 4H12C13.1 4 14 4.9 14 6V12C14 13.1 13.1 14 12 14H6C4.9 14 4 13.1 4 12V6C4 4.9 4.9 4 6 4Z" stroke="currentColor" stroke-width="2"/>
            </svg>
            Copy Prompt
        `;
        copyBtn.addEventListener('click', () => {
            console.log(`[ImageGenerator] Copy prompt button clicked for image ${index + 1}`);
            copyToClipboard(prompt);
        });

        actionsDiv.appendChild(downloadBtn);
        actionsDiv.appendChild(copyBtn);
        infoDiv.appendChild(promptP);
        infoDiv.appendChild(actionsDiv);
        card.appendChild(img);
        card.appendChild(infoDiv);

        return card;
    }

    sanitizeUrl(url) {
        // Only allow https, http, data, and blob URLs
        try {
            const parsedUrl = new URL(url);
            if (['https:', 'http:', 'data:', 'blob:'].includes(parsedUrl.protocol)) {
                return url;
            }
        } catch (e) {
            // If URL parsing fails, check if it's a data URL
            if (url.startsWith('data:image/')) {
                return url;
            }
        }
        console.warn('[ImageGenerator] Invalid URL detected and sanitized:', url.substring(0, 50) + '...');
        return ''; // Return empty string for invalid URLs
    }
}

// UI Helper Functions
function showStatus(message, type) {
    console.log(`[UI] Showing status: [${type.toUpperCase()}] ${message}`);
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
    console.log('[UI] Hiding status message');
    const statusEl = document.getElementById('statusMessage');
    statusEl.style.display = 'none';
}

function showLoading(show) {
    console.log(`[UI] ${show ? 'Showing' : 'Hiding'} loading spinner`);
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
    console.log('[Download] Starting image download:', filename);
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
            console.log('[Download] ✓ Image downloaded successfully (blob/data URL)');
            showStatus('Image downloaded successfully!', 'success');
            return;
        }

        // For remote URLs, we need to fetch and create a blob
        console.log('[Download] Fetching remote URL...');
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
        console.log('[Download] ✓ Image downloaded successfully (remote URL)');
        showStatus('Image downloaded successfully!', 'success');
    } catch (error) {
        console.error('[Download] ✗ Download failed:', error);
        showStatus('Failed to download image. You can right-click and save the image instead.', 'error');
    }
}

function copyToClipboard(text) {
    console.log('[Clipboard] Copying text to clipboard...');
    navigator.clipboard.writeText(text)
        .then(() => {
            console.log('[Clipboard] ✓ Text copied successfully');
            showStatus('Prompt copied to clipboard!', 'success');
        })
        .catch(err => {
            console.error('[Clipboard] ✗ Failed to copy:', err);
            showStatus('Failed to copy prompt', 'error');
        });
}

// Image upload handler
function setupImageUpload(imageGenerator) {
    console.log('[ImageUpload] Setting up image upload handlers...');
    
    const generationModeSelect = document.getElementById('generationMode');
    const imageUploadGroup = document.getElementById('imageUploadGroup');
    const uploadImageBtn = document.getElementById('uploadImageBtn');
    const referenceImageInput = document.getElementById('referenceImage');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const promptHelperText = document.getElementById('promptHelperText');

    // Toggle image upload visibility based on mode
    generationModeSelect.addEventListener('change', (e) => {
        console.log('[ImageUpload] Generation mode changed to:', e.target.value);
        if (e.target.value === 'image-with-text') {
            imageUploadGroup.style.display = 'block';
            promptHelperText.textContent = 'Describe modifications or style to apply to the reference image';
        } else {
            imageUploadGroup.style.display = 'none';
            promptHelperText.textContent = 'Detailed description of the image';
            // Clear reference image
            imageGenerator.clearReferenceImage();
            imagePreview.style.display = 'none';
            referenceImageInput.value = '';
        }
    });

    // Upload button click
    uploadImageBtn.addEventListener('click', () => {
        console.log('[ImageUpload] Upload button clicked');
        referenceImageInput.click();
    });

    // File selected
    referenceImageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) {
            console.log('[ImageUpload] No file selected');
            return;
        }

        console.log('[ImageUpload] File selected:', file.name, 'Type:', file.type, 'Size:', file.size, 'bytes');

        if (!file.type.startsWith('image/')) {
            console.error('[ImageUpload] ✗ Invalid file type:', file.type);
            showStatus('Please select a valid image file', 'error');
            return;
        }

        try {
            console.log('[ImageUpload] Reading file as base64...');
            const base64 = await fileToBase64(file);
            imageGenerator.setReferenceImage(base64);
            
            // Show preview
            previewImg.src = base64;
            imagePreview.style.display = 'block';
            uploadImageBtn.style.display = 'none';
            
            console.log('[ImageUpload] ✓ Image loaded and preview displayed');
            showStatus('Reference image loaded successfully!', 'success');
        } catch (error) {
            console.error('[ImageUpload] ✗ Error loading image:', error);
            showStatus('Failed to load image', 'error');
        }
    });

    // Remove image
    removeImageBtn.addEventListener('click', () => {
        console.log('[ImageUpload] Remove image button clicked');
        imageGenerator.clearReferenceImage();
        imagePreview.style.display = 'none';
        uploadImageBtn.style.display = 'inline-flex';
        referenceImageInput.value = '';
        console.log('[ImageUpload] Reference image removed');
    });
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    console.log('==================================================');
    console.log('    AI Image Generator - Application Starting');
    console.log('==================================================');
    console.log('[Init] DOM Content Loaded');
    console.log('[Init] Initializing configuration manager...');
    
    const configManager = new ConfigManager();
    
    console.log('[Init] Initializing usage tracker...');
    const usageTracker = new UsageTracker();
    usageTracker.updateDisplay();
    
    console.log('[Init] Initializing image generator...');
    const imageGenerator = new ImageGenerator(configManager, usageTracker);

    console.log('[Init] Setting up image upload functionality...');
    setupImageUpload(imageGenerator);

    console.log('[Init] Attaching event listeners...');
    
    // Style dropdown change handler
    document.getElementById('style').addEventListener('change', (e) => {
        console.log('[Event] Style changed to:', e.target.value);
        const customStyleGroup = document.getElementById('customStyleGroup');
        if (e.target.value === 'custom') {
            customStyleGroup.style.display = 'block';
        } else {
            customStyleGroup.style.display = 'none';
        }
    });
    
    // Event Listeners
    document.getElementById('generateBtn').addEventListener('click', () => {
        console.log('[Event] Generate button clicked');
        imageGenerator.generateImages();
    });

    document.getElementById('saveConfigBtn').addEventListener('click', () => {
        console.log('[Event] Save config button clicked');
        configManager.saveConfig();
    });

    document.getElementById('loadConfigBtn').addEventListener('click', () => {
        console.log('[Event] Load config button clicked');
        configManager.loadConfig();
        showStatus('Configuration loaded from storage', 'info');
    });

    // Allow Enter key in prompt textarea to generate
    document.getElementById('prompt').addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            console.log('[Event] Ctrl+Enter pressed in prompt field');
            imageGenerator.generateImages();
        }
    });

    // Show info message on load
    showStatus('Configure your Azure OpenAI settings and start generating images!', 'info');
    
    console.log('[Init] ✓ AI Image Generator initialized successfully');
    console.log('==================================================');
});
