import { BOARD_STYLES, PIECE_STYLES } from './config'
import ChessPlugin from './main'

import { App, PluginSettingTab, Setting } from 'obsidian'

export interface Settings {
	interactability: boolean
	showCoordinates: boolean
	pieceStyle: string
	boardStyle: string
	orientation: string
	boardAlignment: string
	showSidebar: boolean
	showToolbar: boolean
	showAnnotations: boolean
	playSounds: boolean
}

export const DEFAULT_SETTINGS: Settings = {
	interactability: true,
	showCoordinates: true,
	pieceStyle: 'cburnett',
	boardStyle: 'brown',
	orientation: 'white',
	boardAlignment: 'leading',
	showSidebar: true,
	showToolbar: true,
	showAnnotations: true,
	playSounds: false,
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
		new Setting(containerEl).setName('Chessboard').setHeading()

		new Setting(containerEl)
			.setName('Interactability')
			.setDesc('Toggles whether chessboard interactions are allowed. If disabled, displays a static chessboard (view only).')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.interactability).onChange((interactability) => {
					this.plugin.settings.interactability = interactability
					void this.plugin.saveSettings()
				})
			})

		new Setting(containerEl)
			.setName('Show coordinates')
			.setDesc('Displays rank (1-8) and file (a-h) labels on the chessboard.')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.showCoordinates).onChange((showCoordinates) => {
					this.plugin.settings.showCoordinates = showCoordinates
					this.plugin.saveSettings()
				})
			})

		new Setting(containerEl)
			.setName('Piece style')
			.addDropdown((dropdown) => {
				const styles: Record<string, string> = {}
				PIECE_STYLES.map((style) => (styles[style] = style))
				dropdown.addOptions(styles)

				dropdown.setValue(this.plugin.settings.pieceStyle).onChange((pieceStyle) => {
					this.plugin.settings.pieceStyle = pieceStyle
					void this.plugin.saveSettings()
				})
			})

		new Setting(containerEl)
			.setName('Board style')
			.addDropdown((dropdown) => {
				const styles: Record<string, string> = {}
				BOARD_STYLES.map((style) => (styles[style] = style))
				dropdown.addOptions(styles)

				dropdown.setValue(this.plugin.settings.boardStyle).onChange((boardStyle) => {
					this.plugin.settings.boardStyle = boardStyle
					void this.plugin.saveSettings()
				})
			})

		new Setting(containerEl)
			.setName('Default orientation')
			.addDropdown((dropdown) => {
				dropdown.addOption('white', 'White')
				dropdown.addOption('black', 'Black')

				dropdown.setValue(this.plugin.settings.orientation).onChange((orientation) => {
					this.plugin.settings.orientation = orientation
					void this.plugin.saveSettings()
				})
			})

		new Setting(containerEl)
			.setName('Board alignment')
			.setDesc('Alignment of the chess view when the sidebar is hidden.')
			.addDropdown((dropdown) => {
				dropdown.addOption('leading', 'Leading')
				dropdown.addOption('middle', 'Middle')
				dropdown.addOption('trailing', 'Trailing')

				dropdown.setValue(this.plugin.settings.boardAlignment).onChange((boardAlignment) => {
					this.plugin.settings.boardAlignment = boardAlignment
					void this.plugin.saveSettings()
				})
			})

		new Setting(containerEl).setName('Sidebar').setHeading()

		new Setting(containerEl)
			.setName('Show sidebar')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.showSidebar).onChange((showSidebar) => {
					this.plugin.settings.showSidebar = showSidebar
					void this.plugin.saveSettings()
				})
			})

		new Setting(containerEl)
			.setName('Show toolbar')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.showToolbar).onChange((showToolbar) => {
					this.plugin.settings.showToolbar = showToolbar
					void this.plugin.saveSettings()
				})
			})

		new Setting(containerEl).setName('Annotations').setHeading()

		new Setting(containerEl)
			.setName('Show annotations')
			.setDesc('Displays move annotations (!!, !, ?!, ?, ??, !?) on the board and in the move list.')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.showAnnotations).onChange((showAnnotations) => {
					this.plugin.settings.showAnnotations = showAnnotations
					void this.plugin.saveSettings()
				})
			})

		new Setting(containerEl).setName('Audio').setHeading()

		new Setting(containerEl)
			.setName('Play sounds')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.playSounds).onChange((playSounds) => {
					this.plugin.settings.playSounds = playSounds
					void this.plugin.saveSettings()
				})
			})
	}
}
