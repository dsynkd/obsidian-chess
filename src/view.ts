import {
	App,
	MarkdownPostProcessorContext,
	MarkdownRenderChild,
	Menu,
	setIcon,
	Platform
} from 'obsidian'
import { Chess, Move, SQUARES } from 'chess.js'
import { Chessground } from 'chessground'
import { Api } from 'chessground/api'
import { Color, Key } from 'chessground/types'
import { Game, parsePgn, PgnNodeData } from 'chessops/pgn'

import { presentError } from './main'
import { Config } from './config'
import { MoveAnnotation } from './annotations'
import Sidebar from './sidebar'
import Toolbar from './toolbar'
import { playMoveSound, playCaptureSound } from './sounds'
import './styles'

export type AnnotatedMove = Move & {
	annotation?: MoveAnnotation
}

export enum GameResult {
	WhiteWins = '1-0',
	BlackWins = '0-1',
	Draw = '1/2-1/2'
}

export class ChessView extends MarkdownRenderChild {
	private ctx: MarkdownPostProcessorContext
	private app: App
	private cg: Api
	private chess: Chess
	private sidebar?: Sidebar
	private toolbar?: Toolbar
	private moves: AnnotatedMove[]
	private config: Config
	private mainEl: HTMLElement
	private gameResult: GameResult

	public currentMoveIndex: number

	constructor(
		containerEl: HTMLElement,
		ctx: MarkdownPostProcessorContext,
		config: Config,
		app: App
	) {
		super(containerEl)

		this.app = app
		this.ctx = ctx
		this.chess = new Chess()
		this.config = config
		this.mainEl = this.containerEl.createDiv()
		
		try {
			this.loadMoveList()
			this.setupChessground()
			this.applyCoordinates()
			this.applyStyles()
			this.setupSidebar()
			this.setupToolbar()
			this.setupKeyboardShortcuts()
			this.setupResizeObserver()
			this.setupContextMenu()
		} catch(e) {
			this.presentError(e.message ?? e)
		}
	}

	public loadMoveList() {
		if (this.config.pgn && this.config.fen) {
			throw new Error('Both FEN and PGN detected.')
		}

		if (this.config.pgn) {
			this.chess.loadPgn(this.config.pgn)
		}
		else if (this.config.fen) {
			this.chess.load(this.config.fen)
		}
		else {
			throw new Error('No FEN or PGN found.')
		}

		this.moves = this.chess.history({ verbose: true })
		this.currentMoveIndex = this.moves.length - 1
		this.loadAnnotations()
	}

	private loadAnnotations() {
		if(!this.config.pgn) { return }

		const game = parsePgn(this.config.pgn)[0]
		this.loadGameResult(game)

		if(!this.config.showAnnotations) { return }

		let currentMove = game.moves.children[0]
		let index = 0
		while(currentMove) {
			const nag = currentMove.data.nags
			if(nag) {
				this.moves[index].annotation = new MoveAnnotation(nag[0])
			}
			currentMove = currentMove.children[0]
			index += 1
		}
	}

	private loadGameResult(game: Game<PgnNodeData>) {
		const result = game.headers.get('Result').trim()
		switch (result) {
			case '1-0':
				this.gameResult = GameResult.WhiteWins
				break
			case '0-1':
				this.gameResult = GameResult.BlackWins
				break
			case '1/2-1/2':
				this.gameResult = GameResult.Draw
				break
			default:
				this.gameResult = null
		}
	}

	private setupChessground() {
		let lastMove: [Key, Key] = undefined
		if (this.currentMoveIndex >= 0) {
			const move = this.moves[this.currentMoveIndex]
			lastMove = [move.from, move.to]
		}
		this.cg = Chessground(this.mainEl.createDiv(), {
			fen: this.chess.fen(),
			lastMove,
			orientation: this.config.orientation as Color,
			viewOnly: !this.config.interactability,
			drawable: {
				enabled: true
			},
			events: {
				move: (orig: string, dest: string) => {
					const move = this.chess.move({ from: orig, to: dest })
					this.currentMoveIndex++
					this.moves = [...this.moves.slice(0, this.currentMoveIndex), move]
					this.playSound(move)
					this.updateBoard()
				},
			}
		})

		if(this.config.startingMoveIndex != null) {
			this.setMoveIndex(this.config.startingMoveIndex - 1)
		}

		setTimeout(() => { this.updateBoardAnnotations() }, 50)
	}

	private applyStyles() {
		this.containerEl.addClass('chess-view-container')

		if(this.config.showAnnotations) {
			this.containerEl.addClass('has-annotations')
		}
		this.mainEl.addClasses([
			this.config.pieceStyle,
			`${this.config.boardStyle}-board`, 'chess-view']
		)
		this.containerEl.addClass(`chess-align-${this.config.boardAlignment}`)
	}

	public shouldShowSidebar() {
		return this.config.showSidebar && !this.config.fen
	}

	private setupSidebar() {
		if (!this.shouldShowSidebar()) {
			this.containerEl.addClass('no-sidebar')
			return
		}
		this.sidebar = new Sidebar(this.mainEl, this, this.config)
		if (Platform.isMobile) {
			// On mobile, sidebar should be hidden by default and displayed as overlay
			this.containerEl.addClass('hide-sidebar')
		}
		this.setupToggleSidebarButton()
	}

	private setupToolbar() {
		if (this.sidebar && !Platform.isMobile) {
			this.toolbar = this.sidebar.toolbar
		} else if(this.config.showToolbar) {
			this.toolbar = new Toolbar(this.containerEl, this, this.config)
		}
		
		this.updateToolbar()
	}

	private setupToggleSidebarButton() {
		if(Platform.isMobile) { return }

		const toggleBtn = this.mainEl.createEl('a', 'chess-toggle-sidebar-btn')
		toggleBtn.ariaLabel = 'Toggle sidebar'
		setIcon(toggleBtn, 'menu')

		toggleBtn.addEventListener('click', (e: MouseEvent) => {
			e.preventDefault()
			this.toggleSidebar()
		})
	}

	private applyCoordinates() {
		const boardEl = this.mainEl.querySelector('.cg-wrap')
		if (this.config.showCoordinates) {
			boardEl.addClass('chess-show-coords')
		} else {
			boardEl.removeClass('chess-show-coords')
		}
	}

	private setupKeyboardShortcuts() {
		this.containerEl.setAttribute('tabindex', '0')
		this.containerEl.setCssProps({ outline: 'none' })

		this.containerEl.addEventListener('keydown', (e: KeyboardEvent) => {
			const activeElement = document.activeElement
			const isFocused = activeElement === this.containerEl || 
			                  this.containerEl.contains(activeElement)
			
			if (isFocused && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
				e.preventDefault()
				e.stopPropagation()
				
				if (e.key === 'ArrowLeft') {
					this.previousMove()
				} else if (e.key === 'ArrowRight') {
					this.nextMove()
				}
			}
		})

		this.containerEl.addEventListener('click', (e: MouseEvent) => {
			const target = e.target as HTMLElement
			if (target === this.containerEl || target.closest('.chess-view')) {
				this.containerEl.focus()
			}
		}, true) // Use capture phase to catch clicks early
	}

	private updateBoard() {
		this.cg.set({
			check: this.chess.inCheck(),
			turnColor: this.getTurnColor(),
			movable: {
				free: false,
				color: this.getTurnColor(),
				dests: this.getPossibleMoves(),
			},
		})

		setTimeout(() => { this.updateBoardAnnotations() }, 50)
		this.sidebar?.createMoveList()
		this.updateToolbar()
	}

	private updateToolbar() {
		if (!this.toolbar) { return }

		const isFirstMove = this.currentMoveIndex === -1
		const isLastMove = this.currentMoveIndex === this.moves.length - 1
		
		this.toolbar.previousButton.toggleClass('is-disabled', isFirstMove)
		this.toolbar.nextButton.toggleClass('is-disabled', isLastMove)
	}

	public updateBoardAnnotations() {
		if (!this.config.showAnnotations) { return }

		this.mainEl.querySelectorAll('.chess-annotation-icon').forEach(el => el.remove())

		if (this.currentMoveIndex >= 0 && this.currentMoveIndex < this.moves.length) {
			const move = this.moves[this.currentMoveIndex]
			this.setAnnotationIcon(move)
		}
	}

	private setAnnotationIcon(move: AnnotatedMove) {
		const isLastMove = this.currentMoveIndex === this.history().length - 1

		if(isLastMove) {
			const boardEl = this.containerEl.querySelector('.cg-wrap')
			const whiteKingSquareEl = boardEl.querySelector(`piece.white.king`)
			const blackKingSquareEl = boardEl.querySelector(`piece.black.king`)
			const winnerIcon = MoveAnnotation.getWinnerIcon()

			if(move.san[move.san.length-1] == '#') {
				
				if(move.color == 'w') {
					const checkmateIcon = MoveAnnotation.getBlackCheckmateIcon()
					this.addAnnotationIcon(blackKingSquareEl, checkmateIcon, 'Checkmate')
					this.addAnnotationIcon(whiteKingSquareEl, winnerIcon, 'White Wins')
				} else {
					const checkmateIcon = MoveAnnotation.getWhiteCheckmateIcon()
					this.addAnnotationIcon(whiteKingSquareEl, checkmateIcon, 'Checkmate')
					this.addAnnotationIcon(blackKingSquareEl, winnerIcon, 'Black Wins')
				}
			}
			else if(this.gameResult == GameResult.WhiteWins) {
				const blackResignsIcon = MoveAnnotation.getBlackResignsIcon()
				this.addAnnotationIcon(whiteKingSquareEl, winnerIcon, 'White Wins')
				this.addAnnotationIcon(blackKingSquareEl, blackResignsIcon, 'Black Resigns')
			}
			else if(this.gameResult == GameResult.BlackWins) {
				const whiteResignsIcon = MoveAnnotation.getWhiteResignsIcon()
				this.addAnnotationIcon(whiteKingSquareEl, whiteResignsIcon, 'White Wins')
				this.addAnnotationIcon(blackKingSquareEl, winnerIcon, 'Black Resigns')
			}
			else if(this.gameResult == GameResult.Draw) {
				const blackDrawIcon = MoveAnnotation.getBlackDrawIcon()
				const whiteDrawIcon = MoveAnnotation.getWhiteDrawIcon()
				this.addAnnotationIcon(whiteKingSquareEl, whiteDrawIcon, 'Draw')
				this.addAnnotationIcon(blackKingSquareEl, blackDrawIcon, 'Draw')
			}
		}

		if(!move.annotation) { return }
		
		const lastMoveSquareEl = this.mainEl.querySelector(`square.last-move`)
		this.addAnnotationIcon(lastMoveSquareEl, move.annotation.getIcon(), move.annotation.getTooltip())
	}

	private addAnnotationIcon(squareEl: Element, icon: string, tooltip: string) {
		const iconEl = document.createElement('img')

		// Calculate icon position relative
		const childRect = squareEl.getBoundingClientRect()
 		const parentRect = this.mainEl.getBoundingClientRect()
		const offset = 9 // Icons are 18x18 offset should be half that amount
		const rightPosition = parentRect.right - childRect.right - offset
		const topPosition = childRect.top - parentRect.top - offset

		iconEl.className = `chess-annotation-icon`
		iconEl.style.right = `${rightPosition}px`
		iconEl.style.top = `${topPosition}px`
		iconEl.setAttribute('title', tooltip)
		iconEl.setAttribute('alt', tooltip)
		iconEl.setAttribute('src', icon)
		this.mainEl.appendChild(iconEl)
	}

	public getPossibleMoves(): Map<Key, Key[]> {
		const dests = new Map()
		SQUARES.forEach((s) => {
			const ms = this.chess.moves({ square: s, verbose: true })
			if (ms.length)
				dests.set(
					s,
					ms.map((m) => m.to)
				)
		})
		return dests
	}

	public setMoveIndex(moveIndex: number): void {
		if (moveIndex < -1 || moveIndex >= this.moves.length) {
			return
		}

		const isUndoing = moveIndex < this.currentMoveIndex
		if (isUndoing) {
			while (this.currentMoveIndex > moveIndex) {
				this.currentMoveIndex--
				this.chess.undo()
			}
		} else {
			while (this.currentMoveIndex < moveIndex) {
				this.currentMoveIndex++
				const move = this.moves[this.currentMoveIndex]
				this.chess.move(move)
			}
		}

		let lastMove: [Key, Key] = undefined
		if (this.currentMoveIndex >= 0) {
			const move = this.moves[this.currentMoveIndex]
			lastMove = [move.from, move.to]
		}

		this.cg.set({
			fen: this.chess.fen(),
			lastMove,
		})
		
		this.updateBoard()
	}

	private setupResizeObserver() {
		const boardEl = this.mainEl.querySelector('.cg-wrap')
		const resizeObserver = new ResizeObserver(entries => {
			const width = entries[0].contentRect.width
			if(this.sidebar) {
				this.sidebar.sidebarEl.style.maxHeight = `${width}px`
			}
			if(this.toolbar && !this.sidebar) {
				this.toolbar.toolbarEl.style.width = `${width}px`
			}
			// Reposition annotation icons
			this.updateBoardAnnotations()
		})
		resizeObserver.observe(boardEl)
	}

	public getTurnColor(): Color {
		return this.chess.turn() === 'w' ? 'white' : 'black'
	}

	public previousMove() {
		this.setMoveIndex(this.currentMoveIndex - 1)
		
		/* Do not play sound on undo
		if(this.currentMoveIndex > -1) {
			playMoveSound()
		}
		*/
	}

	public nextMove() {
		this.setMoveIndex(this.currentMoveIndex + 1)
		this.playSound(this.moves[this.currentMoveIndex])
	}

	public resetBoard() {
		this.loadMoveList()
		this.setMoveIndex(-1)
	}

	public isMate() {
		const currentMove = this.moves[this.currentMoveIndex]
		return currentMove.san[currentMove.san.length-1] === '#'
	}

	public turn() {
		return this.chess.turn()
	}

	public history() {
		return this.moves
	}

	public flipBoard() {
		return this.cg.toggleOrientation()
	}

	public getBoardState() {
		return this.cg.state
	}

	public getFen() {
		return this.chess.fen()
	}

	public getGameResult(): GameResult {
		return this.gameResult
	}

	public getResultText(result: GameResult): string {
		switch (result) {
			case GameResult.WhiteWins: return 'White wins'
			case GameResult.BlackWins: return 'Black wins'
			case GameResult.Draw: return 'Draw'
		}
	}

	public getPgn(): string {
		let pgn = ''
		let moveIndex = 1
		
		this.moves.forEach((move, index) => {
			const annotation = (move.annotation?.getGlyph() ?? '')
			if (index % 2 === 0) {
				pgn += `${moveIndex}. ${move.san}${annotation}`
			}
			else {
				pgn += ` ${move.san}${annotation}\n`
				moveIndex += 1
			}
		})
		pgn = pgn.trim()
		
		if(this.gameResult) {
			pgn += ` ${this.gameResult}`
		}
		return pgn
	}

	private setupContextMenu() {
		this.mainEl.addEventListener('contextmenu', (e) => {
			e.preventDefault()
			const menu = new Menu()
			menu.addItem((item) =>
				item.setTitle('Copy PGN').setIcon('copy').onClick(() => {
					void navigator.clipboard.writeText(this.getPgn())
				})
			)
			menu.addItem((item) =>
				item.setTitle('Copy FEN').setIcon('copy').onClick(() => {
					void navigator.clipboard.writeText(this.getFen())
				})
			)
			menu.addItem((item) =>
				item.setTitle('Previous move').setIcon('left-arrow').onClick(() => {
					this.previousMove()
				})
			)
			menu.addItem((item) =>
				item.setTitle('Next move').setIcon('right-arrow').onClick(() => {
					this.nextMove()
				})
			)
			menu.addItem((item) =>
				item.setTitle('Reset board').setIcon('restore-file-glyph').onClick(() => {
					this.resetBoard()
				})
			)
			menu.addItem((item) =>
				item.setTitle('Flip board').setIcon('switch').onClick(() => {
					this.flipBoard()
				})
			)
			if(this.shouldShowSidebar()) {
				menu.addItem((item) =>
					item.setTitle('Toggle sidebar').setIcon('menu').onClick(() => {
						this.toggleSidebar()
					})
				)
			}
			menu.showAtMouseEvent(e)
		})
	}

	public toggleSidebar() {
		this.containerEl.toggleClass('hide-sidebar', !this.containerEl.hasClass('hide-sidebar'))
		setTimeout(() => this.updateBoardAnnotations(), 300)
	}

	private playSound(move: Move): void {
		if (!this.config.playSounds) { return }

		// Check if this move captured a piece
		if (move.captured) {
			playCaptureSound()
		} else {
			playMoveSound()
		}
	}

	private presentError(errorMessage: string) {
		presentError(this.mainEl, errorMessage)
	}
}
