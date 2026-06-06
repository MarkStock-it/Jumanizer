# Safari Extension Setup

This folder contains the Safari extension project structure for Jumanizer.

## To Complete the Setup:

1. **Open Xcode**
   ```bash
   open Jumanizer.xcodeproj
   ```
   (You may need to create this via Xcode first)

2. **Create the Xcode Project** (if not already done)
   - Open Xcode
   - File → New → Project
   - Choose macOS → App
   - Set Product Name: `Jumanizer`
   - Set Organization: Your Name/Company
   - Leave other settings default
   - Save to this directory

3. **Configure Bundle Identifier**
   - In Xcode, select the `Jumanizer` target
   - Go to Build Settings
   - Search for "Bundle Identifier"
   - Set to: `com.markstock.jumanizer`

4. **Add Extension Target**
   - File → New → Target
   - Choose "Safari Web Extension"
   - Name: `Jumanizer Extension`
   - Set Bundle Identifier: `com.markstock.jumanizer.extension`

5. **Copy Resources**
   - The extension files are already in `Jumanizer/Resources/`
   - Make sure they're linked to the Safari Extension target in Build Phases

6. **Build**
   - Press Cmd + B to build
   - The app will appear in `~/Library/Developer/Xcode/Products/Debug/`

7. **Run on Safari**
   - Open Safari
   - Safari → Settings → Extensions
   - Enable "Jumanizer"
   - Configure settings in the extension options

## Directory Structure

```
Jumanizer/
├── Jumanizer.xcodeproj/           ← Xcode project (create this)
├── Jumanizer/
│   ├── Resources/                 ← All extension files
│   │   ├── manifest.json
│   │   ├── background.js
│   │   ├── content.js
│   │   ├── options.html
│   │   ├── options.js
│   │   ├── popup.html
│   │   └── popup.js
│   └── ...
├── Jumanizer Extension/
│   └── Info.plist                 ← Safari configuration
└── README.md
```

## Notes for Safari

- Safari uses `NSExtension` instead of Chrome's Manifest V3
- Content scripts work similarly but may have slight API differences
- The Info.plist configures the extension's capabilities
- Safari 15+ is required for full compatibility

## Troubleshooting

**"Can't find project file"**
- You need to create the Xcode project structure first
- Use Xcode's UI to create a new macOS App project

**"Extension won't load"**
- Check bundle identifiers match (Xcode target vs Info.plist)
- Make sure resources are in the correct folder
- Rebuild the project (Cmd + Shift + K, then Cmd + B)

**"Content scripts not running"**
- Check Safari Console (Safari → Preferences → Advanced → Show Develop menu)
- Verify Info.plist is configured correctly
- Check that content.js is referenced in the build

For detailed Safari extension development, see:
https://developer.apple.com/documentation/safariservices
