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

type Mode = 'tags' | 'summary' | 'all';

export default class GeminiTaggerPlugin extends Plugin {
	settings: GeminiTaggerSettings;

	async onload() {
		await this.loadSettings();

		// Command 1: Generate Tags Only
		this.addCommand({
			id: 'flashtags-generate-tags',
			name: 'Generate Tags',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.processNote(view, 'tags');
			}
		});

		// Command 2: Generate Summary Only
		this.addCommand({
			id: 'flashtags-generate-summary',
			name: 'Generate Summary',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.processNote(view, 'summary');
			}
		});

		// Command 3: Generate All Metadata
		this.addCommand({
			id: 'flashtags-generate-all',
			name: 'Generate Metadata (Tags + Summary)',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.processNote(view, 'all');
			}
		});

		// Settings Tab
		this.addSettingTab(new GeminiTaggerSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Core Logic: Handles Prompt Generation & Frontmatter Update based on Mode.
	 */
	async processNote(view: MarkdownView, mode: Mode) {
		const noteContent = view.editor.getValue();
		
		// Validation
		if (!this.settings.apiKey) {
			new Notice('❌ FlashTags: Please enter API Key in settings.');
			return;
		}
		if (!noteContent.trim()) {
			new Notice('⚠️ Note is empty.');
			return;
		}

		// User Feedback
		let actionText = 'Analyzing...';
		if (mode === 'tags') actionText = 'Generating Tags...';
		if (mode === 'summary') actionText = 'Summarizing...';
		if (mode === 'all') actionText = 'Generating Metadata...';
		
		new Notice(`⚡ FlashTags: ${actionText}`);

		try {
			// 1. Construct the specific Prompt based on Mode
			let instruction = '';
			if (mode === 'tags') {
				instruction = `Identify 3-6 highly relevant tags.
				- Format: lowercase, kebab-case (e.g. "data-structures").
				- Convert symbols to text based on context (e.g. "cpp" for "C++", "c-sharp" for "C#").
				- Priority: Specific technical concepts (languages, libraries) over generic verbs.
				- No hashtags (#).
				Return JSON: { "tags": ["tag1", "tag2"] }`;
			} else if (mode === 'summary') {
				instruction = `Write a concise 1-sentence summary capturing the core concept. Return JSON: { "summary": "Your summary here." }`;
			} else {
				instruction = `Identify 3-6 relevant tags (lowercase, kebab-case, convert symbols like "cpp") AND a concise 1-sentence summary.
				Return JSON: { "tags": [], "summary": "" }`;
			}

			const prompt = `
				Analyze this note content.
				${instruction}
				Output valid JSON ONLY. No markdown formatting.

				Note Content:
				${noteContent.substring(0, 10000)}
			`;

			// 2. Call Gemini API
			const response = await requestUrl({
				url: `${API_URL}?key=${this.settings.apiKey}`,
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }]
				})
			});

			const data = response.json;
			
			if (data.candidates && data.candidates.length > 0) {
				let rawText = data.candidates[0].content.parts[0].text.trim();
				rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

				try {
					const aiResponse = JSON.parse(rawText);

					if (!view.file) {
						new Notice('❌ No file detected.');
						return;
					}

					// 3. Update Frontmatter
					await this.app.fileManager.processFrontMatter(view.file, (frontmatter) => {
						
						// Update TAGS (if requested)
						if (mode === 'tags' || mode === 'all') {
							if (aiResponse.tags) {
								if (!frontmatter['tags']) frontmatter['tags'] = [];
								let existingTags = frontmatter['tags'];
								if (typeof existingTags === 'string') existingTags = [existingTags];
								if (!Array.isArray(existingTags)) existingTags = [];

								aiResponse.tags.forEach((tag: string) => {
									// Refined Sanitizer: 
                                    // 1. Lowercase
                                    // 2. Spaces -> Dashes
                                    // 3. Remove all EXCEPT words, numbers, dashes, underscores, and forward slashes (/)
									let cleanTag = tag.toLowerCase()
										.replace(/\s+/g, '-')
										.replace(/[^\w\-/]/g, ''); 
									
                                    // 4. Handle pure numeric tags (e.g. 2024 -> n2024)
                                    if (/^\d+$/.test(cleanTag)) {
                                        cleanTag = 'n' + cleanTag;
                                    }

									if (cleanTag && !existingTags.includes(cleanTag)) {
										existingTags.push(cleanTag);
									}
								});
								frontmatter['tags'] = existingTags;
							}
						}

						// Update SUMMARY (if requested)
						if (mode === 'summary' || mode === 'all') {
							if (aiResponse.summary) {
								frontmatter['summary'] = aiResponse.summary;
							}
						}
					});

					new Notice('✅ Updated!');
				} catch (jsonError) {
					console.error("JSON Error:", jsonError);
					new Notice('❌ Failed to parse AI response.');
				}
			} else {
				new Notice('⚠️ AI returned no results.');
			}

		} catch (error) {
			console.error("Gemini Plugin Error:", error);
			new Notice('❌ Connection failed.');
		}
	}
}

// Settings Tab UI
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