<script>
	import { isMobile, setRangedTimeout, fingerprint } from "$lib";
	import { onMount } from "svelte";
	import c from "chroma-js";

	let lightness = 0.65;
	let chroma = 0.20;
	let hue = 30;

	/**
	 * @type { HTMLDivElement }
	 */
	let box;

	/**
	 * @type { number | null }
	 */
	let timeoutHandler = null;

	let then = 0;

	let userFingerprint = null;

	onMount(async () => {
		userFingerprint = await fingerprint();
	});

	async function sendTelemetry(reactionTime) {
		if (userFingerprint == null) return;
		try {
			await fetch("/api/visual", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					user: userFingerprint,
					lightness,
					chroma,
					hue,
					value: reactionTime,
				}),
			});
		} catch (error) {
			console.error("Failed to send telemetry:", error);
		}
	}

	const availableHues = [30, 140, 330];

	/**
	 * @param event { Event }
	 */
	async function pointerDownHandler(event) {
		event.preventDefault();
		hue = availableHues[Math.floor(Math.random() * availableHues.length)]
		box.textContent = "화면의 색이 변하면 손을 때세요";
		timeoutHandler = setRangedTimeout(1000, 2000, () => {
			then = performance.now();
			// Convert OKLCH to RGB for better browser compatibility
			const bgColor = c(lightness, chroma, hue, 'oklch');
			const textColor = lightness > 0.3 && chroma < 0.3 
				? c(0, 0, 0, 'oklch') 
				: c(1, 0, 0, 'oklch');
			box.style.background = String(bgColor);
			box.style.color = String(textColor);
			box.textContent = "손을 때세요";
			timeoutHandler = null;
		});
	}

	async function pointerUpHandler() {
		let diff = performance.now() - then;
		console.log(diff);
		if (timeoutHandler) {
			clearTimeout(timeoutHandler);
			timeoutHandler = null;
		}
		if (then) {
			// Convert OKLCH to RGB for better browser compatibility
			box.style.background = String(c(1, 0, 0, 'oklch'));
			box.style.color = String(c(0, 0, 0, 'oklch'));
			box.textContent = `${Math.round(diff)}ms`;
			await sendTelemetry(diff);
		} else {
			box.textContent = "화면을 누른 상태로 기다리세요";
		}
		then = 0;
	}
</script>

<div style="width: 100svw; height: 100svh; display: flex;">
	<div
		style="flex: 1; margin: 1rem; border-radius: 1rem; display: flex; justify-content: center; align-items: center;"
		on:pointerdown={isMobile > 0 ? null : pointerDownHandler}
		on:pointerup={isMobile > 0 ? null : pointerUpHandler}
		on:touchstart={isMobile > 0 ? pointerDownHandler : null}
		on:touchend={isMobile > 0 ? pointerUpHandler : null}
		bind:this={box}
	>
		화면을 누른 상태로 기다리세요
	</div>
</div>
