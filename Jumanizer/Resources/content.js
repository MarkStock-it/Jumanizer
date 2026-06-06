// Content Script - handles selection and UI injection
let selectedText = '';
let selectedRange = null;
let isEnabled = true;

// Listen for extension toggle
chrome.storage.sync.get('extensionEnabled', (result) => {
  isEnabled = result.extensionEnabled !== false; // Default enabled
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.extensionEnabled) {
    isEnabled = changes.extensionEnabled.newValue;
  }
});

// Handle text selection
document.addEventListener('mouseup', () => {
  if (!isEnabled) return;

  const selection = window.getSelection();
  selectedText = selection.toString().trim();

  if (selectedText.length > 0) {
    // Store the range for later restoration
    if (selection.rangeCount > 0) {
      selectedRange = selection.getRangeAt(0);
    }
    showHumanizeButton(selection);
  } else {
    removeHumanizeButton();
  }
});

function showHumanizeButton(selection) {
  removeHumanizeButton();

  // Get selection coordinates
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Create button container
  const container = document.createElement('div');
  container.id = 'jumanizer-button-container';
  container.style.cssText = `
    position: fixed;
    top: ${rect.bottom + 5}px;
    left: ${rect.left}px;
    z-index: 999999;
    background: white;
    border: 1px solid #ddd;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    padding: 0;
  `;

  const button = document.createElement('button');
  button.textContent = '✨ Humanize';
  button.style.cssText = `
    background: #2563eb;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
  `;

  button.addEventListener('mouseenter', () => {
    button.style.background = '#1d4ed8';
  });

  button.addEventListener('mouseleave', () => {
    button.style.background = '#2563eb';
  });

  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    humanizeSelection();
  });

  container.appendChild(button);
  document.body.appendChild(container);
}

function removeHumanizeButton() {
  const container = document.getElementById('jumanizer-button-container');
  if (container) {
    container.remove();
  }
}

function humanizeSelection() {
  if (!selectedText) return;

  removeHumanizeButton();
  showLoadingIndicator(selectedText);

  // Send to background script
  chrome.runtime.sendMessage({
    action: 'humanizeText',
    text: selectedText
  }, (response) => {
    if (response && response.success) {
      replaceSelectedText(response.humanized);
    } else {
      showErrorMessage(response?.error || 'Failed to humanize text');
    }
  });
}

function replaceSelectedText(humanizedText) {
  removeLoadingIndicator();

  if (!selectedRange) return;

  try {
    selectedRange.deleteContents();
    const textNode = document.createTextNode(humanizedText);
    selectedRange.insertNode(textNode);
    
    // Clear selection
    window.getSelection().removeAllRanges();
    selectedText = '';
    selectedRange = null;
  } catch (error) {
    console.error('Error replacing text:', error);
    showErrorMessage('Could not replace text');
  }
}

function showLoadingIndicator(text) {
  removeLoadingIndicator();

  const loader = document.createElement('div');
  loader.id = 'jumanizer-loader';
  loader.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    color: #333;
    max-width: 300px;
  `;

  loader.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="width: 16px; height: 16px; border: 2px solid #e0e0e0; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <div>Humanizing...</div>
    </div>
    <style>
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  `;

  document.body.appendChild(loader);
}

function removeLoadingIndicator() {
  const loader = document.getElementById('jumanizer-loader');
  if (loader) {
    loader.remove();
  }
}

function showErrorMessage(error) {
  const message = document.createElement('div');
  message.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: white;
    border: 1px solid #fee;
    border-left: 4px solid #ef4444;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    color: #991b1b;
    max-width: 300px;
  `;

  message.textContent = `Error: ${error}`;
  document.body.appendChild(message);

  setTimeout(() => {
    message.remove();
  }, 4000);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'replaceText') {
    replaceSelectedText(request.humanizedText);
  } else if (request.action === 'showError') {
    showErrorMessage(request.error);
  } else if (request.action === 'showLoading') {
    showLoadingIndicator(request.selectedText);
  }
});
