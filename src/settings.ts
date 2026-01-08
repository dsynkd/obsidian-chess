import { BOARD_STYLES, PIECE_STYLES } from './config'
import ChessPlugin from './main'

import { App, PluginSettingTab, Setting } from 'obsidian'

export interface Settings {
	interactability: boolean
	enableCoordinates: boolean
	pieceStyle: string
	boardStyle: string
	orientation: string
	showSidebar: boolean
	boardAlignment: string
	showAnnotations: boolean
	enableSounds: boolean
	showToolbar: boolean
}

export const DEFAULT_SETTINGS: Settings = {
	interactability: false,
	enableCoordinates: true,
	pieceStyle: 'cburnett',
	boardStyle: 'brown',
	orientation: 'white',
	showSidebar: true,
	boardAlignment: 'leading',
	showAnnotations: true,
	enableSounds: false,
	showToolbar: true,
}

export class ChessPluginSettingTab extends PluginSettingTab {
	plugin: ChessPlugin

	constructor(app: App, plugin: ChessPlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		const { containerEl } = this

		containerEl.empty()

		// Chessboard Section
		containerEl.createEl('h3', { text: 'Chessboard' })

		new Setting(containerEl)
			.setName('Interactability')
			.setDesc('Toggles whether chessboard interactions are allowed. If disabled, displays a static chessboard.')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.interactability).onChange((interactability) => {
					this.plugin.settings.interactability = interactability
					this.plugin.saveSettings()
				})
			})

		new Setting(containerEl)
			.setName('Show Coordinates')
			.setDesc('Displays rank (1-8) and file (a-h) labels on the chessboard.')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.enableCoordinates).onChange((enableCoordinates) => {
					this.plugin.settings.enableCoordinates = enableCoordinates
					this.plugin.saveSettings()
				})
			})

		new Setting(containerEl)
			.setName('Piece Style')
			.addDropdown((dropdown) => {
				const styles: Record<string, string> = {}
				PIECE_STYLES.map((style) => (styles[style] = style))
				dropdown.addOptions(styles)

				dropdown.setValue(this.plugin.settings.pieceStyle).onChange((pieceStyle) => {
					this.plugin.settings.pieceStyle = pieceStyle
					this.plugin.saveSettings()
				})
			})

		new Setting(containerEl)
			.setName('Board Style')
			.addDropdown((dropdown) => {
				const styles: Record<string, string> = {}
				BOARD_STYLES.map((style) => (styles[style] = style))
				dropdown.addOptions(styles)

				dropdown.setValue(this.plugin.settings.boardStyle).onChange((boardStyle) => {
					this.plugin.settings.boardStyle = boardStyle
					this.plugin.saveSettings()
				})
			})

		new Setting(containerEl)
			.setName('Default Orientation')
			.addDropdown((dropdown) => {
				dropdown.addOption('white', 'White')
				dropdown.addOption('black', 'Black')

				dropdown.setValue(this.plugin.settings.orientation).onChange((orientation) => {
					this.plugin.settings.orientation = orientation
					this.plugin.saveSettings()
				})
			})

		new Setting(containerEl)
			.setName('Board Alignment')
			.setDesc('Alignment of the chess view when the sidebar is hidden.')
			.addDropdown((dropdown) => {
				dropdown.addOption('leading', 'Leading')
				dropdown.addOption('middle', 'Middle')
				dropdown.addOption('trailing', 'Trailing')

				dropdown.setValue(this.plugin.settings.boardAlignment).onChange((boardAlignment) => {
					this.plugin.settings.boardAlignment = boardAlignment
					this.plugin.saveSettings()
				})
			})

		containerEl.createEl('h3', { text: 'Sidebar' })

		new Setting(containerEl)
			.setName('Show Sidebar')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.showSidebar).onChange((showSidebar) => {
					this.plugin.settings.showSidebar = showSidebar
					this.plugin.saveSettings()
				})
			})

		new Setting(containerEl)
			.setName('Show Toolbar')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.showToolbar).onChange((showToolbar) => {
					this.plugin.settings.showToolbar = showToolbar
					this.plugin.saveSettings()
				})
			})

		containerEl.createEl('h3', { text: 'Annotations' })

		new Setting(containerEl)
			.setName('Show Annotations')
			.setDesc('Displays move annotations (!!, !, ?!, ?, ??, !?) on the board and in the move list.')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.showAnnotations).onChange((showAnnotations) => {
					this.plugin.settings.showAnnotations = showAnnotations
					this.plugin.saveSettings()
				})
			})

		containerEl.createEl('h3', { text: 'Audio' })

		new Setting(containerEl)
			.setName('Play Sounds')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.enableSounds).onChange((enableSounds) => {
					this.plugin.settings.enableSounds = enableSounds
					this.plugin.saveSettings()
				})
			})
	}
}
