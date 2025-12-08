// Analysis icons
import brilliantIcon from '../assets/analysis-icon/brilliant.svg'
import greatIcon from '../assets/analysis-icon/great.svg'
import mistakeIcon from '../assets/analysis-icon/mistake.svg'
import inaccuracyIcon from '../assets/analysis-icon/inaccuracy.svg'
import blunderIcon from '../assets/analysis-icon/blunder.svg'
import interestingIcon from '../assets/analysis-icon/interesting.svg'
import blackCheckmateIcon from '../assets/analysis-icon/checkmate_black.svg'
import whiteCheckmateIcon from '../assets/analysis-icon/checkmate_white.svg'
import whiteResignsIcon from '../assets/analysis-icon/resign_white.svg'
import blackResignsIcon from '../assets/analysis-icon/resign_black.svg'
import whiteDrawIcon from '../assets/analysis-icon/draw_white.svg'
import blackDrawIcon from '../assets/analysis-icon/draw_black.svg'
import winnerIcon from '../assets/analysis-icon/winner.svg'

enum MoveClass {
    great = 1,
    mistake = 2,
    brilliant = 3,
    blunder = 4,
    interesting = 5,
    inaccuracy = 6
}

export class MoveAnnotation {

    private glyph: MoveClass
    
    constructor(nag: number) {
        this.glyph = nag as MoveClass
    }

    toString(): string {
        switch (this.glyph) {
            case MoveClass.great: return 'great'
            case MoveClass.mistake: return 'mistake'
            case MoveClass.brilliant: return 'brilliant'
            case MoveClass.blunder: return 'blunder'
            case MoveClass.interesting: return 'good'
            case MoveClass.inaccuracy: return 'inaccuracy'
        }
    }

    public getIcon(): string {
        switch (this.glyph) {
            case MoveClass.great: return greatIcon
            case MoveClass.mistake: return mistakeIcon
            case MoveClass.brilliant: return brilliantIcon
            case MoveClass.blunder: return blunderIcon
            case MoveClass.interesting: return interestingIcon
            case MoveClass.inaccuracy: return inaccuracyIcon
        }
    }

    public getGlyph(): string {
        switch (this.glyph) {
            case MoveClass.great: return '!'
            case MoveClass.mistake: return '?'
            case MoveClass.brilliant: return '!!'
            case MoveClass.blunder: return '??'
            case MoveClass.interesting: return '!?'
            case MoveClass.inaccuracy: return '?!'
        }
    }

    public getTooltip(): string {
        const str = this.toString()
        return str[0].toUpperCase() + str.slice(1)
    }


    static getWinnerIcon(): string {
        return winnerIcon
    }

    static getBlackCheckmateIcon(): string {
        return blackCheckmateIcon
    }

    static getWhiteCheckmateIcon(): string {
        return whiteCheckmateIcon
    }

    static getWhiteResignsIcon(): string {
        return whiteResignsIcon
    }

    static getBlackResignsIcon(): string {
        return blackResignsIcon
    }

    static getWhiteDrawIcon(): string {
        return whiteDrawIcon
    }

    static getBlackDrawIcon(): string {
        return blackDrawIcon
    }
}
