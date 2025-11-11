export const isMobile = navigator.maxTouchPoints;

export function setRangedTimeout(min, max, callback) {
	return setTimeout(callback, (max - min) * Math.random() + min);
}

export function getUserId() {
	return localStorage.getItem("userId");
}
