// Content Script - handles selection replacement and UI messages

function replaceSelectedText(humanizedText) {
  removeLoadingIndicator();

  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;

  try {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(humanizedText);
    range.insertNode(textNode);

    window.getSelection().removeAllRanges();
  } catch (error) {
    console.error('Error replacing text:', error);
    showErrorMessage('Could not replace text. Please try again.');
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'replaceText') {
    replaceSelectedText(request.humanizedText);
  } else if (request.action === 'showError') {
    showErrorMessage(request.error);
  } else if (request.action === 'showLoading') {
    showLoadingIndicator();
  }
});
