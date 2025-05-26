// Load the model and dataset when the extension starts
let model = null;
let dataset = new Map();
let isModelLoaded = false;

// Whitelist of trusted domains
const whitelistedDomains = ['google.com', 'www.google.com'];

// Initialize the extension
chrome.runtime.onInstalled.addListener(async () => {
    try {
        // Load the model
        const response = await fetch(chrome.runtime.getURL('model.json'));
        if (!response.ok) {
            throw new Error(`Failed to load model: ${response.status} ${response.statusText}`);
        }
        model = await response.json();
        console.log('Model loaded successfully');
        console.log('Model structure:', {
            feature_names: model.feature_names,
            class_log_prior: model.class_log_prior,
            feature_log_prob_length: model.feature_log_prob.length
        });
        
        isModelLoaded = true;
        
        // Load the dataset
        chrome.storage.local.get(['dataset'], (result) => {
            if (result.dataset) {
                dataset = new Map(Object.entries(result.dataset));
                console.log('Dataset loaded successfully');
            }
        });

        // Set up initial rules
        await updateRules();
    } catch (error) {
        console.error('Error during extension initialization:', error);
    }
});

// Extract features from URL (similar to Python implementation)
function extractFeatures(url) {
    const features = [];
    
    const keywords = ['login', 'signin', 'verify', 'account', 'bank', 'secure', 'update', 
                     'confirm', 'password', 'security', 'alert', 'suspicious', 'unusual',
                     'verify', 'validate', 'authenticate', 'payment', 'transaction'];
    
    // Check for keywords
    for (const keyword of keywords) {
        if (url.toLowerCase().includes(keyword)) {
            features.push(keyword);
            console.log(`Found keyword: ${keyword}`);
        }
    }
    
    // Check for IP address
    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) {
        features.push('has_ip');
        console.log('Found IP address in URL');
    }
    
    // Check for suspicious TLDs
    const suspiciousTlds = ['.xyz', '.tk', '.pw', '.info', '.biz'];
    if (suspiciousTlds.some(tld => url.toLowerCase().includes(tld))) {
        features.push('suspicious_tld');
        console.log('Found suspicious TLD');
    }
    
    // Check for HTTPS
    if (url.toLowerCase().includes('https')) {
        features.push('has_https');
        console.log('Found HTTPS');
    }
    
    return features;
}

// Predict using the Naive Bayes model
function predict(url) {
    if (!isModelLoaded || !model) {
        console.error('Model not loaded yet');
        return false;
    }

    try {
        const features = extractFeatures(url);
        console.log('Extracted features:', features);
        
        let score = Math.log(model.class_log_prior[1] / model.class_log_prior[0]);
        console.log('Initial score (log prior ratio):', score);
        
        for (const feature of features) {
            const featureIndex = model.feature_names.indexOf(feature);
            if (featureIndex !== -1) {
                const featureScore = model.feature_log_prob[1][featureIndex] - model.feature_log_prob[0][featureIndex];
                score += featureScore;
                console.log(`Feature "${feature}" score:`, featureScore);
            }
        }
        
        console.log('Final prediction score:', score);
        const isPhishing = score > 0;
        console.log('Is phishing:', isPhishing);
        return isPhishing;
    } catch (error) {
        console.error('Error making prediction:', error);
        return false;
    }
}

// Update rules based on dataset
async function updateRules() {
    if (!isModelLoaded) {
        console.log('Waiting for model to load before updating rules');
        return;
    }

    try {
        // Get existing rules to remove them
        const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
        const existingRuleIds = existingRules.map(rule => rule.id);
        
        // Log existing rules
        console.log('Existing rules:', existingRules);
        
        // Remove existing rules
        if (existingRuleIds.length > 0) {
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: existingRuleIds
            });
            console.log('Removed existing rules:', existingRuleIds);
        }

        // Create rules for known phishing URLs
        const rules = [];
        let ruleId = 1;
        for (const [url, label] of dataset.entries()) {
            if (label === 'phishing') {
                try {
                    const urlPattern = new URL(url).hostname;
                    rules.push({
                        id: ruleId++, // Ensure unique ID
                        priority: 1,
                        action: {
                            type: 'redirect',
                            redirect: {
                                url: chrome.runtime.getURL('warning.html')
                            }
                        },
                        condition: {
                            urlFilter: urlPattern,
                            resourceTypes: ['main_frame']
                        }
                    });
                } catch (error) {
                    console.error('Error processing URL:', url, error);
                }
            }
        }

        // Log new rules
        console.log('New rules to be added:', rules);

        if (rules.length > 0) {
            await chrome.declarativeNetRequest.updateDynamicRules({
                addRules: rules
            });
            console.log('Added new rules:', rules.map(r => r.id));
        }
    } catch (error) {
        console.error('Error updating rules:', error);
    }
}

// Listen for web requests to check new URLs
chrome.webRequest.onBeforeRequest.addListener(
    async function(details) {
        if (!isModelLoaded) {
            console.log('Model not loaded yet, skipping prediction');
            return;
        }

        try {
            const url = details.url;
            console.log('Checking URL:', url);
            
            // Check if URL is whitelisted
            const urlObj = new URL(url);
            if (whitelistedDomains.includes(urlObj.hostname)) {
                console.log('URL is whitelisted:', urlObj.hostname);
                return;
            }
            
            // Skip if URL is already in dataset
            if (dataset.has(url)) {
                console.log('URL already in dataset:', dataset.get(url));
                return;
            }
            
            // Predict if URL is phishing
            console.log('Making prediction for new URL...');
            const isPhishing = predict(url);
            console.log('Prediction result:', isPhishing ? 'Phishing' : 'Legitimate');
            
            // Update dataset with prediction
            dataset.set(url, isPhishing ? 'phishing' : 'legitimate');
            // Save the updated dataset to chrome.storage.local
            chrome.storage.local.set({ dataset: Object.fromEntries(dataset) }, () => {
                console.log('Dataset updated with new URL:', url, isPhishing ? 'phishing' : 'legitimate');
            });
            
            // Update rules if URL is phishing
            if (isPhishing) {
                console.log('URL predicted as phishing, updating rules...');
                await updateRules();
            }
        } catch (error) {
            console.error('Error processing URL:', error);
        }
    },
    { urls: ["<all_urls>"] }
);

// Handle service worker activation
self.addEventListener('activate', event => {
    console.log('Service worker activated');
});

// Handle service worker installation
self.addEventListener('install', event => {
    console.log('Service worker installed');
}); 