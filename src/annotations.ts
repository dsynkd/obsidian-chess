// Analysis icons
import brilliantIcon from "../assets/analysis-icon/brilliant.svg"
import greatIcon from "../assets/analysis-icon/great.svg"
import mistakeIcon from "../assets/analysis-icon/mistake.svg"
import inaccuracyIcon from "../assets/analysis-icon/inaccuracy.svg"
import blunderIcon from "../assets/analysis-icon/blunder.svg"
import checkmateIcon from "../assets/analysis-icon/checkmate.svg"
import whiteResignsIcon from "../assets/analysis-icon/resign_white.svg"
import blackResignsIcon from "../assets/analysis-icon/resign_black.svg"
import whiteDrawIcon from "../assets/analysis-icon/draw_white.svg"
import blackDrawIcon from "../assets/analysis-icon/draw_black.svg"
import winnerIcon from "../assets/analysis-icon/winner.svg"

export type MoveAnnotation = "!!" | "!" | "?!" | "?" | "??" | "#" | "1-0" | "0-1" | "1/2-1/2"

export const sanRegex = /([BRQNK][a-h][1-8]|[BRQNK][a-h]x[a-h][1-8]|[BRQNK][a-h][1-8]x[a-h][1-8]|[BRQNK][a-h][1-8][a-h][1-8]|[BRQNK][a-h][a-h][1-8]|[BRQNK]x[a-h][1-8]|[a-h]x[a-h][1-8]=(B+R+Q+N)|[a-h]x[a-h][1-8]|[a-h][1-8]x[a-h][1-8]=(B+R+Q+N)|[a-h][1-8]x[a-h][1-8]|[a-h][1-8][a-h][1-8]=(B+R+Q+N)|[a-h][1-8][a-h][1-8]|[a-h][1-8]=(B+R+Q+N)|[a-h][1-8]|[BRQNK][1-8]x[a-h][1-8]|[BRQNK][1-8][a-h][1-8]|O-O|O-O-O)\+?/g

export const annotationRegex = /(\?\?|\?\!|!!|!|\?|#)/
export const resultAnnotationRegex = /(1-0|0-1|1\/2-1\/2)/

export function getAnnotationClass(annotation: MoveAnnotation): string {
    switch (annotation) {
        case "!!": return "brilliant"
        case "!": return "great"
        case "?!": return "inaccuracy"
        case "?": return "mistake"
        case "??": return "blunder"
        case "#": return "checkmate"
    }
}

export function getAnnotationIcon(annotation: MoveAnnotation): string | [string, string] {
    switch (annotation) {
        case "!!": return brilliantIcon
        case "!": return greatIcon
        case "?!": return inaccuracyIcon
        case "?": return mistakeIcon
        case "??": return blunderIcon
        case "#": return [checkmateIcon, winnerIcon]
        case "1-0": return [blackResignsIcon, winnerIcon]
        case "0-1": return [whiteResignsIcon, winnerIcon]
        case "1/2-1/2": return [whiteDrawIcon, blackDrawIcon]
    }
}

export function getAnnotationTooltip(annotation: MoveAnnotation): string | [string, string] {
    if(annotation == "1-0") {
        return ["Black resigns", "White wins"]
    }
    if(annotation == "0-1") {
        return ["White resigns", "Black wins"]
    }
    if(annotation == "1/2-1/2") {
        return "Draw"
    }
    return annotation[0].toUpperCase() + annotation.slice(1)
}
