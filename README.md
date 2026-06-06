# Jumanizer - AI Text Humanizer

A Chrome/Safari browser extension that transforms AI-generated text into natural, human-sounding writing with a single click.

## Features

✨ **Humanize AI-generated text instantly**
- Select any text on a webpage
- Click "Humanize" or use the context menu
- Get naturally rewritten text that sounds human

Smart rewriting that follows these rules:**
- Varies sentence length (short punchy + longer ones)
- Removes formal/robotic phrasing
- Adds natural transitions ("honestly", "to be fair", "look,")
- Breaks perfect grammar with contractions & casual tone
- Eliminates AI tells: em-dashes, "delve", "certainly", "I'd be happy to", etc.
- Outputs text that sounds like a real person wrote it

 Simple setup**
- Just add your Anthropic API key to the options page
- Enable/disable with a toggle
- Works on any webpage

## Installation

### Chrome
1. Clone or download this repository
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `Jumanizer` folder
6. Done! The extension is now loaded

### Safari
*Note: Safari support requires additional signing and distribution setup. For now, use Chrome for development.*

## Setup

### Get Your API Key
1. Visit [Google AI Studio](https://aistudio.google.com)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key
5. Copy the key

### Configure the Extension
1. Click the Jumanizer icon in your browser toolbar
2. Click "Options"
3. Paste your Google Gemini API key into the "Google Gemini API Key" field
4. Click "Save Settings"
5. Enable the extension if it's not already on

## Usage

### Method 1: Selection Button
1. Select any text on a webpage (click and drag)
2. A "✨ Humanize" button will appear above the text
3. Click it
4. The text is rewritten and replaced instantly

### Method 2: Context Menu
1. Right-click on selected text
2. Choose "Humanize this text"
3. The text is rewritten and replaced instantly

### Toggle On/Off
- Click the Jumanizer icon
- Toggle "Enable Extension" on/off
- When disabled, the humanize button won't appear

## File Structure

```
Jumanizer/
├── manifest.json          # Extension configuration (Manifest V3)
├── background.js          # Service worker - handles API calls
├── content.js             # Injects UI and handles selections
├── options.html           # Settings page UI
├── options.js             # Settings page logic
├── popup.html             # Icon popup UI
├── popup.js               # Icon popup logic
└── README.md              # This file
```

## How It Works

1. Content Script (`content.js`): 
   - Listens for text selection on any webpage
   - Injects the humanize button above selected text
   - Sends selection to the background script

2. Service Worker (`background.js`):
   - Receives text selection requests
   - Calls the Anthropic Claude API
   - Returns the humanized text

3. Text Replacement:
   - The humanized text replaces the selected text directly
   - No dialogs or extra steps

4. Storage:
   - API key is stored in `chrome.storage.sync`
   - Syncs across your Chrome devices if you're signed in

## API Usage

The extension uses:
- **Model**: Gemini 2.0 Flash (`gemini-2.0-flash`)
- **API Version**: v1beta
- **Max tokens**: 2,048 per request
- **Temperature**: 0.7 (balanced creativity & stability)
- **API costs**: Check [Google AI Studio pricing](https://ai.google.dev/pricing)

## Tips for Best Results

- **Large selections**: Works best with 1-3 paragraphs at a time
- **Context matters**: More context helps Claude produce better rewrites
- **Test it**: Try on ChatGPT, Claude, or other AI outputs to see the difference
- **Iterate**: If you don't like a result, select and humanize again

## Limitations

- Requires an internet connection for the API call
- API key is required (get a free one from Anthropic)
- Can't humanize text inside iframes (security limitation)
- Rate limits depend on your Anthropic API plan

## Troubleshooting

### "API key not configured"
- Go to Options and paste your Google Gemini API key
- Make sure it starts with `AIza`

### Text isn't being replaced
- Make sure the extension is enabled
- Refresh the webpage
- Try selecting a different portion of text

### Button not appearing
- Extension might be disabled
- Check the popup to enable it
- Try right-click context menu instead

### API errors
- Check your API key is correct
- Make sure your Google account has API access enabled
- Check your internet connection

## Privacy & Security

- Your API key is stored locally in Chrome's encrypted storage
- Text is sent to Google's Gemini API for processing
- No data is stored on any server beyond Google's API
- Review [Google's privacy policy](https://policies.google.com/privacy)

## Development

### Debugging
1. Go to `chrome://extensions/`
2. Find Jumanizer
3. Click "Details"
4. Click "Background page" to see console errors
5. Right-click on a webpage → "Inspect" → "Console" for content script errors

### Making Changes
1. Edit the files
2. Go to `chrome://extensions/`
3. Click the refresh icon on Jumanizer
4. Test on a webpage

## License

Created for personal use. Feel free to modify for your needs.

## Support

If you hit issues:
1. Check the console for error messages (see Debugging section)
2. Verify your API key is valid
3. Try refreshing the extension
4. Test on a different website

---

**Made with  for humanizing AI text**
