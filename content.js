// Content Script - handles selection and UI injection
let selectedText = '';
let selectedRange = null;
let isEnabled = true;
let humanizeButton = null;
let humanizeButtonContainer = null;

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

  if (selectedText.length > 0 && selection.rangeCount > 0) {
    selectedRange = selection.getRangeAt(0);
    showHumanizeButton(selection);
  } else {
    removeHumanizeButton();
  }
});

function showHumanizeButton(selection) {
  removeHumanizeButton();

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const iconUrl = chrome.runtime.getURL('humanize.svg');

  const container = document.createElement('div');
  container.id = 'jumanizer-button-container';
  container.style.cssText = `
    position: fixed;
    top: ${Math.min(window.innerHeight - 48, rect.bottom + 10)}px;
    left: ${Math.max(12, rect.left)}px;
    z-index: 999999;
    background: rgba(255, 255, 255, 0.98);
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
    padding: 4px;
    backdrop-filter: blur(14px);
  `;

  const button = document.createElement('button');
  button.type = 'button';
  button.innerHTML = `<img src="${iconUrl}" alt="" class="jumanizer-button-icon"><span>Humanize</span>`;
  button.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: white;
    border: none;
    padding: 11px 16px;
    border-radius: 14px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
    white-space: nowrap;
    box-shadow: 0 12px 26px rgba(37, 99, 235, 0.22);
  `;

  const icon = button.querySelector('.jumanizer-button-icon');
  if (icon) {
    icon.style.width = '18px';
    icon.style.height = '18px';
  }

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-1px)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'none';
  });

  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    humanizeSelection();
  });

  container.appendChild(button);
  document.body.appendChild(container);

  humanizeButton = button;
  humanizeButtonContainer = container;
}

function setButtonState(label, disabled = false) {
  if (!humanizeButton) return;
  const iconUrl = chrome.runtime.getURL('humanize.svg');
  humanizeButton.innerHTML = `<img src="${iconUrl}" alt="" class="jumanizer-button-icon"><span>${label}</span>`;
  humanizeButton.disabled = disabled;
  humanizeButton.style.opacity = disabled ? '0.75' : '1';
  humanizeButton.style.cursor = disabled ? 'default' : 'pointer';
  const icon = humanizeButton.querySelector('.jumanizer-button-icon');
  if (icon) {
    icon.style.width = '18px';
    icon.style.height = '18px';
  }
}

function removeHumanizeButton() {
  if (humanizeButtonContainer) {
    humanizeButtonContainer.remove();
  }
  humanizeButton = null;
  humanizeButtonContainer = null;
}

async function humanizeSelection() {
  if (!selectedText || !humanizeButton) return;

  setButtonState('Humanizing…', true);
  showLoadingIndicator();

  chrome.runtime.sendMessage({
    action: 'humanizeText',
    text: selectedText
  }, async (response) => {
    if (response && response.success) {
      const humanized = response.humanized || '';
      await copyTextToClipboard(humanized);
      replaceSelectedText(humanized);
      setButtonState('Copied', true);
      setTimeout(removeHumanizeButton, 900);
    } else {
      setButtonState('Humanize', false);
      showErrorMessage(response?.error || 'Failed to humanize text');
    }
  });
}

function copyTextToClipboard(text) {
  if (!text) return Promise.resolve();

  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  }

  return fallbackCopy(text);
}

function fallbackCopy(text) {
  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      successful ? resolve() : reject(new Error('Copy command failed')); 
    } catch (err) {
      document.body.removeChild(textarea);
      reject(err);
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

    window.getSelection().removeAllRanges();
    selectedText = '';
    selectedRange = null;
  } catch (error) {
    console.error('Error replacing text:', error);
    showErrorMessage('Could not replace text');
  }
}

function showLoadingIndicator() {
  removeLoadingIndicator();

  const loader = document.createElement('div');
  loader.id = 'jumanizer-loader';
  loader.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.98);
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 18px;
    padding: 14px 16px;
    box-shadow: 0 24px 40px rgba(15, 23, 42, 0.12);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    color: #0f172a;
    max-width: 320px;
  `;

  loader.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="width: 16px; height: 16px; border: 2px solid #dbeafe; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
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
    border: 1px solid #fee2e2;
    border-left: 4px solid #ef4444;
    border-radius: 18px;
    padding: 16px;
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.14);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    color: #991b1b;
    max-width: 320px;
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
    showLoadingIndicator();
  }
});
