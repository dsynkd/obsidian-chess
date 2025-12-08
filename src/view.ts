import {
	App,
	MarkdownPostProcessorContext,
	MarkdownRenderChild
} from 'obsidian'
import { setIcon } from 'obsidian'
import { Chess, Move, SQUARES } from 'chess.js'
import { Chessground } from 'chessground'
import { Api } from 'chessground/api'
import { Color, Key } from 'chessground/types'
import { Game, parsePgn, PgnNodeData } from 'chessops/pgn'

import { presentError } from './main'
import { Config } from './config'
import { MoveAnnotation } from './annotations'
import Sidebar from './sidebar'
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
	private sidebar: Sidebar
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
			this.setupToggleSidebarButton()
			this.setupKeyboardShortcuts()
		} catch(e) {
			this.presentError(e.message ?? e)
		}
	}

	public loadMoveList() {
		if (this.config.pgn && this.config.fen) {
			throw 'Both FEN and PGN detected.'
		}

		if (this.config.pgn) {
			this.chess.loadPgn(this.config.pgn)
		}
		else if (this.config.fen) {
			this.chess.load(this.config.fen)
		}
		else {
			throw 'No FEN or PGN found.'
		}

		this.moves = this.chess.history({ verbose: true })
		this.currentMoveIndex = this.moves.length - 1
		this.loadAnnotations()
	}

	private loadAnnotations() {
		if(!this.config.showAnnotations || !this.config.pgn) { return }

		const game = parsePgn(this.config.pgn)[0]
		this.loadGameResult(game)

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
			viewOnly: this.config.viewOnly,
			drawable: {
				enabled: true
			},
			events: {
				move: (orig: string, dest: string) => {
					const move = this.chess.move({ from: orig, to: dest })
					this.currentMoveIndex++
					this.moves = [...this.moves.slice(0, this.currentMoveIndex), move]
					this.playSound(move)
					this.syncBoard()
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
		if(this.config.centerBoard) {
			this.containerEl.addClass('center-board')
		}
	}

	private setupSidebar() {
		if (this.config.showSidebar) {
			this.sidebar = new Sidebar(this.mainEl, this, this.config)
		} else {
			this.mainEl.addClass('no-menu')
		}
	}

	private setupToggleSidebarButton() {
		if (!this.config.showSidebar) { return }

		const toggleBtn = this.mainEl.createEl('a', 'chess-toggle-sidebar-btn')
		toggleBtn.ariaLabel = 'Toggle Sidebar'
		setIcon(toggleBtn, 'menu')

		toggleBtn.addEventListener('click', (e: MouseEvent) => {
			e.preventDefault()
			e.stopPropagation()
			if (this.mainEl.hasClass('no-menu')) {
				this.mainEl.removeClass('no-menu')
			} else {
				this.mainEl.addClass('no-menu')
			}
		})
	}

	private applyCoordinates() {
		const boardEl = this.mainEl.querySelector('.cg-wrap')
		if (this.config.enableCoordinates === true) {
			boardEl.addClass('chess-show-coords')
		} else {
			boardEl.removeClass('chess-show-coords')
		}
	}

	private setupKeyboardShortcuts() {
		this.mainEl.setAttribute('tabindex', '0')
		this.mainEl.style.outline = 'none'

		this.mainEl.addEventListener('keydown', (e: KeyboardEvent) => {
			const activeElement = document.activeElement
			const isFocused = activeElement === this.mainEl || 
			                  this.mainEl.contains(activeElement)
			
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

		this.mainEl.addEventListener('click', (e: MouseEvent) => {
			const target = e.target as HTMLElement
			if (target === this.mainEl || target.closest('.chess-view')) {
				this.mainEl.focus()
			}
		}, true) // Use capture phase to catch clicks early
	}

	private syncBoard() {
		this.cg.set({
			check: this.chess.inCheck(),
			turnColor: this.getTurnColor(),
			movable: {
				free: false,
				color: this.getTurnColor(),
				dests: this.getPossibleMoves(),
			},
		})

		// Give time for board to render
		setTimeout(() => { this.updateBoardAnnotations() }, 50)

		if (this.sidebar) {
			this.sidebar.redrawMoveList()
		}
	}

	public updateBoardAnnotations() {
		if (!this.config.showAnnotations) {
			return
		}

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
		
		this.syncBoard()
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

	private playSound(move: Move): void {
		if (!this.config.enableSounds) { return }

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
