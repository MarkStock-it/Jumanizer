// Service Worker - handles API calls and context menu
const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const API_VERSION = 'v1beta';
const MODEL = 'gemini-2.0-flash';

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
    chrome.storage.sync.get('extensionEnabled', (result) => {
      const isEnabled = result.extensionEnabled !== false;
      if (isEnabled) {
        humanizeAndReplace(tab.id, info.selectionText);
      } else {
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'showError',
            error: 'Extension is disabled. Enable it in the popup before using the context menu.'
          }, () => {});
        }
      }
    });
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

  const endpoint = `${API_ENDPOINT}?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      system_instruction: {
        parts: {
          text: systemPrompt
        }
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: userPrompt
            }
          ]
        }
      ],
      generation_config: {
        max_output_tokens: 2048,
        temperature: 0.7
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    const rawMessage = errorData.error?.message || errorData.message || 'API request failed';
    const normalized = String(rawMessage).toLowerCase();

    let errorMsg = rawMessage;
    if (normalized.includes('quota exceeded') || normalized.includes('rate limit')) {
      errorMsg = 'Quota exceeded. Check your Google API plan, billing, or usage limits for Gemini.';
    } else if (normalized.includes('invalid api key') || normalized.includes('api key not valid') || normalized.includes('key invalid')) {
      errorMsg = 'API key invalid. Please update your key in the extension options.';
    }

    throw new Error(errorMsg);
  }

  const data = await response.json();
  const humanized = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  
  if (!humanized) {
    throw new Error('No response from API');
  }

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
  }, () => {}); // Ignore if content script not ready

  try {
    const humanized = await humanizeText(selectedText, tabId, null);
    // Content script will handle replacement via onMessage
  } catch (error) {
    chrome.tabs.sendMessage(tabId, {
      action: 'showError',
      error: error.message
    }, () => {});
  }
}
