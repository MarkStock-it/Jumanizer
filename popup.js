// Popup Script
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const apiStatus = document.getElementById('apiStatus');
const enableToggle = document.getElementById('enableToggle');
const openOptionsBtn = document.getElementById('openOptions');
const openDocsBtn = document.getElementById('openDocs');

// Load extension status
chrome.storage.sync.get(['extensionEnabled', 'apiKey'], (result) => {
  const isEnabled = result.extensionEnabled !== false; // Default enabled
  enableToggle.checked = isEnabled;
  updateStatusDisplay(isEnabled, !!result.apiKey);
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.extensionEnabled || changes.apiKey) {
    chrome.storage.sync.get(['extensionEnabled', 'apiKey'], (result) => {
      const isEnabled = result.extensionEnabled !== false;
      enableToggle.checked = isEnabled;
      updateStatusDisplay(isEnabled, !!result.apiKey);
    });
  }
});

function updateStatusDisplay(isEnabled, hasApiKey) {
  if (isEnabled) {
    statusDot.classList.add('active');
    statusText.classList.add('active');
    statusText.classList.remove('inactive');
    statusText.textContent = 'Extension Active';
  } else {
    statusDot.classList.remove('active');
    statusText.classList.add('inactive');
    statusText.classList.remove('active');
    statusText.textContent = 'Extension Disabled';
  }

  // Check API key
  if (hasApiKey) {
    apiStatus.classList.add('ok');
    apiStatus.classList.remove('error');
    apiStatus.textContent = '✓ API key configured';
  } else {
    apiStatus.classList.add('error');
    apiStatus.classList.remove('ok');
    apiStatus.textContent = '⚠ API key not configured';
  }
}

// Toggle extension
enableToggle.addEventListener('change', () => {
  chrome.storage.sync.set({ extensionEnabled: enableToggle.checked });
});

// Open options page
openOptionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Open how-to guide (simple modal or redirect to help page)
openDocsBtn.addEventListener('click', () => {
  const helpText = `
HOW TO USE JUMANIZER:

1. Select any AI-generated text on a webpage
   - Click and drag to highlight the text
   
2. Click the "✨ Humanize" button that appears
   - Or right-click the selection and choose "Humanize this text"
   
3. The text will be rewritten to sound more human
   - Natural sentence variation
   - Casual language and contractions
   - Removed AI patterns and formal phrasing
   - Direct replacement in the page

SETUP:
   - Go to Options and enter your Google Gemini API key
   - Get one at: aistudio.google.com/apikey

The extension uses Google Gemini 2.0 Flash API to humanize text.
  `;
  
  alert(helpText);
});
