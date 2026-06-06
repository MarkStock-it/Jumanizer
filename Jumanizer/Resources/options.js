// Options Page Script
const apiKeyInput = document.getElementById('apiKey');
const saveButton = document.getElementById('save');
const showHideButton = document.getElementById('show-hide');
const statusDiv = document.getElementById('status');
const extensionToggle = document.getElementById('extensionToggle');

let showingPassword = false;

// Load saved settings
chrome.storage.sync.get(['apiKey', 'extensionEnabled'], (result) => {
  if (result.apiKey) {
    apiKeyInput.value = result.apiKey;
  }
  extensionToggle.checked = result.extensionEnabled !== false; // Default enabled
});

// Save API key
saveButton.addEventListener('click', () => {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    showStatus('Please enter an API key', 'error');
    return;
  }

  chrome.storage.sync.set({ apiKey }, () => {
    showStatus('Settings saved successfully!', 'success');
    setTimeout(() => {
      statusDiv.classList.add('hidden');
    }, 3000);
  });
});

// Toggle password visibility
showHideButton.addEventListener('click', () => {
  showingPassword = !showingPassword;
  apiKeyInput.type = showingPassword ? 'text' : 'password';
  showHideButton.textContent = showingPassword ? 'Hide' : 'Show';
});

// Toggle extension enabled/disabled
extensionToggle.addEventListener('change', () => {
  chrome.storage.sync.set({ extensionEnabled: extensionToggle.checked }, () => {
    // Settings saved automatically
  });
});

function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.classList.remove('hidden', 'success', 'error');
  statusDiv.classList.add(type);
}

// Allow Enter key to save
apiKeyInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    saveButton.click();
  }
});
