<script>
	import { isMobile, setRangedTimeout, fingerprint } from "$lib";
	import { onMount } from "svelte";

	/**
	 * @type { AudioContext }
	 */
	let context;
	/**
	 * @type { OscillatorNode }
	 */
	let oscillator;

	let frequency = 441;
	let userFingerprint = null;

	onMount(async () => {
		context = new AudioContext();
		oscillator = context.createOscillator();
		oscillator.frequency.value = frequency;
		oscillator.start();
		userFingerprint = await fingerprint();
	});

	async function sendTelemetry(reactionTime) {
		if (userFingerprint == null) return;
		try {
			await fetch("/api/auditory", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					user: userFingerprint,
					frequency,
					value: reactionTime,
				}),
			});
		} catch (error) {
			console.error("Failed to send telemetry:", error);
		}
	}

	/**
	 * @type { HTMLDivElement }
	 */
	let box;

	/**
	 * @type { number | null }
	 */
	let timeoutHandler = null;

	let then = 0;

	/**
	 * @param event { Event }
	 */
	async function pointerDownHandler(event) {
		event.preventDefault();
		box.textContent = "소리가 들리면 손을 때세요";
		timeoutHandler = setRangedTimeout(1000, 2000, () => {
			then = performance.now();
			oscillator.connect(context.destination);
			timeoutHandler = null;
		});
	}

	async function pointerUpHandler() {
		let diff = performance.now() - then - context.outputLatency * 1000;
		console.log(diff);
		if (timeoutHandler) {
			clearTimeout(timeoutHandler);
			timeoutHandler = null;
		}
		if (then) {
			oscillator.disconnect();
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
		style="flex: 1; margin: 1rem; border-radius: 1rem; background: oklch(1.0 0 0); display: flex; justify-content: center; align-items: center;"
		on:pointerdown={isMobile > 0 ? null : pointerDownHandler}
		on:pointerup={isMobile > 0 ? null : pointerUpHandler}
		on:touchstart={isMobile > 0 ? pointerDownHandler : null}
		on:touchend={isMobile > 0 ? pointerUpHandler : null}
		bind:this={box}
	>
		화면을 누른 상태로 기다리세요
	</div>
</div>
