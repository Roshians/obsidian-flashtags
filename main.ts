import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, requestUrl } from 'obsidian';

// Configuration Constants
const GEMINI_MODEL = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// 1. Settings Definition
interface GeminiTaggerSettings {
	apiKey: string;
}

const DEFAULT_SETTINGS: GeminiTaggerSettings = {
	apiKey: ''
}

export default class GeminiTaggerPlugin extends Plugin {
	settings: GeminiTaggerSettings;

	async onload() {
		await this.loadSettings();

		// Command: Trigger the AI generation
		this.addCommand({
			id: 'generate-tags-gemini',
			name: 'Generate Tags',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.generateTags(editor);
			}
		});

		// Settings Tab: For API Key entry
		this.addSettingTab(new GeminiTaggerSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Main Logic: Sends note content to Gemini and appends tags.
	 */
	async generateTags(editor: Editor) {
		const noteContent = editor.getValue();
		
		// Validation
		if (!this.settings.apiKey) {
			new Notice('❌ Please enter your Gemini API Key in settings.');
			return;
		}
		if (!noteContent.trim()) {
			new Notice('⚠️ Note is empty. Write something first!');
			return;
		}

		new Notice('✨ Generating tags...');

		try {
			const response = await requestUrl({
				url: `${API_URL}?key=${this.settings.apiKey}`,
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents: [{
						parts: [{
							// Optimized Prompt for strictly formatted tags
							text: `Analyze the following note and identify the 3-6 most relevant topics.
							Output ONLY the tags as hashtags separated by spaces (e.g. #productivity #finance #ideas).
							Do not use markdown bolding. Do not add introductory text.
							
							Note Content:
							${noteContent.substring(0, 10000)}` 
						}]
					}]
				})
			});

			const data = response.json;
			
			if (data.candidates && data.candidates.length > 0) {
				const generatedTags = data.candidates[0].content.parts[0].text.trim();
				
				// Append to the end of the file with a clean newline separator
				editor.setCursor(editor.lastLine());
				editor.replaceSelection(`\n\n${generatedTags}`);
				new Notice('✅ Tags added!');
			} else {
				new Notice('⚠️ AI returned no results.');
			}

		} catch (error) {
			console.error("Gemini Plugin Error:", error);
			new Notice('❌ Connection failed. Check your API Key or Internet.');
		}
	}
}

// 2. Settings Tab UI
class GeminiTaggerSettingTab extends PluginSettingTab {
	plugin: GeminiTaggerPlugin;

	constructor(app: App, plugin: GeminiTaggerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Gemini API Key')
			.setDesc('Get your free key from aistudio.google.com')
			.addText(text => text
				.setPlaceholder('Enter your key (AIza...)')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value.trim();
					await this.plugin.saveSettings();
				}));
	}
}