import { ChessView, AnnotatedMove } from './view'
import { Config } from './config'
import Toolbar from './toolbar'
import { Platform } from 'obsidian'

export default class Sidebar {
	private view: ChessView
	public sidebarEl: HTMLElement
	private moveListContainer: HTMLElement
	private moveListEl: HTMLElement
	public toolbar?: Toolbar
	private parentContainer: HTMLElement
	private config: Config
	private activeMoveEl?: HTMLElement

	constructor(parentEl: HTMLElement, view: ChessView, config: Config) {
		this.view = view
		this.parentContainer = parentEl
		this.config = config
		this.sidebarEl = this.parentContainer.createDiv('chess-sidebar')
		this.moveListContainer = this.sidebarEl.createDiv('chess-sidebar-section')

		this.createMoveList()
		this.createToolbar()
		setTimeout(() => {this.restoreScrollPosition(this.moveListEl.scrollHeight)}, 50)
	}

	private createToolbar() {
		if (!this.config.showToolbar || Platform.isMobile) {
			return
		}
		this.toolbar = new Toolbar(this.sidebarEl, this.view, this.config)
	}

	public createMoveList() {
		const previousScrollPosition = this.moveListEl?.scrollTop
		
		this.moveListContainer.empty()
		this.createTitle()
		
		this.moveListEl = this.moveListContainer.createDiv('chess-move-list')
		
		this.view.history().forEach((move, index) => {
			const moveEl = this.moveListEl.createDiv('chess-move')
			
			if (this.view.currentMoveIndex === index) {
				moveEl.addClass('chess-move-active')
				this.activeMoveEl = moveEl
			}
			
			this.createMoveText(moveEl, move.san)
			this.setMoveClickListener(moveEl, index)
			this.addMoveAnnotation(move, moveEl)
		})
		
		this.restoreScrollPosition(previousScrollPosition ?? 0)
	}

	private createMoveText(moveEl: HTMLElement, text: string) {
		moveEl.createSpan({ text: text })
	}

	private setMoveClickListener(moveEl: HTMLElement, moveIndex: number) {
		moveEl.addEventListener('click', (ev) => {
			ev.preventDefault()
			this.view.setMoveIndex(moveIndex)
		})
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
			} else {
				title = (this.view.turn() === 'b' ? 'Black to play': 'White to play')
			}
			
		} else {
			title = (this.view.turn() === 'b' ? 'Black to play' : 'White to play')
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

	private restoreScrollPosition(position: number) {
		
		// Scroll move list to the top on Reset Board
		if(this.view.currentMoveIndex == -1) {
			this.moveListEl.scrollTop = 0
			return
		}

		this.moveListEl.scrollTop = position
		
		if (this.activeMoveEl) {
			// Use requestAnimationFrame to ensure DOM is fully rendered
			requestAnimationFrame(() => {
				const containerRect = this.moveListEl.getBoundingClientRect()
				const moveRect = this.activeMoveEl.getBoundingClientRect()
				
				// Check if move is outside visible area
				const isAboveViewport = moveRect.bottom < containerRect.top
				const isBelowViewport = moveRect.top > containerRect.bottom
				
				if (isAboveViewport || isBelowViewport) {
					this.activeMoveEl.scrollIntoView({ behavior: 'instant', block: 'nearest' })
				}
			})
		}
	}

}
