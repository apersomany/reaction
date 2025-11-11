<script>
	import { onMount } from "svelte";
	import { getUserId } from "$lib";
	import { Chart } from "chart.js/auto";

	let userId = null;
	let visualData = [];
	let auditoryData = [];
	let rankData = null;
	let loading = true;
	let error = null;
	let isSharedView = false;

	onMount(async () => {
		// Check for shared URL parameter first
		const urlParams = new URLSearchParams(window.location.search);
		const sharedUserId = urlParams.get("user");
		
		if (sharedUserId) {
			// Viewing someone else's results
			userId = sharedUserId;
			isSharedView = true;
		} else {
			// Viewing own results
			userId = getUserId();
			if (!userId) {
				window.location.replace("/");
				return;
			}
		}

		try {
			const response = await fetch(`/api/result?user=${encodeURIComponent(userId)}`);
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to fetch results");
			}

			const data = await response.json();
			visualData = data.visual;
			auditoryData = data.auditory;

			// Fetch rank data
			try {
				const rankResponse = await fetch(`/api/rank?user=${encodeURIComponent(userId)}`);
				if (rankResponse.ok) {
					rankData = await rankResponse.json();
				}
			} catch (rankErr) {
				console.warn("Failed to fetch rank data:", rankErr);
			}

			// Wait for DOM to render canvases
			setTimeout(() => createCharts(), 0);
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	});

	function shareResults() {
		const shareUrl = `${window.location.origin}/result?user=${encodeURIComponent(userId)}`;
		navigator.clipboard.writeText(shareUrl).then(() => {
			alert("결과 링크가 클립보드에 복사되었습니다!");
		}).catch(() => {
			// Fallback: show the URL
			prompt("결과 공유 링크:", shareUrl);
		});
	}

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

<div style="min-height: 100svh; padding: 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
	<div style="max-width: 1200px; margin: 0 auto;">
		<h1 style="color: white; text-align: center; margin: 0 0 1rem 0; font-size: 2rem;">
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
			<!-- Rank Cards -->
			{#if rankData}
				<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 1rem; margin-bottom: 1rem;">
					<!-- Visual Rank -->
					<div style="background: white; border-radius: 1rem; padding: 1.5rem; text-align: center;">
						<h3 style="margin: 0 0 1rem 0; color: #667eea; font-size: 1.5rem;">시각 반응 순위</h3>
						<div style="font-size: 3rem; font-weight: bold; color: #667eea; margin: 0.5rem 0;">
							{Math.round(rankData.visual.mean)}ms
						</div>
						<div style="font-size: 1.25rem; color: #666; margin: 0.5rem 0;">
							상위 {rankData.visual.percentile.toFixed(1)}%
						</div>
						<div style="font-size: 1rem; color: #999; margin-top: 0.5rem;">
							{rankData.visual.better_than.toLocaleString()} / {rankData.visual.total_users.toLocaleString()} 명보다 빠름
						</div>
					</div>

					<!-- Auditory Rank -->
					<div style="background: white; border-radius: 1rem; padding: 1.5rem; text-align: center;">
						<h3 style="margin: 0 0 1rem 0; color: #764ba2; font-size: 1.5rem;">청각 반응 순위</h3>
						<div style="font-size: 3rem; font-weight: bold; color: #764ba2; margin: 0.5rem 0;">
							{Math.round(rankData.auditory.mean)}ms
						</div>
						<div style="font-size: 1.25rem; color: #666; margin: 0.5rem 0;">
							상위 {rankData.auditory.percentile.toFixed(1)}%
						</div>
						<div style="font-size: 1rem; color: #999; margin-top: 0.5rem;">
							{rankData.auditory.better_than.toLocaleString()} / {rankData.auditory.total_users.toLocaleString()} 명보다 빠름
						</div>
					</div>
				</div>
			{/if}

			<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(400px, 100%), 1fr)); gap: 1rem;">
				<!-- Chart 1: Visual vs Auditory -->
				<div style="background: white; border-radius: 1rem; padding: 1.5rem;">
					<h2 style="margin: 0 0 1rem 0; font-size: 1.25rem; text-align: center;">시각 vs 청각 평균 반응 시간</h2>
					<div style="height: 300px;">
						<canvas id="comparisonChart"></canvas>
					</div>
				</div>

				<!-- Chart 2: Hue trend -->
				<div style="background: white; border-radius: 1rem; padding: 1.5rem;">
					<h2 style="margin: 0 0 1rem 0; font-size: 1.25rem; text-align: center;">색상별 평균 반응 시간</h2>
					<div style="height: 300px;">
						<canvas id="hueChart"></canvas>
					</div>
				</div>

				<!-- Chart 3: Chroma trend -->
				<div style="background: white; border-radius: 1rem; padding: 1.5rem;">
					<h2 style="margin: 0 0 1rem 0; font-size: 1.25rem; text-align: center;">채도별 평균 반응 시간</h2>
					<div style="height: 300px;">
						<canvas id="chromaChart"></canvas>
					</div>
				</div>

				<!-- Chart 4: Frequency trend -->
				<div style="background: white; border-radius: 1rem; padding: 1.5rem;">
					<h2 style="margin: 0 0 1rem 0; font-size: 1.25rem; text-align: center;">주파수별 평균 반응 시간</h2>
					<div style="height: 300px;">
						<canvas id="frequencyChart"></canvas>
					</div>
				</div>
			</div>

			<div style="text-align: center; margin-top: 1rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
				{#if !isSharedView}
					<button
						on:click={shareResults}
						style="padding: 1rem 1rem; font-size: 1.125rem; border: none; border-radius: 0.5rem; background: white; cursor: pointer; font-weight: bold;">
						결과 공유하기
					</button>
				{/if}
				<button
					on:click={() => window.location.replace("/")}
					style="padding: 1rem 1rem; font-size: 1.125rem; border: none; border-radius: 0.5rem; background: white; cursor: pointer; font-weight: bold;">
					테스트 다시하기
				</button>
			</div>
		{/if}
	</div>
</div>
