/**
 * Formatiert Minutenangaben in ein benutzerfreundliches Format.
 * - Unter 60 Minuten: "45 min"
 * - Ab 60 Minuten: Stunden mit Unicode-Bruchzeichen (¼, ½, ¾)
 */
export function formatMinutes(minutes: number): string {
	if (minutes < 60) {
		return `${minutes} min`;
	} else {
		const hours = minutes / 60;
		const roundedHours = Math.round(hours * 4) / 4; // Auf Viertelstunden runden
		
		const wholeHours = Math.floor(roundedHours);
		const fraction = roundedHours - wholeHours;
		
		let result = '';
		if (wholeHours > 0) {
			result += wholeHours;
		}
		
		if (fraction === 0.25) {
			result += (wholeHours > 0 ? '¼' : '¼');
		} else if (fraction === 0.5) {
			result += (wholeHours > 0 ? '½' : '½');
		} else if (fraction === 0.75) {
			result += (wholeHours > 0 ? '¾' : '¾');
		}
		
		return `${result} hrs`;
	}
}

/**
 * Berechnet die Differenz zwischen zwei Zeiten in Minuten und formatiert sie.
 */
export function formatTimeDifference(from: Date, to: Date): string {
	const diff = to.getTime() - from.getTime();
	const minutes = Math.floor(diff / 60000);
	return formatMinutes(minutes);
}

/**
 * Berechnet verbleibende Zeit bis zu einem Datum und formatiert sie.
 */
export function formatRemainingTime(endTime: Date, currentTime: Date = new Date()): string {
	const diff = endTime.getTime() - currentTime.getTime();
	const minutes = Math.floor(diff / 60000);
	return formatMinutes(Math.max(0, minutes));
}

/**
 * Berechnet Zeit bis zu einem Datum und formatiert sie.
 */
export function formatTimeUntil(startTime: Date, currentTime: Date = new Date()): string {
	const diff = startTime.getTime() - currentTime.getTime();
	const minutes = Math.floor(diff / 60000);
	return formatMinutes(Math.max(0, minutes));
}