import moveSound from '../assets/sound/move.mp3'
import captureSound from '../assets/sound/capture.mp3'

let currentAudio: HTMLAudioElement | null = null

function stopCurrentSound(): void {
	if (currentAudio) {
		currentAudio.pause()
		currentAudio.currentTime = 0
		currentAudio = null
	}
}

export function playMoveSound(): void {
	stopCurrentSound()
	
	const audio = new Audio(moveSound)
	currentAudio = audio
	
	audio.addEventListener('ended', () => {
		if (currentAudio === audio) {
			currentAudio = null
		}
	})
	
	audio.play().catch((error) => {
		// console.warn('Failed to play move sound:', error)
		currentAudio = null
	})
}

export function playCaptureSound(): void {
	stopCurrentSound()
	
	const audio = new Audio(captureSound)
	currentAudio = audio
	
	audio.addEventListener('ended', () => {
		if (currentAudio === audio) {
			currentAudio = null
		}
	})
	
	audio.play().catch((error) => {
		// console.warn('Failed to play capture sound:', error)
		currentAudio = null
	})
}

