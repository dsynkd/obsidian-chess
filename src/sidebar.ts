import { setIcon, Setting } from 'obsidian'
import { ChessView, AnnotatedMove, GameResult } from './view'
import { Config } from './config'

export default class Sidebar {
	private view: ChessView
	private sidebarEl: HTMLElement
	private moveListContainer: HTMLElement
	private moveListEl: HTMLElement
	private toolbar: HTMLElement | null
	private parentContainer: HTMLElement
	private config: Config

	constructor(parentEl: HTMLElement, view: ChessView, config: Config) {
		this.view = view
		this.parentContainer = parentEl
		this.config = config
		this.sidebarEl = this.parentContainer.createDiv('chess-sidebar')
		this.moveListContainer = this.sidebarEl.createDiv('chess-sidebar-section')

		this.redrawMoveList()
		this.createToolbar()
		this.setupResizeObserver()
	}

	private createToolbar() {
		if(!this.config.showToolbar) { return }
		this.toolbar = this.sidebarEl.createDiv('chess-toolbar')
		this.createPreviousMoveButton()
		this.createNextMoveButton()
		this.createFlipBoardButton()
		this.createResetButton()
		this.createToggleSidebarButton()
	}

	private createPreviousMoveButton() {
		this.toolbar.createEl('a', 'view-action', (btn: HTMLAnchorElement) => {

			btn.ariaLabel = 'Previous Move'
			setIcon(btn, 'left-arrow')

			btn.addEventListener('click', (e: MouseEvent) => {
				e.preventDefault()
				this.view.previousMove()
			})
		})
	}

	private createNextMoveButton() {
		this.toolbar.createEl('a', 'view-action', (btn: HTMLAnchorElement) => {

			btn.ariaLabel = 'Next Move'
			setIcon(btn, 'right-arrow')

			btn.addEventListener('click', (e: MouseEvent) => {
				e.preventDefault()
				this.view.nextMove()
			})
		})
	}

	private createResetButton() {
		this.toolbar.createEl('a', 'view-action', (btn: HTMLAnchorElement) => {
			
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
		this.toolbar.createEl('a', 'view-action', (btn: HTMLAnchorElement) => {
			
			btn.ariaLabel = 'Flip board'
			setIcon(btn, 'switch')

			btn.addEventListener('click', (e: MouseEvent) => {
				e.preventDefault()
				this.view.flipBoard()
			})
		})
	}

	private createToggleSidebarButton() {
		this.toolbar.createEl('a', 'view-action', (btn: HTMLAnchorElement) => {

			btn.ariaLabel = 'Toggle Sidebar'
			setIcon(btn, 'menu')

			btn.addEventListener('click', (e: MouseEvent) => {
				e.preventDefault()
				this.parentContainer.addClass('no-menu')
			})
		})
	}

	public redrawMoveList() {
		const previousScrollPosition = this.moveListEl?.scrollTop
		
		this.moveListContainer.empty()
		this.createTitle()
		
		let activeMoveEl: HTMLElement | null = null
		this.moveListEl = this.moveListContainer.createDiv('chess-move-list')
		
		this.view.history().forEach((move, idx) => {
			const moveEl = this.moveListEl.createDiv({
				cls: `chess-move ${
					this.view.currentMoveIndex === idx ? 'chess-move-active' : ''
				}`,
			})
			
			// Track the active move element
			if (this.view.currentMoveIndex === idx) {
				activeMoveEl = moveEl
			}
			
			const moveText = moveEl.createSpan({
				text: move.san,
			})

			moveEl.addEventListener('click', (ev) => {
				ev.preventDefault()
				this.view.setMoveIndex(idx)
			})
			this.addMoveAnnotation(move, moveEl)
		})
		
		this.restoreScrollPosition(activeMoveEl, previousScrollPosition ?? 0)
	}

	private createTitle() {
		const isLastMove = this.view.currentMoveIndex === this.view.history().length - 1
		const gameResult = this.view.getGameResult()
		
		let title = ''
		if(isLastMove) {
			if(gameResult) {
				title = this.view.getResultText(gameResult)
			} else if(this.view.isMate()) {
				title = (this.view.turn() === 'b' ? 'White wins' : 'Black wins')
			}
			
		} else {
			title = (this.view.turn() === 'b' ? "Black's turn" : "White's turn")
		}
		
		this.moveListContainer.createDiv({
			text: title,
			cls: 'chess-sidebar-title',
		})
	}

	private addMoveAnnotation(move: AnnotatedMove, moveEl: HTMLElement) {
		if(!this.config.showAnnotations || !move.annotation) { return }
		
		moveEl.createSpan({
			cls: `chess-move-annotation chess-move-annotation-${move.annotation}`,
			text: `${move.annotation.getGlyph()}`,
		})
	}

	private restoreScrollPosition(activeMoveEl: HTMLElement | null, position: number) {
		
		// Scroll move list to the top on Reset Board
		if(this.view.currentMoveIndex == -1) {
			this.moveListEl.scrollTop = 0
			return
		}

		// Always scroll all the way down on last move
		const isLastMove = this.view.currentMoveIndex === this.view.history().length - 1
		if(isLastMove) {
			setTimeout(() => { this.moveListEl.scrollTop = this.moveListEl.scrollHeight }, 50)
			return
		}

		this.moveListEl.scrollTop = position
		
		if (activeMoveEl) {
			// Use requestAnimationFrame to ensure DOM is fully rendered
			requestAnimationFrame(() => {
				const containerRect = this.moveListEl.getBoundingClientRect()
				const moveRect = activeMoveEl!.getBoundingClientRect()
				
				// Check if move is outside visible area
				const isAboveViewport = moveRect.bottom < containerRect.top
				const isBelowViewport = moveRect.top > containerRect.bottom
				
				if (isAboveViewport || isBelowViewport) {
					activeMoveEl!.scrollIntoView({ behavior: 'instant', block: 'nearest' })
				}
			})
		}
	}

	private setupResizeObserver() {
		const boardEl = this.parentContainer.querySelector('.cg-wrap')
		const resizeObserver = new ResizeObserver(entries => {
			const width = entries[0].contentRect.width
			this.sidebarEl.style.maxHeight = `${width}px`
			// Reposition annotation icons
			this.view.updateBoardAnnotations()
		})
		resizeObserver.observe(boardEl)
	}

}
