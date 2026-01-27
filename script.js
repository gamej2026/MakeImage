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
        // Support both .openai.azure.com and .cognitiveservices.azure.com endpoints
        if (!config.apiEndpoint.match(/^https:\/\/[a-zA-Z0-9-]+\.(openai\.azure\.com|cognitiveservices\.azure\.com)\/?$/)) {
            throw new Error('Invalid Azure OpenAI Endpoint format. Expected: https://your-resource.openai.azure.com or https://your-resource.cognitiveservices.azure.com');
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

// Mask Editor
class MaskEditor {
    // Constants
    static MASK_COLOR = 'rgba(255, 255, 255, 0.7)';
    static ERASER_COLOR = 'rgba(0, 0, 0, 1)';
    static ALPHA_THRESHOLD = 200;
    static RGBA_PIXEL_SIZE = 4;
    
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.currentTool = 'brush'; // 'brush' or 'eraser'
        this.brushSize = 20;
        this.baseImage = null;
        this.maskData = null;
        console.log('[MaskEditor] Initialized');
    }

    setupCanvas(imageElement) {
        console.log('[MaskEditor] Setting up canvas with image');
        this.canvas = document.getElementById('maskCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Load base image
        this.baseImage = new Image();
        this.baseImage.onload = () => {
            // Set canvas size to match image
            this.canvas.width = this.baseImage.width;
            this.canvas.height = this.baseImage.height;
            
            // Draw base image
            this.ctx.drawImage(this.baseImage, 0, 0);
            
            // Initialize mask layer (transparent)
            this.maskData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
            
            console.log('[MaskEditor] Canvas setup complete:', {
                width: this.canvas.width,
                height: this.canvas.height
            });
        };
        this.baseImage.src = imageElement.src;
    }

    setTool(tool) {
        console.log('[MaskEditor] Tool changed to:', tool);
        this.currentTool = tool;
    }

    setBrushSize(size) {
        this.brushSize = size;
        console.log('[MaskEditor] Brush size changed to:', size);
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.draw(e);
    }

    stopDrawing() {
        this.isDrawing = false;
        this.ctx.beginPath(); // Reset path
    }

    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        this.ctx.lineWidth = this.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        if (this.currentTool === 'brush') {
            // Draw white mask (areas to edit)
            this.ctx.strokeStyle = MaskEditor.MASK_COLOR;
            this.ctx.fillStyle = MaskEditor.MASK_COLOR;
        } else {
            // Erase mask (restore original image)
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.strokeStyle = MaskEditor.ERASER_COLOR;
        }

        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.brushSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);

        // Reset composite operation
        if (this.currentTool === 'eraser') {
            this.ctx.globalCompositeOperation = 'source-over';
        }
    }

    clearMask() {
        console.log('[MaskEditor] Clearing mask');
        if (this.baseImage) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(this.baseImage, 0, 0);
        }
    }

    getMaskDataURL() {
        console.log('[MaskEditor] Extracting mask data');
        // Create a new canvas for the mask only
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = this.canvas.width;
        maskCanvas.height = this.canvas.height;
        const maskCtx = maskCanvas.getContext('2d');

        // Fill with black background
        maskCtx.fillStyle = 'black';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

        // Get current canvas data
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        // Create mask: white where drawn, transparent elsewhere
        const maskImageData = maskCtx.createImageData(maskCanvas.width, maskCanvas.height);
        const maskData = maskImageData.data;

        for (let i = 0; i < data.length; i += MaskEditor.RGBA_PIXEL_SIZE) {
            const alpha = data[i + 3];
            // If pixel has been drawn over (mask applied), make it white
            if (alpha > MaskEditor.ALPHA_THRESHOLD) {
                maskData[i] = 255;     // R
                maskData[i + 1] = 255; // G
                maskData[i + 2] = 255; // B
                maskData[i + 3] = 255; // A
            } else {
                // Keep black (no edit)
                maskData[i] = 0;
                maskData[i + 1] = 0;
                maskData[i + 2] = 0;
                maskData[i + 3] = 255;
            }
        }

        maskCtx.putImageData(maskImageData, 0, 0);
        const maskDataURL = maskCanvas.toDataURL('image/png');
        console.log('[MaskEditor] Mask data URL generated');
        return maskDataURL;
    }

    getBaseImageDataURL() {
        console.log('[MaskEditor] Getting base image data URL');
        // Return the original image without mask overlay
        if (this.baseImage) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.baseImage.width;
            tempCanvas.height = this.baseImage.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(this.baseImage, 0, 0);
            return tempCanvas.toDataURL('image/png');
        }
        return null;
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
            // Determine API endpoint based on mode
            const endpoint = config.apiEndpoint.replace(/\/$/, ''); // Remove trailing slash
            let url, requestBody, fetchOptions;
            
            if (config.generationMode === 'image-edit') {
                // Image editing mode - use /images/edits endpoint
                console.log('[ImageGenerator] Step 3: Building image editing API request...');
                url = `${endpoint}/openai/deployments/${config.deploymentName}/images/edits?api-version=${config.apiVersion}`;
                console.log('[ImageGenerator] API Endpoint (Edit):', url);
                
                // Get mask and base image from mask editor
                const maskEditor = window.maskEditor;
                if (!maskEditor || !maskEditor.baseImage) {
                    throw new Error('Please upload an image and create a mask before editing');
                }
                
                const baseImageDataURL = maskEditor.getBaseImageDataURL();
                const maskDataURL = maskEditor.getMaskDataURL();
                
                if (!baseImageDataURL || !maskDataURL) {
                    throw new Error('Failed to extract image or mask data');
                }
                
                // Convert data URLs to blobs
                const imageBlob = await dataURLToBlob(baseImageDataURL);
                const maskBlob = await dataURLToBlob(maskDataURL);
                
                // Build FormData for multipart request
                const formData = new FormData();
                formData.append('image', imageBlob, 'image.png');
                formData.append('mask', maskBlob, 'mask.png');
                formData.append('prompt', config.prompt.trim());
                formData.append('n', config.n.toString());
                formData.append('size', config.size);
                
                console.log('[ImageGenerator] Editing request prepared:', {
                    prompt: config.prompt.substring(0, 100) + (config.prompt.length > 100 ? '...' : ''),
                    size: config.size,
                    n: config.n
                });
                
                fetchOptions = {
                    method: 'POST',
                    headers: {
                        'api-key': config.apiKey
                    },
                    body: formData
                };
            } else {
                // Image generation mode - use /images/generations endpoint
                console.log('[ImageGenerator] Step 3: Building image generation API request...');
                url = `${endpoint}/openai/deployments/${config.deploymentName}/images/generations?api-version=${config.apiVersion}`;
                console.log('[ImageGenerator] API Endpoint (Generation):', url);

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
                requestBody = {
                    prompt: enhancedPrompt,
                    size: config.size,
                    n: config.n,
                    quality: config.quality
                };
                
                // Only include 'style' parameter for DALL-E 3 models
                // GPT-image models (gpt-image-1, gpt-image-1.5) do not support the 'style' parameter
                const isDallE3 = config.deploymentName.toLowerCase().includes('dall-e') || 
                                 config.deploymentName.toLowerCase().includes('dalle');
                
                if (isDallE3) {
                    requestBody.style = apiStyle;
                    console.log('[ImageGenerator] Using DALL-E 3 model - style parameter included:', apiStyle);
                } else {
                    console.log('[ImageGenerator] Using GPT-image model - style parameter excluded (styles applied via prompt)');
                }

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
                
                fetchOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': config.apiKey
                    },
                    body: JSON.stringify(requestBody)
                };
            }

            // Make API call
            console.log('[ImageGenerator] Step 4: Sending API request to Azure OpenAI...');
            const startTime = Date.now();
            
            const response = await fetch(url, fetchOptions);

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
function setupImageUpload(imageGenerator, maskEditor) {
    console.log('[ImageUpload] Setting up image upload handlers...');
    
    const generationModeSelect = document.getElementById('generationMode');
    const imageUploadGroup = document.getElementById('imageUploadGroup');
    const maskEditorGroup = document.getElementById('maskEditorGroup');
    const uploadImageBtn = document.getElementById('uploadImageBtn');
    const referenceImageInput = document.getElementById('referenceImage');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const promptHelperText = document.getElementById('promptHelperText');
    const imageUploadLabel = document.getElementById('imageUploadLabel');
    const imageUploadHelperText = document.getElementById('imageUploadHelperText');
    const infoNote = document.getElementById('infoNote');

    // Toggle image upload visibility based on mode
    generationModeSelect.addEventListener('change', (e) => {
        console.log('[ImageUpload] Generation mode changed to:', e.target.value);
        const mode = e.target.value;
        
        if (mode === 'image-with-text') {
            imageUploadGroup.style.display = 'block';
            maskEditorGroup.style.display = 'none';
            imageUploadLabel.textContent = 'Reference Image';
            imageUploadHelperText.textContent = 'Upload a reference image for visual context (not directly processed by API)';
            promptHelperText.textContent = 'Describe modifications or style to apply to the reference image';
            infoNote.style.display = 'block';
        } else if (mode === 'image-edit') {
            imageUploadGroup.style.display = 'block';
            maskEditorGroup.style.display = 'none'; // Show after image upload
            imageUploadLabel.textContent = 'Image to Edit';
            imageUploadHelperText.textContent = 'Upload an image to edit with inpainting';
            promptHelperText.textContent = 'Describe what you want in the edited/masked areas';
            infoNote.style.display = 'none';
        } else {
            imageUploadGroup.style.display = 'none';
            maskEditorGroup.style.display = 'none';
            promptHelperText.textContent = 'Detailed description of the image';
            infoNote.style.display = 'none';
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
            
            // If in edit mode, setup mask editor
            const mode = generationModeSelect.value;
            if (mode === 'image-edit') {
                console.log('[ImageUpload] Setting up mask editor for editing mode');
                maskEditorGroup.style.display = 'block';
                maskEditor.setupCanvas(previewImg);
                showStatus('Image loaded! Draw a mask on the areas you want to edit.', 'success');
            } else {
                console.log('[ImageUpload] ✓ Image loaded and preview displayed');
                showStatus('Reference image loaded successfully!', 'success');
            }
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
        maskEditorGroup.style.display = 'none';
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

// Convert data URL to Blob
function dataURLToBlob(dataURL) {
    return new Promise((resolve, reject) => {
        try {
            const arr = dataURL.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            resolve(new Blob([u8arr], { type: mime }));
        } catch (error) {
            reject(error);
        }
    });
}

// Setup mask editor controls
function setupMaskEditor(maskEditor) {
    console.log('[MaskEditor] Setting up mask editor controls...');
    
    const canvas = document.getElementById('maskCanvas');
    const brushModeBtn = document.getElementById('brushModeBtn');
    const eraseModeBtn = document.getElementById('eraseModeBtn');
    const brushSizeInput = document.getElementById('brushSize');
    const brushSizeValue = document.getElementById('brushSizeValue');
    const clearMaskBtn = document.getElementById('clearMaskBtn');
    
    // Tool selection
    brushModeBtn.addEventListener('click', () => {
        maskEditor.setTool('brush');
        brushModeBtn.classList.add('active');
        eraseModeBtn.classList.remove('active');
        console.log('[MaskEditor] Brush mode activated');
    });
    
    eraseModeBtn.addEventListener('click', () => {
        maskEditor.setTool('eraser');
        eraseModeBtn.classList.add('active');
        brushModeBtn.classList.remove('active');
        console.log('[MaskEditor] Eraser mode activated');
    });
    
    // Brush size
    brushSizeInput.addEventListener('input', (e) => {
        const size = parseInt(e.target.value);
        maskEditor.setBrushSize(size);
        brushSizeValue.textContent = size;
    });
    
    // Clear mask
    clearMaskBtn.addEventListener('click', () => {
        maskEditor.clearMask();
        showStatus('Mask cleared', 'info');
    });
    
    // Canvas drawing events
    canvas.addEventListener('mousedown', (e) => maskEditor.startDrawing(e));
    canvas.addEventListener('mousemove', (e) => maskEditor.draw(e));
    canvas.addEventListener('mouseup', () => maskEditor.stopDrawing());
    canvas.addEventListener('mouseleave', () => maskEditor.stopDrawing());
    
    // Touch support for mobile
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        canvas.dispatchEvent(mouseEvent);
    });
    
    console.log('[MaskEditor] Mask editor controls setup complete');
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

    console.log('[Init] Initializing mask editor...');
    const maskEditor = new MaskEditor();
    window.maskEditor = maskEditor; // Make it globally accessible
    setupMaskEditor(maskEditor);

    console.log('[Init] Setting up image upload functionality...');
    setupImageUpload(imageGenerator, maskEditor);

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
