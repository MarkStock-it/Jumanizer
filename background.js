// Service Worker - handles API calls and context menu
const API_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

// Create context menu on install/update
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'humanizeText',
    title: 'Humanize this text',
    contexts: ['selection']
  });
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'humanizeText' && info.selectionText) {
    humanizeAndReplace(tab.id, info.selectionText);
  }
});

// Message listener from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'humanizeText') {
    humanizeText(request.text, sender.tab.id, request.elementId)
      .then(humanized => {
        sendResponse({ success: true, humanized });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
});

async function humanizeText(text, tabId, elementId) {
  // Get API key from storage
  const result = await chrome.storage.sync.get('apiKey');
  const apiKey = result.apiKey;

  if (!apiKey) {
    throw new Error('API key not configured. Please set it in the extension options.');
  }

  const systemPrompt = `You are an expert at making AI-generated text sound naturally human. Rewrite the provided text following these rules strictly:

1. Vary sentence length significantly - mix short punchy sentences with longer ones
2. Remove overly formal or robotic phrasing
3. Add natural filler transitions like "honestly", "to be fair", "look,", "I mean", "basically"
4. Break perfect grammar occasionally with contractions and casual tone
5. Eliminate AI tells: excessive em-dashes, bullet points, "delve", "certainly", "I'd be happy to", "In conclusion", "Furthermore", "As an AI"
6. Use conversational language and natural speech patterns
7. Output should sound like a real person with personality wrote it

Return ONLY the rewritten text, no explanations or meta-commentary.`;

  const userPrompt = `Humanize this text:\n\n${text}`;

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'API request failed');
  }

  const data = await response.json();
  const humanized = data.content[0].text.trim();

  // Send back to content script to replace text
  chrome.tabs.sendMessage(tabId, {
    action: 'replaceText',
    elementId,
    originalText: text,
    humanizedText: humanized
  });

  return humanized;
}

async function humanizeAndReplace(tabId, selectedText) {
  // Show loading state
  chrome.tabs.sendMessage(tabId, {
    action: 'showLoading',
    selectedText
  }).catch(() => {}); // Ignore if content script not ready

  try {
    const humanized = await humanizeText(selectedText, tabId, null);
    // Content script will handle replacement via onMessage
  } catch (error) {
    chrome.tabs.sendMessage(tabId, {
      action: 'showError',
      error: error.message
    }).catch(() => {});
  }
}
