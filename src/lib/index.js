export const isMobile = navigator.maxTouchPoints;

/**
 * @param min {number}
 * @param max {number}
 * @param callback {() => void}
 * @returns number
 */
export function setRangedTimeout(min, max, callback) {
	return setTimeout(callback, (max - min) * Math.random() + min);
}

export async function fingerprint() {
	let fingerprint = localStorage.getItem("fingerprint");
	if (fingerprint == null) {
		fingerprint = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(Math.random().toString())).then((hash) =>
			Array.from(new Uint8Array(hash))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")
		);
		localStorage.setItem("fingerprint", fingerprint);
	}
	return fingerprint;
}
