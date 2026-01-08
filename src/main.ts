import { App, MarkdownPostProcessorContext, MarkdownView, Notice, Plugin } from 'obsidian'
import { ChessView } from './view'
import { Settings, ChessPluginSettingTab, DEFAULT_SETTINGS } from './settings'
import { Config, parseUserConfig } from './config'

export default class ChessPlugin extends Plugin {
	settings: Settings

	async onload() {
		await this.loadSettings()
		this.addSettingTab(new ChessPluginSettingTab(this.app, this))

		// MARK: Register Codeblock Processors
		this.registerMarkdownCodeBlockProcessor(
			'chess',
			this.drawChessboard(this.app, this.settings)
		)
		this.registerMarkdownCodeBlockProcessor(
			'chess-pgn',
			this.drawPGNChessboard(this.app, this.settings)
		)
		this.registerMarkdownCodeBlockProcessor(
			'chess-fen',
			this.drawFENChessboard(this.app, this.settings)
		)
		
		// MARK: Register Commands
		this.addCommand({
			id: 'toggle-sidebar',
			name: 'Toggle sidebar',
			callback: () => {
				// Only execute if the current active container is a Chess View
				if(document.activeElement.hasClass('chess-view') === false) {
					return
				}

				document.activeElement.toggleClass('hide-sidebar', document.activeElement.hasClass('hide-sidebar'))
			},
			hotkeys: []
		})
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
	}

	async saveSettings() {
		await this.saveData(this.settings)
		this.refreshActiveViews()
	}

	private drawChessboard(app: App, settings: Settings) {
		return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			const config = parseUserConfig(settings, source)
			if(!config) {
				presentError(el, 'Could not parse user config.')
				return
			}
			ctx.addChild(new ChessView(el, ctx, config, app))
		}
	}

	private drawPGNChessboard(app: App, settings: Settings) {
		return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			const config: Config = {
				...settings,
				fen: '',
				pgn: source.trim(),
			} 
			ctx.addChild(new ChessView(el, ctx, config, app))
		}
	}

	private drawFENChessboard(app: App, settings: Settings) {
		return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			const config: Config = {
				...settings,
				fen: source.trim()
			} 
			if(!config.interactability) { config.showSidebar = false }
			ctx.addChild(new ChessView(el, ctx, config, app))
		}
	}

	private refreshActiveViews() {
		this.app.workspace.getLeavesOfType('markdown').forEach(leaf => {
			const view = leaf.view as MarkdownView
			this.app.vault.read(view.file).then(content => {
				view.setViewData(content, true)
			}).catch((e) => {
				console.warn(`[Obsidian Chess] Error: ${e}`)
			})
		})
	}
}

export function presentError(
	containerEl: HTMLElement,
	errorMessage: string,
	printToConsole: boolean = false,
	showNotice: boolean = false
) {
	if(printToConsole) {
		console.warn(`[ChessPlugin] ${errorMessage}`)
	}
	if(showNotice) {
		new Notice(`[ChessPlugin] ${errorMessage}`)
	}
	if(!containerEl) {
		return
	}
	const errorEl = containerEl.createDiv('chess-error')
	errorEl.textContent = `${errorMessage}`
}