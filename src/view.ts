import {
	App,
	MarkdownPostProcessorContext,
	MarkdownRenderChild,
	Notice,
} from "obsidian"
import { Chess, Move, SQUARES } from "chess.js"
import { Chessground } from "chessground"
import { Api } from "chessground/api"
import { Color, Key } from "chessground/types"

import { presentError } from "./main"
import { Config } from "./config"
import { 
	sanRegex,
	annotationRegex,
	resultAnnotationRegex,
	MoveAnnotation,
	getAnnotationIcon,
	getAnnotationClass,
	getAnnotationTooltip,
} from "./annotations"
import Sidebar from "./sidebar"
import "./styles"


export type AnnotatedMove = Move & {
	annotation?: MoveAnnotation
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
	private gameResult: string | undefined

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
		
		if(!this.loadMoveList()) { return }

		this.setupChessground()
		this.applyCoordinates()
		this.applyStyles()
		this.setupSidebar()
		this.setupKeyboardShortcuts()
	}

	public loadMoveList() {
		if (this.config.pgn && this.config.fen) {
			this.presentError("Both FEN and PGN detected.")
			return false
		}
		else if (this.config.pgn) {
			try {
				this.chess.loadPgn(this.config.pgn)
			} catch (error) {
				this.presentError(error.message)
				return false
			}
		}
		else if (this.config.fen) {
			try {
				this.chess.load(this.config.fen)
			} catch (error) {
				this.presentError(error.message)
				return false
			}
		}
		else {
			this.presentError("No FEN or PGN found.")
			return false
		}

		this.moves = this.chess.history({ verbose: true })
		this.currentMoveIndex = this.moves.length - 1
		this.loadAnnotations()
		return true
	}

	private loadAnnotations(): AnnotatedMove[] {
		if(!this.config.showAnnotations || !this.config.pgn) { return }

		const pgn = this.config.pgn
		const matches = [...pgn.matchAll(sanRegex)]
		
		matches.forEach((match, index) => {
			let annotationIndex = match.index + match[0].length
			const annotationMatch = pgn.slice(annotationIndex, annotationIndex+2).match(annotationRegex)

			if(annotationMatch) {
				const annotation = annotationMatch[0] as MoveAnnotation
				this.moves[index].annotation = annotation
				if(annotation === "#") {
					this.gameResult = this.moves[index].color == "w" ? "White wins" : "Black wins"
				}
			} // Check for result annotation in the last move (if not checkmate)
			else if(index == matches.length-1) {
				this.loadResultAnnotation(pgn.slice(annotationIndex, pgn.length).trim(), index)
			}
		})
	}

	private loadResultAnnotation(result: string, index: number) {
		const resultMatch = result.match(resultAnnotationRegex)
		if(resultMatch) {
			const annotation = resultMatch[0] as MoveAnnotation
			this.moves[index].annotation = annotation
			this.setGameResult(annotation)
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
				move: (orig: any, dest: any) => {
					const move = this.chess.move({ from: orig, to: dest })
					this.currentMoveIndex++
					this.moves = [...this.moves.slice(0, this.currentMoveIndex), { ...move, annotation: null as MoveAnnotation } as AnnotatedMove]
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
			`${this.config.boardStyle}-board`, "chess-view"]
		)
		if(this.config.centerBoard) {
			this.containerEl.addClass('center-board')
		}
	}

	private setupSidebar() {
		if (this.config.showSidebar) {
			this.sidebar = new Sidebar(this.mainEl, this)
		} else {
			this.mainEl.addClass("no-menu")
		}
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
		this.mainEl.setAttribute("tabindex", "0")
		this.mainEl.style.outline = "none"

		this.mainEl.addEventListener("keydown", (e: KeyboardEvent) => {
			const activeElement = document.activeElement
			const isFocused = activeElement === this.mainEl || 
			                  this.mainEl.contains(activeElement)
			
			if (isFocused && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
				e.preventDefault()
				e.stopPropagation()
				
				if (e.key === "ArrowLeft") {
					this.previousMove()
				} else if (e.key === "ArrowRight") {
					this.nextMove()
				}
			}
		})

		this.mainEl.addEventListener("click", (e: MouseEvent) => {
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
		const annotation = move.annotation
		if(!annotation) { return }

		const icon = getAnnotationIcon(annotation)
		const tooltip = getAnnotationTooltip(annotation)
		const lastMoveSquareEl = this.mainEl.querySelector(`square.last-move`)
		
		const boardEl = this.containerEl.querySelector('.cg-wrap')
		const whiteKingSquareEl = boardEl.querySelector(`piece.white.king`)
		const blackKingSquareEl = boardEl.querySelector(`piece.black.king`)
		
		if(annotation == "#" && typeof(tooltip) == "string") {
			const checkmateIcon = icon[0]
			const winnerIcon = icon[1]

			if(move.color == "w") {
				this.addAnnotationIcon(blackKingSquareEl, checkmateIcon, tooltip)
				this.addAnnotationIcon(lastMoveSquareEl, winnerIcon, "White Wins")
			} else {
				this.addAnnotationIcon(whiteKingSquareEl, checkmateIcon, tooltip)
				this.addAnnotationIcon(lastMoveSquareEl, winnerIcon, "Black Wins")
			}
		}
		else if(annotation == "1-0") {
			const blackResignsIcon = icon[0]
			const winnerIcon = icon[1]
			const whiteKingSquareEl = boardEl.querySelector(`piece.white.king`)
			const blackKingSquareEl = boardEl.querySelector(`piece.black.king`)
			this.addAnnotationIcon(whiteKingSquareEl, winnerIcon, tooltip[0])
			this.addAnnotationIcon(blackKingSquareEl, blackResignsIcon, tooltip[1])
		}
		else if(annotation == "0-1") {
			const whiteResignsIcon = icon[0]
			const winnerIcon = icon[1]
			const whiteKingSquareEl = boardEl.querySelector(`piece.white.king`)
			const blackKingSquareEl = boardEl.querySelector(`piece.black.king`)
			this.addAnnotationIcon(whiteKingSquareEl, whiteResignsIcon, tooltip[0])
			this.addAnnotationIcon(blackKingSquareEl, winnerIcon, tooltip[1])
		}
		else if(annotation == "1/2-1/2" && typeof(tooltip) == "string") {
			const whiteDrawIcon = icon[0]
			const blackDrawIcon = icon[1]
			const whiteKingSquareEl = boardEl.querySelector(`piece.white.king`)
			const blackKingSquareEl = boardEl.querySelector(`piece.black.king`)
			this.addAnnotationIcon(whiteKingSquareEl, whiteDrawIcon, tooltip)
			this.addAnnotationIcon(blackKingSquareEl, blackDrawIcon, tooltip)
		}
		else if(typeof(tooltip) == "string" && typeof(icon) == "string") {
			this.addAnnotationIcon(lastMoveSquareEl, icon, tooltip)
		}
	}

	private addAnnotationIcon(squareEl: Element, icon: string, tooltip: string) {
		const iconEl = document.createElement('img')

		// Calculate icon position relative
		const childRect = squareEl.getBoundingClientRect()
 		const parentRect = this.mainEl.getBoundingClientRect()
		const rightPadding = 9
		const rightPosition = parentRect.right - childRect.right - rightPadding
		const topPosition = childRect.top - parentRect.top

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
		return this.chess.turn() === "w" ? "white" : "black"
	}

	public previousMove() {
		this.setMoveIndex(this.currentMoveIndex - 1)
	}

	public nextMove() {
		this.setMoveIndex(this.currentMoveIndex + 1)
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

	private setGameResult(annotation: MoveAnnotation) {
		let tooltip = getAnnotationTooltip(annotation)
		this.gameResult = typeof(tooltip) == "string" ? tooltip : tooltip[0]
	}

	public getGameResult(): string | undefined {
		return this.gameResult
	}

	public shouldShowAnnotations(): boolean {
		return this.config.showAnnotations ?? true
	}

	private presentError(errorMessage: string) {
		presentError(this.mainEl, errorMessage)
	}
}
