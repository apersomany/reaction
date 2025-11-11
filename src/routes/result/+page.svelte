<script>
	import { onMount } from "svelte";
	import { getUserId } from "$lib";
	import { Chart } from "chart.js/auto";

	let userId = null;
	let visualData = [];
	let auditoryData = [];
	let loading = true;
	let error = null;

	onMount(async () => {
		userId = getUserId();
		if (!userId) {
			window.location.replace("/");
			return;
		}

		try {
			const response = await fetch(`/api/result?user=${userId}`);
			if (!response.ok) {
				throw new Error("Failed to fetch results");
			}

			const data = await response.json();
			visualData = data.visual;
			auditoryData = data.auditory;

			// Create charts after data is loaded
			createCharts();
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	});

	function createCharts() {
		// Chart 1: Visual vs Auditory average
		createComparisonChart();

		// Chart 2: Average by hue
		createHueChart();

		// Chart 3: Average by chroma
		createChromaChart();

		// Chart 4: Average by frequency
		createFrequencyChart();
	}

	function createComparisonChart() {
		const visualAvg = visualData.reduce((sum, s) => sum + s.value, 0) / visualData.length;
		const auditoryAvg = auditoryData.reduce((sum, s) => sum + s.value, 0) / auditoryData.length;

		const ctx = document.getElementById("comparisonChart");
		new Chart(ctx, {
			type: "bar",
			data: {
				labels: ["시각", "청각"],
				datasets: [{
					label: "평균 반응 시간 (ms)",
					data: [visualAvg, auditoryAvg],
					backgroundColor: ["rgba(255, 99, 132, 0.5)", "rgba(54, 162, 235, 0.5)"],
					borderColor: ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)"],
					borderWidth: 1
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: true,
						title: {
							display: true,
							text: "반응 시간 (ms)"
						}
					}
				}
			}
		});
	}

	function createHueChart() {
		// Group by hue and calculate averages
		const hueGroups = {};
		visualData.forEach(sample => {
			if (!hueGroups[sample.hue]) {
				hueGroups[sample.hue] = [];
			}
			hueGroups[sample.hue].push(sample.value);
		});

		const hues = Object.keys(hueGroups).sort((a, b) => Number(a) - Number(b));
		const averages = hues.map(hue => {
			const values = hueGroups[hue];
			return values.reduce((sum, v) => sum + v, 0) / values.length;
		});

		const ctx = document.getElementById("hueChart");
		new Chart(ctx, {
			type: "line",
			data: {
				labels: hues.map(h => `${h}°`),
				datasets: [{
					label: "평균 반응 시간 (ms)",
					data: averages,
					borderColor: "rgba(75, 192, 192, 1)",
					backgroundColor: "rgba(75, 192, 192, 0.2)",
					tension: 0.1
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: true,
						title: {
							display: true,
							text: "반응 시간 (ms)"
						}
					},
					x: {
						title: {
							display: true,
							text: "색상 (Hue)"
						}
					}
				}
			}
		});
	}

	function createChromaChart() {
		// Group by chroma and calculate averages
		const chromaGroups = {};
		visualData.forEach(sample => {
			if (!chromaGroups[sample.chroma]) {
				chromaGroups[sample.chroma] = [];
			}
			chromaGroups[sample.chroma].push(sample.value);
		});

		const chromas = Object.keys(chromaGroups).sort((a, b) => Number(a) - Number(b));
		const averages = chromas.map(chroma => {
			const values = chromaGroups[chroma];
			return values.reduce((sum, v) => sum + v, 0) / values.length;
		});

		const ctx = document.getElementById("chromaChart");
		new Chart(ctx, {
			type: "line",
			data: {
				labels: chromas,
				datasets: [{
					label: "평균 반응 시간 (ms)",
					data: averages,
					borderColor: "rgba(153, 102, 255, 1)",
					backgroundColor: "rgba(153, 102, 255, 0.2)",
					tension: 0.1
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: true,
						title: {
							display: true,
							text: "반응 시간 (ms)"
						}
					},
					x: {
						title: {
							display: true,
							text: "채도 (Chroma)"
						}
					}
				}
			}
		});
	}

	function createFrequencyChart() {
		// Group by frequency and calculate averages
		const freqGroups = {};
		auditoryData.forEach(sample => {
			if (!freqGroups[sample.frequency]) {
				freqGroups[sample.frequency] = [];
			}
			freqGroups[sample.frequency].push(sample.value);
		});

		const frequencies = Object.keys(freqGroups).sort((a, b) => Number(a) - Number(b));
		const averages = frequencies.map(freq => {
			const values = freqGroups[freq];
			return values.reduce((sum, v) => sum + v, 0) / values.length;
		});

		const ctx = document.getElementById("frequencyChart");
		new Chart(ctx, {
			type: "line",
			data: {
				labels: frequencies.map(f => `${f} Hz`),
				datasets: [{
					label: "평균 반응 시간 (ms)",
					data: averages,
					borderColor: "rgba(255, 159, 64, 1)",
					backgroundColor: "rgba(255, 159, 64, 0.2)",
					tension: 0.1
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: true,
						title: {
							display: true,
							text: "반응 시간 (ms)"
						}
					},
					x: {
						title: {
							display: true,
							text: "주파수"
						}
					}
				}
			}
		});
	}
</script>

<div style="min-height: 100svh; padding: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
	<div style="max-width: 1200px; margin: 0 auto;">
		<h1 style="color: white; text-align: center; margin-bottom: 2rem; font-size: 2rem;">
			테스트 결과
		</h1>

		{#if loading}
			<div style="color: white; text-align: center; font-size: 1.5rem;">
				결과를 불러오는 중...
			</div>
		{:else if error}
			<div style="color: white; text-align: center; font-size: 1.5rem;">
				오류: {error}
			</div>
		{:else}
			<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 2rem;">
				<!-- Chart 1: Visual vs Auditory -->
				<div style="background: white; border-radius: 1rem; padding: 1.5rem;">
					<h2 style="margin-bottom: 1rem; font-size: 1.25rem;">시각 vs 청각 평균 반응 시간</h2>
					<div style="height: 300px;">
						<canvas id="comparisonChart"></canvas>
					</div>
				</div>

				<!-- Chart 2: Hue trend -->
				<div style="background: white; border-radius: 1rem; padding: 1.5rem;">
					<h2 style="margin-bottom: 1rem; font-size: 1.25rem;">색상별 평균 반응 시간</h2>
					<div style="height: 300px;">
						<canvas id="hueChart"></canvas>
					</div>
				</div>

				<!-- Chart 3: Chroma trend -->
				<div style="background: white; border-radius: 1rem; padding: 1.5rem;">
					<h2 style="margin-bottom: 1rem; font-size: 1.25rem;">채도별 평균 반응 시간</h2>
					<div style="height: 300px;">
						<canvas id="chromaChart"></canvas>
					</div>
				</div>

				<!-- Chart 4: Frequency trend -->
				<div style="background: white; border-radius: 1rem; padding: 1.5rem;">
					<h2 style="margin-bottom: 1rem; font-size: 1.25rem;">주파수별 평균 반응 시간</h2>
					<div style="height: 300px;">
						<canvas id="frequencyChart"></canvas>
					</div>
				</div>
			</div>

			<div style="text-align: center; margin-top: 2rem;">
				<button
					on:click={() => window.location.replace("/")}
					style="padding: 1rem 2rem; font-size: 1.125rem; border: none; border-radius: 0.5rem; background: white; cursor: pointer; font-weight: bold;">
					홈으로 돌아가기
				</button>
			</div>
		{/if}
	</div>
</div>
