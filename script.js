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

// Prompt Queue Manager
class PromptQueue {
    static MAX_QUEUE_SIZE = 50;
    static BATCH_REQUEST_DELAY_MS = 1000;
    
    constructor() {
        this.prompts = [];
        this.storageKey = 'promptQueue';
        this.handleRemoveClick = null;
        this.loadQueue();
        console.log('[PromptQueue] Initialized with', this.prompts.length, 'prompts');
    }

    addPrompt(prompt) {
        if (!prompt || !prompt.trim()) {
            console.warn('[PromptQueue] Cannot add empty prompt');
            return false;
        }
        
        if (this.prompts.length >= PromptQueue.MAX_QUEUE_SIZE) {
            console.warn('[PromptQueue] Queue is full, maximum size is', PromptQueue.MAX_QUEUE_SIZE);
            return false;
        }
        
        this.prompts.push(prompt.trim());
        this.saveQueue();
        this.updateUI();
        console.log('[PromptQueue] Added prompt. Queue size:', this.prompts.length);
        return true;
    }

    removePrompt(index) {
        if (index >= 0 && index < this.prompts.length) {
            const removed = this.prompts.splice(index, 1);
            this.saveQueue();
            this.updateUI();
            console.log('[PromptQueue] Removed prompt at index', index, ':', removed[0].substring(0, 50) + '...');
            return true;
        }
        return false;
    }

    clearQueue() {
        const count = this.prompts.length;
        this.prompts = [];
        this.saveQueue();
        this.updateUI();
        console.log('[PromptQueue] Cleared queue. Removed', count, 'prompts');
    }

    getPrompts() {
        return [...this.prompts];
    }

    getCount() {
        return this.prompts.length;
    }

    saveQueue() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.prompts));
            console.log('[PromptQueue] Saved', this.prompts.length, 'prompts to storage');
        } catch (error) {
            console.error('[PromptQueue] Failed to save queue:', error);
        }
    }

    loadQueue() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Validate that we got an array of strings
                if (Array.isArray(parsed)) {
                    this.prompts = parsed.filter(item => typeof item === 'string' && item.trim().length > 0);
                    console.log('[PromptQueue] Loaded', this.prompts.length, 'prompts from storage');
                } else {
                    console.warn('[PromptQueue] Invalid queue data format, starting with empty queue');
                    this.prompts = [];
                }
            }
        } catch (error) {
            console.error('[PromptQueue] Failed to load queue:', error);
            this.prompts = [];
        }
    }

    updateUI() {
        const queueGroup = document.getElementById('promptQueueGroup');
        const queueContainer = document.getElementById('promptQueue');
        const queueCount = document.getElementById('queueCount');

        if (!queueGroup || !queueContainer || !queueCount) {
            return;
        }

        // Update count
        queueCount.textContent = this.prompts.length;

        // Show/hide queue section
        if (this.prompts.length > 0) {
            queueGroup.style.display = 'block';
            
            // Render queue items
            queueContainer.innerHTML = '';
            this.prompts.forEach((prompt, index) => {
                const item = document.createElement('div');
                item.className = 'prompt-queue-item';
                item.setAttribute('role', 'listitem');
                
                const number = document.createElement('div');
                number.className = 'prompt-queue-number';
                number.textContent = (index + 1).toString();
                
                const text = document.createElement('div');
                text.className = 'prompt-queue-text';
                text.textContent = prompt;
                text.title = prompt; // Show full text on hover
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'prompt-queue-remove';
                removeBtn.innerHTML = '×';
                removeBtn.setAttribute('aria-label', `Remove prompt ${index + 1} from queue`);
                removeBtn.setAttribute('type', 'button');
                removeBtn.dataset.index = index;
                
                item.appendChild(number);
                item.appendChild(text);
                item.appendChild(removeBtn);
                queueContainer.appendChild(item);
            });
            
            // Use event delegation for remove buttons
            queueContainer.removeEventListener('click', this.handleRemoveClick);
            this.handleRemoveClick = (e) => {
                if (e.target.classList.contains('prompt-queue-remove')) {
                    const index = parseInt(e.target.dataset.index);
                    this.removePrompt(index);
                }
            };
            queueContainer.addEventListener('click', this.handleRemoveClick);
        } else {
            queueGroup.style.display = 'none';
        }
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
        this.imageStorageKey = 'generatedImagesGallery';
        this.loadImagesFromStorage();
    }

    saveImagesToStorage() {
        try {
            console.log('[ImageGenerator] Saving images to localStorage...');
            const imagesToSave = this.generatedImages.map(img => ({
                url: img.url,
                prompt: img.prompt,
                timestamp: img.timestamp || Date.now()
            }));
            localStorage.setItem(this.imageStorageKey, JSON.stringify(imagesToSave));
            console.log('[ImageGenerator] Saved', imagesToSave.length, 'images to localStorage');
        } catch (error) {
            console.error('[ImageGenerator] Failed to save images to localStorage:', error);
            // If storage is full, try to keep only recent images
            if (error.name === 'QuotaExceededError') {
                console.log('[ImageGenerator] Storage full, keeping only last 10 images');
                this.generatedImages = this.generatedImages.slice(-10);
                try {
                    const imagesToSave = this.generatedImages.map(img => ({
                        url: img.url,
                        prompt: img.prompt,
                        timestamp: img.timestamp || Date.now()
                    }));
                    localStorage.setItem(this.imageStorageKey, JSON.stringify(imagesToSave));
                } catch (retryError) {
                    console.error('[ImageGenerator] Still failed to save images:', retryError);
                }
            }
        }
    }

    loadImagesFromStorage() {
        try {
            console.log('[ImageGenerator] Loading images from localStorage...');
            const savedImages = localStorage.getItem(this.imageStorageKey);
            if (savedImages) {
                const images = JSON.parse(savedImages);
                console.log('[ImageGenerator] Found', images.length, 'saved images');
                // Load images into memory; rendering is handled separately (e.g., on DOMContentLoaded)
                images.forEach(imageData => {
                    this.generatedImages.push(imageData);
                });
            } else {
                console.log('[ImageGenerator] No saved images found');
            }
        } catch (error) {
            console.error('[ImageGenerator] Failed to load images from localStorage:', error);
        }
    }

    restoreImagesToGallery() {
        console.log('[ImageGenerator] Restoring', this.generatedImages.length, 'images to gallery');
        const gallery = document.getElementById('imageGallery');
        if (!gallery) {
            console.error('[ImageGenerator] Gallery element not found');
            return;
        }
        
        // Clear gallery first
        gallery.innerHTML = '';
        
        // Restore images in reverse order (newest first)
        for (let i = this.generatedImages.length - 1; i >= 0; i--) {
            const imageData = this.generatedImages[i];
            const imageCard = this.createImageCard(
                { url: imageData.url }, 
                imageData.prompt, 
                i
            );
            gallery.appendChild(imageCard);
        }
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
                        '2d-game-dot-background': 'as a 2D pixel art game background with retro dot graphics',
                        '2d-game-dot-character': 'as a 2D pixel art game character with retro dot graphics',
                        'game-illustration': 'in video game concept art illustration style',
                        'casual-game-illustration': 'in bright and friendly casual game illustration style',
                        'rpg-game-art': 'in fantasy RPG game art style with detailed characters and environments',
                        'mobile-game-ui': 'as a mobile game UI element or icon design with clean and vibrant style',
                        'retro-game-style': 'in retro 8-bit or 16-bit classic video game style',
                        '3d-game-model': 'as a 3D game model with game-ready textures and lighting',
                        'game-character-portrait': 'as a game character portrait with detailed facial features',
                        'game-environment-concept': 'as a game environment concept art for level design',
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
                // DALL-E 3 deployments typically have names like: dall-e-3, dalle3, DALL-E-3, etc.
                const deploymentLower = config.deploymentName.toLowerCase();
                const isDallE3 = deploymentLower.includes('dall-e-3') || 
                                 deploymentLower.includes('dalle-3') ||
                                 deploymentLower.includes('dalle3') ||
                                 (deploymentLower.includes('dall') && deploymentLower.includes('3'));
                
                if (isDallE3) {
                    requestBody.style = apiStyle;
                    console.log('[ImageGenerator] DALL-E 3 model detected - including style parameter:', apiStyle);
                } else {
                    console.log('[ImageGenerator] Non-DALL-E-3 model detected - excluding style parameter (styles applied via prompt enhancement)');
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

    async generateImagesFromQueue(promptQueue) {
        console.log('[ImageGenerator] ==================== STARTING BATCH IMAGE GENERATION ====================');
        const prompts = promptQueue.getPrompts();
        
        if (prompts.length === 0) {
            console.warn('[ImageGenerator] No prompts in queue, falling back to single prompt generation');
            return this.generateImages();
        }

        console.log('[ImageGenerator] Processing', prompts.length, 'prompts from queue');
        
        // Show loading state
        showLoading(true);
        hideStatus();
        
        // Disable prompt input during batch generation
        const promptTextarea = document.getElementById('prompt');
        const originalDisabledState = promptTextarea.disabled;
        promptTextarea.disabled = true;

        let successCount = 0;
        let failCount = 0;

        try {
            for (let i = 0; i < prompts.length; i++) {
                const prompt = prompts[i];
                const promptPreview = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
                console.log(`[ImageGenerator] Processing prompt ${i + 1}/${prompts.length}:`, promptPreview);
                
                // Update status to show progress
                showStatus(`Generating images for prompt ${i + 1}/${prompts.length}...`, 'info');
                
                try {
                    // Store the prompt temporarily for generation
                    const originalPrompt = promptTextarea.value;
                    
                    try {
                        // Set the prompt for generation
                        promptTextarea.value = prompt;
                        
                        // Generate images for this prompt
                        await this.generateSinglePrompt();
                        successCount++;
                        
                        console.log(`[ImageGenerator] ✓ Successfully completed prompt ${i + 1}/${prompts.length}`);
                    } finally {
                        // Always restore original prompt
                        promptTextarea.value = originalPrompt;
                    }
                    
                    // Small delay between requests to avoid rate limiting
                    if (i < prompts.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, PromptQueue.BATCH_REQUEST_DELAY_MS));
                    }
                } catch (error) {
                    failCount++;
                    console.error(`[ImageGenerator] ✗ Failed to generate images for prompt ${i + 1}:`, error.message);
                    // Continue with next prompt even if one fails
                }
            }

            // Clear the queue after successful batch generation
            if (successCount > 0) {
                promptQueue.clearQueue();
            }

            // Show final status
            if (failCount === 0) {
                showStatus(`Successfully generated images for all ${successCount} prompts!`, 'success');
            } else {
                showStatus(`Completed with ${successCount} successful and ${failCount} failed prompts`, 'info');
            }

            console.log('[ImageGenerator] ==================== BATCH GENERATION COMPLETED ====================');
            console.log(`[ImageGenerator] Results: ${successCount} successful, ${failCount} failed`);
        } catch (error) {
            console.error('[ImageGenerator] ✗✗✗ ERROR DURING BATCH GENERATION ✗✗✗');
            console.error('[ImageGenerator] Error:', error);
            showStatus(`Batch generation error: ${error.message}`, 'error');
        } finally {
            showLoading(false);
            promptTextarea.disabled = originalDisabledState;
        }
    }

    async generateSinglePrompt() {
        // This is the core generation logic extracted for reuse
        const config = this.configManager.getConfig();
        
        // Validate configuration
        this.configManager.validateConfig(config);

        // Determine API endpoint based on mode
        const endpoint = config.apiEndpoint.replace(/\/$/, '');
        let url, requestBody, fetchOptions;
        
        if (config.generationMode === 'image-edit') {
            // Image editing mode
            url = `${endpoint}/openai/deployments/${config.deploymentName}/images/edits?api-version=${config.apiVersion}`;
            
            const maskEditor = window.maskEditor;
            if (!maskEditor || !maskEditor.baseImage) {
                throw new Error('Please upload an image and create a mask before editing');
            }
            
            const baseImageDataURL = maskEditor.getBaseImageDataURL();
            const maskDataURL = maskEditor.getMaskDataURL();
            
            if (!baseImageDataURL || !maskDataURL) {
                throw new Error('Failed to extract image or mask data');
            }
            
            const imageBlob = await dataURLToBlob(baseImageDataURL);
            const maskBlob = await dataURLToBlob(maskDataURL);
            
            const formData = new FormData();
            formData.append('image', imageBlob, 'image.png');
            formData.append('mask', maskBlob, 'mask.png');
            formData.append('prompt', config.prompt.trim());
            formData.append('n', config.n.toString());
            formData.append('size', config.size);
            
            fetchOptions = {
                method: 'POST',
                headers: {
                    'api-key': config.apiKey
                },
                body: formData
            };
        } else {
            // Image generation mode
            url = `${endpoint}/openai/deployments/${config.deploymentName}/images/generations?api-version=${config.apiVersion}`;

            let enhancedPrompt = config.prompt.trim();
            let apiStyle = config.style;
            
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
                    '2d-game-dot-background': 'as a 2D pixel art game background with retro dot graphics',
                    '2d-game-dot-character': 'as a 2D pixel art game character with retro dot graphics',
                    'game-illustration': 'in video game concept art illustration style',
                    'casual-game-illustration': 'in bright and friendly casual game illustration style',
                    'rpg-game-art': 'in fantasy RPG game art style with detailed characters and environments',
                    'mobile-game-ui': 'as a mobile game UI element or icon design with clean and vibrant style',
                    'retro-game-style': 'in retro 8-bit or 16-bit classic video game style',
                    '3d-game-model': 'as a 3D game model with game-ready textures and lighting',
                    'game-character-portrait': 'as a game character portrait with detailed facial features',
                    'game-environment-concept': 'as a game environment concept art for level design',
                    'custom': config.customStyle?.trim() || ''
                };
                
                const styleDesc = (styleDescriptions[config.style] || '').trim();
                if (styleDesc) {
                    enhancedPrompt = `${enhancedPrompt} ${styleDesc}`;
                }
                apiStyle = 'vivid';
            }

            requestBody = {
                prompt: enhancedPrompt,
                size: config.size,
                n: config.n,
                quality: config.quality
            };
            
            const deploymentLower = config.deploymentName.toLowerCase();
            const isDallE3 = deploymentLower.includes('dall-e-3') || 
                             deploymentLower.includes('dalle-3') ||
                             deploymentLower.includes('dalle3') ||
                             (deploymentLower.includes('dall') && deploymentLower.includes('3'));
            
            if (isDallE3) {
                requestBody.style = apiStyle;
            }

            if (config.generationMode === 'image-with-text' && this.referenceImageBase64) {
                requestBody.prompt = `${requestBody.prompt} (Style reference: uploaded image)`;
            }
            
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
        const startTime = Date.now();
        const response = await fetch(url, fetchOptions);
        const responseTime = Date.now() - startTime;
        
        console.log(`[ImageGenerator] API response received in ${responseTime}ms`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Process and display images
        if (data.data && data.data.length > 0) {
            this.displayImages(data.data, config.prompt);
            
            try {
                this.usageTracker.addImages(data.data.length);
            } catch (error) {
                console.error('[UsageTracker] Failed to update usage count:', error);
            }
        } else {
            throw new Error('No images returned from API');
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

        // Store images with their prompts and timestamps
        const timestamp = Date.now();
        images.forEach(imageData => {
            this.generatedImages.push({
                url: imageData.url || (imageData.b64_json ? `data:image/png;base64,${imageData.b64_json}` : ''),
                prompt: prompt,
                timestamp: timestamp
            });
        });
        
        console.log(`[ImageGenerator] Total images in history: ${this.generatedImages.length}`);
        
        // Save to localStorage
        this.saveImagesToStorage();
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

        // Edit in Inpaint button
        const inpaintBtn = document.createElement('button');
        inpaintBtn.className = 'btn-inpaint';
        inpaintBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 14L5 11L9 15L14 10L12 8L7 13L3 9L1 11L2 14Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <circle cx="12" cy="4" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
            </svg>
            Edit in Inpaint
        `;
        const sanitizedUrl = this.sanitizeUrl(imageUrl);
        inpaintBtn.addEventListener('click', () => {
            console.log(`[ImageGenerator] Edit in Inpaint button clicked for image ${index + 1}`);
            switchToInpaintMode(sanitizedUrl);
        });

        actionsDiv.appendChild(downloadBtn);
        actionsDiv.appendChild(copyBtn);
        actionsDiv.appendChild(inpaintBtn);
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

// Switch to inpaint mode with loaded image
async function switchToInpaintMode(imageUrl) {
    console.log('[InpaintMode] Switching to inpaint mode with image:', imageUrl.substring(0, 50) + '...');
    
    try {
        // Get DOM elements
        const generationModeSelect = document.getElementById('generationMode');
        const imageUploadGroup = document.getElementById('imageUploadGroup');
        const maskEditorGroup = document.getElementById('maskEditorGroup');
        const imagePreview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        const uploadImageBtn = document.getElementById('uploadImageBtn');
        const promptTextarea = document.getElementById('prompt');
        
        // Switch to image-edit mode
        console.log('[InpaintMode] Changing generation mode to image-edit');
        generationModeSelect.value = 'image-edit';
        
        // Trigger the change event to update UI
        generationModeSelect.dispatchEvent(new Event('change'));
        
        // Load the image
        console.log('[InpaintMode] Loading image into editor');
        
        // Convert URL to base64 if needed
        let base64Image = imageUrl;
        if (!imageUrl.startsWith('data:')) {
            // If it's a remote URL, fetch and convert to base64
            console.log('[InpaintMode] Converting remote URL to base64...');
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            }
            const blob = await response.blob();
            if (!blob.type.startsWith('image/')) {
                throw new Error(`Invalid image type: ${blob.type}`);
            }
            base64Image = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }
        
        // Set the reference image in imageGenerator
        window.imageGenerator.setReferenceImage(base64Image);
        
        // Show preview
        previewImg.src = base64Image;
        imagePreview.style.display = 'block';
        uploadImageBtn.style.display = 'none';
        
        // Setup mask editor
        maskEditorGroup.style.display = 'block';
        window.maskEditor.setupCanvas(previewImg);
        
        // Clear the prompt
        promptTextarea.value = '';
        
        // Scroll to the configuration panel
        document.querySelector('.config-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        console.log('[InpaintMode] ✓ Successfully switched to inpaint mode');
        showStatus('Image loaded in inpaint mode! Draw a mask on areas you want to edit.', 'success');
    } catch (error) {
        console.error('[InpaintMode] ✗ Failed to switch to inpaint mode:', error);
        showStatus('Failed to load image in inpaint mode', 'error');
    }
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
    
    console.log('[Init] Initializing prompt queue...');
    const promptQueue = new PromptQueue();
    promptQueue.updateUI();
    
    console.log('[Init] Initializing image generator...');
    const imageGenerator = new ImageGenerator(configManager, usageTracker);
    window.imageGenerator = imageGenerator; // Make it globally accessible for inpaint button
    
    // Restore saved images to gallery
    // The gallery should be ready at this point since we're in DOMContentLoaded
    imageGenerator.restoreImagesToGallery();

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
        // Auto-save config on style change
        console.log('[Event] Auto-saving config after style changed');
        configManager.saveConfig();
    });
    
    // Auto-save configuration on field changes
    const autoSaveFields = ['apiVersion', 'size', 'quality', 'customStyle', 'numImages'];
    autoSaveFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.addEventListener('change', () => {
                console.log('[Event] Auto-saving config after', fieldId, 'changed');
                configManager.saveConfig();
            });
        }
    });
    
    // Event Listeners
    document.getElementById('generateBtn').addEventListener('click', () => {
        console.log('[Event] Generate button clicked');
        // Check if there are prompts in the queue
        if (promptQueue.getCount() > 0) {
            console.log('[Event] Processing', promptQueue.getCount(), 'prompts from queue');
            imageGenerator.generateImagesFromQueue(promptQueue);
        } else {
            console.log('[Event] No prompts in queue, generating from current prompt');
            imageGenerator.generateImages();
        }
    });

    document.getElementById('addPromptBtn').addEventListener('click', () => {
        console.log('[Event] Add prompt button clicked');
        const promptText = document.getElementById('prompt').value.trim();
        if (promptText) {
            const result = promptQueue.addPrompt(promptText);
            if (result) {
                document.getElementById('prompt').value = '';
                showStatus('Prompt added to queue!', 'success');
            } else if (promptQueue.getCount() >= PromptQueue.MAX_QUEUE_SIZE) {
                showStatus(`Queue is full (maximum ${PromptQueue.MAX_QUEUE_SIZE} prompts)`, 'error');
            } else {
                showStatus('Cannot add empty prompt', 'error');
            }
        } else {
            showStatus('Please enter a prompt first', 'error');
        }
    });

    document.getElementById('clearQueueBtn').addEventListener('click', () => {
        console.log('[Event] Clear queue button clicked');
        if (promptQueue.getCount() > 0) {
            promptQueue.clearQueue();
            showStatus('Prompt queue cleared', 'info');
        } else {
            showStatus('Queue is already empty', 'info');
        }
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
            // Check if there are prompts in the queue
            if (promptQueue.getCount() > 0) {
                imageGenerator.generateImagesFromQueue(promptQueue);
            } else {
                imageGenerator.generateImages();
            }
        }
    });

    // Show info message on load
    showStatus('Configure your Azure OpenAI settings and start generating images!', 'info');
    
    console.log('[Init] ✓ AI Image Generator initialized successfully');
    console.log('==================================================');
});
