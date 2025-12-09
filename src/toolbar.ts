import { setIcon } from 'obsidian'
import { ChessView } from './view'

export default class Toolbar {
	public previousButton: HTMLAnchorElement | null = null
	public nextButton: HTMLAnchorElement | null = null
	private toolbarEl: HTMLElement | null
	private view: ChessView
	private parentContainer: HTMLElement

	constructor(parentEl: HTMLElement, view: ChessView) {
		this.view = view
		this.parentContainer = parentEl
	
		this.toolbarEl = parentEl.createDiv('chess-toolbar')
		this.createPreviousMoveButton()
		this.createNextMoveButton()
		this.createFlipBoardButton()
		this.createResetButton()
		this.createToggleSidebarButton()
	}

	private createPreviousMoveButton() {
		this.previousButton = this.toolbarEl.createEl('a', 'view-action', (btn: HTMLAnchorElement) => {
			btn.ariaLabel = 'Previous Move'
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
			btn.ariaLabel = 'Next Move'
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
			btn.ariaLabel = 'Reset'
			setIcon(btn, 'restore-file-glyph')
			
			btn.addEventListener('click', (e: MouseEvent) => {
				e.preventDefault()
				this.view.loadMoveList()
				this.view.setMoveIndex(-1)
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
		this.toolbarEl.createEl('a', 'view-action', (btn: HTMLAnchorElement) => {
			btn.ariaLabel = 'Toggle Sidebar'
			setIcon(btn, 'menu')

			btn.addEventListener('click', (e: MouseEvent) => {
				e.preventDefault()
				this.parentContainer.addClass('no-menu')
			})
		})
	}
}