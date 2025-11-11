<script>
	import { isMobile, setRangedTimeout, getUserId, MIN_REACTION, MAX_REACTION, REPETITIONS } from "$lib";
	import { onMount } from "svelte";
	import c from "chroma-js";

	const FREQUENCIES = [100, 800, 6400];
	const TOTAL_SAMPLES = FREQUENCIES.length * REPETITIONS;

	let context;
	let oscillator;
	let gainNode;
	let box;
	let timeoutHandler = null;
	let then = 0;
	let userId = null;
	let samples = [];
	let frequency = FREQUENCIES[0];
	let index = 0;
	let frequencySequence = [];

	onMount(() => {
		userId = getUserId();
		if (!userId) {
			window.location.replace("/");
			return;
		}
		
		// Create randomized sequence: each frequency appears REPETITIONS times
		frequencySequence = [];
		for (let i = 0; i < REPETITIONS; i++) {
			// Shuffle the sequence
			for (let j = FREQUENCIES.length - 1; j > 0; j--) {
				const k = Math.floor(Math.random() * (j + 1));
				[FREQUENCIES[j], FREQUENCIES[k]] = [FREQUENCIES[k], FREQUENCIES[j]];
			}
			frequencySequence.push(...FREQUENCIES);
		}
		
		frequency = frequencySequence[0];
		
		context = new AudioContext();
		gainNode = context.createGain();
		gainNode.gain.value = 0;
		gainNode.connect(context.destination);
		
		oscillator = context.createOscillator();
		oscillator.frequency.value = frequency;
		oscillator.connect(gainNode);
		oscillator.start();
	});

	async function ensureAudioContext() {
		if (context?.state === "suspended") {
			await context.resume();
		}
	}

	async function sendBatchedTelemetry() {
		if (!userId || samples.length === 0) return;
		
		try {
			await fetch("/api/auditory", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ user: userId, samples }),
			});
		} catch (error) {
			console.error("Failed to send telemetry:", error);
		}
	}

	async function pointerDownHandler(event) {
		event.preventDefault();
		frequency = frequencySequence[index];
		oscillator.frequency.value = frequency;
		await ensureAudioContext();
		box.textContent = "소리가 들리면 손을 때세요";
		
		timeoutHandler = setRangedTimeout(1000, 3000, () => {
			then = performance.now();
			gainNode.gain.setTargetAtTime(1, context.currentTime, 0.015);
			timeoutHandler = null;
		});
	}

	async function pointerUpHandler() {
		const diff = performance.now() - then - context.outputLatency * 1000;
		
		if (timeoutHandler) {
			clearTimeout(timeoutHandler);
			timeoutHandler = null;
		}

		if (then) {
			gainNode.gain.setTargetAtTime(0, context.currentTime, 0.015);
			box.textContent = `${Math.round(diff)}ms`;
			
			if (diff >= MIN_REACTION && diff <= MAX_REACTION) {
				samples.push({ frequency, value: diff });
				index++;
				
				if (index === TOTAL_SAMPLES) {
					await sendBatchedTelemetry();
					alert("청각 테스트를 완료했습니다.\n확인 시 결과 페이지로 이동합니다.");
					window.location.replace("/result");
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
