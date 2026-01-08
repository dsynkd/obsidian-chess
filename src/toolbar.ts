import { setIcon } from 'obsidian'
import { ChessView } from './view'
import { Config } from './config'

export default class Toolbar {
	public previousButton: HTMLAnchorElement | null = null
	public nextButton: HTMLAnchorElement | null = null
	public toolbarEl: HTMLElement | null
	private view: ChessView
    private config: Config
	private parentContainer: HTMLElement

	constructor(parentEl: HTMLElement, view: ChessView, config: Config) {
		this.view = view
		this.parentContainer = parentEl
        this.config = config
	
		this.toolbarEl = parentEl.createDiv('chess-toolbar')
		this.createPreviousMoveButton()
		this.createNextMoveButton()
		this.createFlipBoardButton()
		this.createResetButton()
		this.createToggleSidebarButton()
	}

	private createPreviousMoveButton() {
		this.previousButton = this.toolbarEl.createEl('a', 'view-action', (btn: HTMLAnchorElement) => {
			btn.ariaLabel = 'Previous move'
			setIcon(btn, 'left-arrow')

			btn.addEventListener('click', (e: MouseEvent) => {
				e.preventDefault()
				if (!btn.hasClass('is-disabled')) {
					this.view.previousMove()
				}
			})
		})
	}

	private createNextMoveButton() {
		this.nextButton = this.toolbarEl.createEl('a', 'view-action', (btn: HTMLAnchorElement) => {
			btn.ariaLabel = 'Next move'
			setIcon(btn, 'right-arrow')

			btn.addEventListener('click', (e: MouseEvent) => {
				e.preventDefault()
				if (!btn.hasClass('is-disabled')) {
					this.view.nextMove()
				}
			})
		})
	}

	private createResetButton() {
		this.toolbarEl.createEl('a', 'view-action', (btn: HTMLAnchorElement) => {
			btn.ariaLabel = 'Reset board'
			setIcon(btn, 'restore-file-glyph')
			
			btn.addEventListener('click', (e: MouseEvent) => {
				e.preventDefault()
				this.view.resetBoard()
			})
		})
	}

	private createFlipBoardButton() {
		this.toolbarEl.createEl('a', 'view-action', (btn: HTMLAnchorElement) => {
			btn.ariaLabel = 'Flip board'
			setIcon(btn, 'switch')

			btn.addEventListener('click', (e: MouseEvent) => {
				e.preventDefault()
				this.view.flipBoard()
			})
		})
	}

	private createToggleSidebarButton() {
        if(!this.view.shouldShowSidebar()) { return }
		this.toolbarEl.createEl('a', 'view-action', (btn: HTMLAnchorElement) => {
			btn.ariaLabel = 'Toggle sidebar'
			setIcon(btn, 'menu')

			btn.addEventListener('click', (e: MouseEvent) => {
				e.preventDefault()
				this.view.toggleSidebar()
			})
		})
	}
}
