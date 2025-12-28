# FlashTags for Obsidian ⚡

**FlashTags** is a lightning-fast AI plugin for [Obsidian](https://obsidian.md). It uses Google's **Gemini Flash** model to automatically generate context-aware tags and metadata for your notes.

Stop organizing manually. Let FlashTags handle the metadata.

## ✨ Features

- **⚡ Instant Tagging**: Powered by Gemini 2.5 Flash for sub-second responses.
- **🧠 Smart Frontmatter**: Automatically injects tags and metadata into your note's YAML header.
- **📄 Context-Aware**: Reads up to 10,000 characters of your note to ensure accuracy.
- **💸 Free Tier Friendly**: Designed to work within Google's free API limits.

---

## 🚀 How to Use

FlashTags provides three specialized commands to help you organize your vault:

1. **FlashTags: Generate Tags**
   - Identifies 3-6 relevant technical tags and merges them into your note's metadata.
2. **FlashTags: Generate Summary**
   - Analyzes your content and creates a concise 1-sentence summary in the YAML header.
3. **FlashTags: Generate Metadata (Tags + Summary)**
   - The "all-in-one" command to fully populate your note's metadata in one go.

**To run a command:**
- Press `Ctrl+P` (or `Cmd+P` on Mac) and search for **"FlashTags"**.
- Select your desired command and hit Enter.

---

## ⚙️ Setup Guide

1. **Get an API Key**:
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
   - Create a free API key.

2. **Configure FlashTags**:
   - Open Obsidian **Settings** > **Community Plugins** > **FlashTags**.
   - Paste your key into the **Gemini API Key** field.

---

## 📦 Installation

### From Community Plugins
*(Coming Soon)*

### Manual Installation
1. Download `main.js`, `manifest.json`, and `styles.css` from the [Latest Release](https://github.com/Roshians/obsidian-flashtags/releases).
2. Create folder: `Vault/.obsidian/plugins/obsidian-flashtags/`.
3. Paste files and reload Obsidian.

---

## 🔒 Privacy Policy

- **Data**: Notes are sent to Google's Gemini API strictly for processing.
- **Storage**: No data is stored on our servers. API Keys are saved locally in your vault.
- **Terms**: Subject to [Google's AI Terms](https://policies.google.com/terms).

---

## License

MIT License