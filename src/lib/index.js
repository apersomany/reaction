export const isMobile = navigator.maxTouchPoints;

export const MIN_REACTION = 100;
export const MAX_REACTION = 500;
export const REPETITIONS = 5;

export function setRangedTimeout(min, max, callback) {
	return setTimeout(callback, (max - min) * Math.random() + min);
}

export function getUserId() {
	return localStorage.getItem("userId");
}
