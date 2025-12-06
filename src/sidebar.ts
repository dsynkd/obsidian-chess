import { setIcon, Setting } from "obsidian"
import { ChessView, AnnotatedMove } from "./view"
import { 
	getAnnotationClass,
	getAnnotationTooltip,
} from "./annotations"

export default class Sidebar {
	private view: ChessView
	private menuContainer: HTMLElement
	private movesListEl: HTMLElement
	private toolbar: HTMLElement
	private parentContainer: HTMLElement

	constructor(parentEl: HTMLElement, view: ChessView) {
		this.view = view
		this.parentContainer = parentEl
		this.menuContainer = this.parentContainer.createDiv("chess-sidebar")
		this.movesListEl = this.menuContainer.createDiv("chess-sidebar-section")

		this.redrawMoveList()
		this.createToolbar()
		this.setupResizeObserver()
	}

	private createToolbar() {
		this.toolbar = this.menuContainer.createDiv("chess-toolbar")
		this.createPreviousMoveButton()
		this.createNextMoveButton()
		this.createFlipBoardButton()
		this.createResetButton()
		this.createHideMenuButton()
	}

	private createPreviousMoveButton() {
		this.toolbar.createEl("a", "view-action", (btn: HTMLAnchorElement) => {

			btn.ariaLabel = "Previous Move"
			setIcon(btn, "left-arrow")

			btn.addEventListener("click", (e: MouseEvent) => {
				e.preventDefault()
				this.view.previousMove()
			})
		})
	}

	private createNextMoveButton() {
		this.toolbar.createEl("a", "view-action", (btn: HTMLAnchorElement) => {

			btn.ariaLabel = "Next Move"
			setIcon(btn, "right-arrow")

			btn.addEventListener("click", (e: MouseEvent) => {
				e.preventDefault()
				this.view.nextMove()
			})
		})
	}

	private createResetButton() {
		this.toolbar.createEl("a", "view-action", (btn: HTMLAnchorElement) => {
			
			btn.ariaLabel = "Reset"
			setIcon(btn, "restore-file-glyph")
			
			btn.addEventListener("click", (e: MouseEvent) => {
				e.preventDefault()
				this.view.loadMoveList()
				this.view.setMoveIndex(-1)
			})
		})
	}

	private createFlipBoardButton() {
		this.toolbar.createEl("a", "view-action", (btn: HTMLAnchorElement) => {
			
			btn.ariaLabel = "Flip board"
			setIcon(btn, "switch")

			btn.addEventListener("click", (e: MouseEvent) => {
				e.preventDefault()
				this.view.flipBoard()
			})
		})
	}

	private createHideMenuButton() {
		this.toolbar.createEl("a", "view-action", (btn: HTMLAnchorElement) => {

			btn.ariaLabel = "Hide Menu"
			setIcon(btn, "menu")

			btn.addEventListener("click", (e: MouseEvent) => {
				e.preventDefault()
				this.parentContainer.addClass('no-menu')
			})
		})
	}

	public redrawMoveList() {
		this.movesListEl.empty()
		this.movesListEl.createDiv({
			text: this.view.turn() === "b" ? "Black's turn" : "White's turn",
			cls: "chess-turn-text",
		})
		this.movesListEl.createDiv("chess-move-list", (moveListEl) => {
			this.view.history().forEach((move, idx) => {
				const moveEl = moveListEl.createDiv({
					cls: `chess-move ${
						this.view.currentMoveIndex === idx ? "chess-move-active" : ""
					}`,
				})
				// Create move text element
				const moveText = moveEl.createSpan({
					text: move.san,
				})

				moveEl.addEventListener("click", (ev) => {
					ev.preventDefault()
					this.view.setMoveIndex(idx)
				})

				if(this.view.shouldShowAnnotations() == false) {
					return
				}
				
				// Add move annotation
				if (move.annotation && move.san.charAt(move.san.length-1) != '#') { // Mate symbol is included in SAN
					// Create a safe class name from annotation
					const annotationClass = getAnnotationClass(move.annotation)
					const annotationEl = moveEl.createSpan({
						cls: `chess-move-annotation chess-move-annotation-${annotationClass}`,
						text: move.annotation,
					})
					annotationEl.setAttribute("title", getAnnotationTooltip(move.annotation))
				}
				
			})
		})
	}

	private setupResizeObserver() {
		const boardEl = this.parentContainer.querySelector('.cg-wrap')
		const resizeObserver = new ResizeObserver(entries => {
			const width = entries[0].contentRect.width
			this.menuContainer.style.maxHeight = `${width}px`
			// Reposition annotation icons
			this.view.updateBoardAnnotations()
		});
		resizeObserver.observe(boardEl)
	}
}
