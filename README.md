# PhishGuard Browser Extension

A browser extension that protects users from phishing websites using machine learning. The extension uses a Naive Bayes classifier to detect potential phishing sites based on URL patterns and features.

## Features

- Real-time URL checking
- Machine learning-based phishing detection
- Warning page for detected phishing sites
- Statistics tracking
- Local storage of known URLs

## Setup

### 1. Train the Model

1. Install required Python packages:
   ```bash
   pip install pandas numpy scikit-learn
   ```

2. Prepare your dataset in CSV format with two columns:
   - `url`: The website address
   - `label`: Either "legitimate" or "phishing"

3. Run the training script:
   ```bash
   python train_model.py
   ```
   This will generate a `model.json` file containing the trained model.

### 2. Install the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the extension directory

## Project Structure

```
phishguard/
├── manifest.json          # Extension configuration
├── background.js         # URL interception and classification
├── popup.html           # Extension popup interface
├── popup.js             # Popup functionality
├── warning.html         # Phishing warning page
├── train_model.py       # Model training script
├── model.json           # Trained model (generated)
└── icons/               # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## How It Works

1. When a user visits a website, the extension intercepts the request
2. The URL is checked against the local database of known URLs
3. If the URL is not in the database, the machine learning model predicts if it's phishing
4. If phishing is detected, the user is shown a warning page
5. The URL and its classification are stored locally for future reference

## Development

- The model is trained using scikit-learn's MultinomialNB classifier
- Features are extracted from URLs including:
  - Common phishing-related keywords
  - IP addresses in URLs
  - Suspicious TLDs
  - HTTPS presence
- The extension uses Chrome's webRequest API for URL interception
- Local storage is used to maintain the database of known URLs

## Contributing

Feel free to submit issues and enhancement requests! 