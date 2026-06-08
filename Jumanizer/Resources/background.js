// Service Worker - handles API calls and context menu
const API_VERSION = 'v1beta';
// Models to try in order of preference
const MODELS_TO_TRY = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-pro'
];

function getApiEndpoint(model = MODELS_TO_TRY[0]) {
  return `https://generativelanguage.googleapis.com/${API_VERSION}/models/${model}:generateContent`;
}

const API_ENDPOINT = getApiEndpoint();

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

  // Try each model in order until one works
  let lastError = null;
  for (const model of MODELS_TO_TRY) {
    try {
      const endpoint = `${getApiEndpoint(model)}?key=${apiKey}`;
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

        // Check if it's a model-not-found error, try next model
        if (normalized.includes('model') || normalized.includes('not found')) {
          lastError = new Error(`Model ${model} not available, trying next...`);
          continue; // Try next model
        }

        throw new Error(rawMessage);
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
      
      return humanized; // Success with this model
    } catch (error) {
      // If it's not a model-not-found error, throw immediately
      if (!error.message.includes('Model') || !error.message.includes('trying next')) {
        throw error;
      }
      lastError = error;
      // Continue to next model
    }
  }
  
  // If we get here, no models worked
  throw new Error(lastError?.message || 'All Gemini models failed. Please check your API access.');
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
