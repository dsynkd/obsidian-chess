import { parseYaml } from "obsidian"
import { Settings } from "./settings"

export interface Config extends Settings {
	id?: string
	fen: string
	pgn?: string
	startingMoveIndex?: number
	moves?: string[]
}

const ORIENTATIONS = ["white", "black"]
export const PIECE_STYLES = [
	"alpha",
	"california",
	"cardinal",
	"cburnett",
	"chess7",
	"chessnut",
	"companion",
	"dubrovny",
	"fantasy",
	"fresca",
	"gioco",
	"governor",
	"horsey",
	"icpieces",
	"kosal",
	"leipzig",
	"letter",
	"libra",
	"maestro",
	"merida",
	"pirouetti",
	"pixel",
	"reillycraig",
	"riohacha",
	"shapes",
	"spatial",
	"staunty",
	"tatiana",
]

export const BOARD_STYLES = [
	"blue",
	"brown",
	"green",
	"ic",
	"purple"
]

export function parseUserConfig(
	settings: Settings,
	content: string
): Config | null {
	try {
		return {
			...settings,
			...parseYaml(content),
		}
	} catch (e) { // Will get handled at drawChessboard
		return null
	}
}
