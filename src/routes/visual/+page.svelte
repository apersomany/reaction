<script>
	import { isMobile, setRangedTimeout, getUserId, MIN_REACTION, MAX_REACTION, REPETITIONS } from "$lib";
	import { onMount } from "svelte";
	import c from "chroma-js";

	const COLORS = [
		{ lightness: 0.65, chroma: 0.2, hue: 30 },
		{ lightness: 0.65, chroma: 0.2, hue: 140 },
		{ lightness: 0.65, chroma: 0.2, hue: 330 },
		{ lightness: 0.625, chroma: 0.25, hue: 30 },
		{ lightness: 0.625, chroma: 0.2, hue: 30 },
		{ lightness: 0.625, chroma: 0.15, hue: 30 },
	];

	const TOTAL_SAMPLES = COLORS.length * REPETITIONS;

	let box;
	let timeoutHandler = null;
	let then = 0;
	let userId = null;
	let data = [];
	let color = COLORS[0];
	let index = 0;
	let colorSequence = [];

	onMount(() => {
		userId = getUserId();
		if (!userId) {
			window.location.replace("/");
			return;
		}
		
		// Create randomized sequence: each color appears REPETITIONS times
		colorSequence = [];
		for (let i = 0; i < REPETITIONS; i++) {
			colorSequence.push(...COLORS);
		}
		// Shuffle the sequence
		for (let i = colorSequence.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[colorSequence[i], colorSequence[j]] = [colorSequence[j], colorSequence[i]];
		}
		
		color = colorSequence[0];
	});

	async function sendBatchedTelemetry() {
		if (!userId || data.length === 0) return;
		
		try {
			await fetch("/api/visual", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ user: userId, samples: data }),
			});
		} catch (error) {
			console.error("Failed to send telemetry:", error);
		}
	}

	async function pointerDownHandler(event) {
		event.preventDefault();
		color = colorSequence[index];
		box.textContent = "화면의 색이 변하면 손을 때세요";
		
		timeoutHandler = setRangedTimeout(1000, 3000, () => {
			then = performance.now();
			box.style.background = c(color.lightness, color.chroma, color.hue, "oklch").toString();
			box.style.color = color.lightness > 0.3 && color.chroma < 0.3
				? c(0, 0, 0, "oklch").toString()
				: c(1, 0, 0, "oklch").toString();
			box.textContent = "손을 때세요";
			timeoutHandler = null;
		});
	}

	async function pointerUpHandler() {
		const diff = performance.now() - then;
		
		if (timeoutHandler) {
			clearTimeout(timeoutHandler);
			timeoutHandler = null;
		}

		if (then) {
			box.style.background = c(1, 0, 0, "oklch").toString();
			box.style.color = c(0, 0, 0, "oklch").toString();
			box.textContent = `${Math.round(diff)}ms`;
			
			if (diff >= MIN_REACTION && diff <= MAX_REACTION) {
				data.push({
					lightness: color.lightness,
					chroma: color.chroma,
					hue: color.hue,
					value: diff,
				});
				index++;
				
				if (index === TOTAL_SAMPLES) {
					await sendBatchedTelemetry();
					alert("시각 테스트를 완료했습니다.\n확인 시 청각 테스트로 이동합니다.");
					window.location.replace("/auditory");
				}
			}
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
