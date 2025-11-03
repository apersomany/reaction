<script>
	import { onMount } from "svelte";
	import { fingerprint } from "$lib";

	let userFingerprint = null;
	let showGlobal = false;
	let loading = true;
	let error = null;

	let statistics = {
		visual: null,
		auditory: null,
	};

	onMount(async () => {
		userFingerprint = await fingerprint();
		await loadStatistics();
	});

	async function loadStatistics() {
		loading = true;
		error = null;
		try {
			const url = showGlobal ? "/api/statistics" : `/api/statistics?user=${userFingerprint}`;
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error("Failed to load statistics");
			}
			statistics = await response.json();
		} catch (err) {
			error = err.message;
			console.error("Error loading statistics:", err);
		} finally {
			loading = false;
		}
	}

	async function toggleView() {
		showGlobal = !showGlobal;
		await loadStatistics();
	}
</script>

<svelte:head>
	<title>통계 - Reaction Time Test</title>
</svelte:head>

<div class="container">
	<div class="header">
		<h1>반응 속도 통계</h1>
		<button class="toggle-btn" on:click={toggleView}>
			{showGlobal ? "내 기록 보기" : "전체 기록 보기"}
		</button>
	</div>

	{#if loading}
		<div class="loading">로딩 중...</div>
	{:else if error}
		<div class="error">오류: {error}</div>
	{:else}
		<div class="stats-grid">
			<!-- Visual Statistics -->
			<div class="stat-card">
				<h2>시각 반응 속도</h2>
				{#if statistics.visual && statistics.visual.count > 0}
					<div class="stat-content">
						<div class="stat-item">
							<span class="stat-label">테스트 횟수</span>
							<span class="stat-value">{statistics.visual.count}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">평균</span>
							<span class="stat-value highlight">{statistics.visual.mean}ms</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">중앙값</span>
							<span class="stat-value">{statistics.visual.median}ms</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">최소</span>
							<span class="stat-value best">{statistics.visual.min}ms</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">최대</span>
							<span class="stat-value worst">{statistics.visual.max}ms</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">표준편차</span>
							<span class="stat-value">{statistics.visual.stdDev}ms</span>
						</div>
					</div>
				{:else}
					<div class="no-data">데이터가 없습니다</div>
				{/if}
			</div>

			<!-- Auditory Statistics -->
			<div class="stat-card">
				<h2>청각 반응 속도</h2>
				{#if statistics.auditory && statistics.auditory.count > 0}
					<div class="stat-content">
						<div class="stat-item">
							<span class="stat-label">테스트 횟수</span>
							<span class="stat-value">{statistics.auditory.count}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">평균</span>
							<span class="stat-value highlight">{statistics.auditory.mean}ms</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">중앙값</span>
							<span class="stat-value">{statistics.auditory.median}ms</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">최소</span>
							<span class="stat-value best">{statistics.auditory.min}ms</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">최대</span>
							<span class="stat-value worst">{statistics.auditory.max}ms</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">표준편차</span>
							<span class="stat-value">{statistics.auditory.stdDev}ms</span>
						</div>
					</div>
				{:else}
					<div class="no-data">데이터가 없습니다</div>
				{/if}
			</div>
		</div>

		<!-- Comparison -->
		{#if statistics.visual?.count > 0 && statistics.auditory?.count > 0}
			<div class="comparison">
				<h2>비교</h2>
				<div class="comparison-content">
					<p>
						{#if statistics.visual.mean < statistics.auditory.mean}
							당신의 시각 반응 속도가 청각 반응 속도보다
							<strong>{statistics.auditory.mean - statistics.visual.mean}ms</strong> 빠릅니다.
						{:else if statistics.auditory.mean < statistics.visual.mean}
							당신의 청각 반응 속도가 시각 반응 속도보다
							<strong>{statistics.visual.mean - statistics.auditory.mean}ms</strong> 빠릅니다.
						{:else}
							당신의 시각 반응 속도와 청각 반응 속도가 동일합니다.
						{/if}
					</p>
				</div>
			</div>
		{/if}

		<div class="actions">
			<a href="/visual" class="action-btn">시각 테스트</a>
			<a href="/auditory" class="action-btn">청각 테스트</a>
		</div>
	{/if}
</div>

<style>
	.container {
		min-height: 100svh;
		padding: 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	h1 {
		font-size: 2.5rem;
		font-weight: 700;
		margin: 0;
	}

	.toggle-btn {
		padding: 0.75rem 1.5rem;
		background: rgba(255, 255, 255, 0.2);
		border: 2px solid white;
		border-radius: 0.5rem;
		color: white;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.toggle-btn:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: translateY(-2px);
	}

	.loading,
	.error {
		text-align: center;
		padding: 3rem;
		font-size: 1.5rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		margin-top: 2rem;
	}

	.error {
		background: rgba(255, 0, 0, 0.2);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border-radius: 1rem;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.stat-card h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1.5rem;
		font-weight: 600;
		text-align: center;
	}

	.stat-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.stat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 0.5rem;
	}

	.stat-label {
		font-weight: 500;
		opacity: 0.9;
	}

	.stat-value {
		font-size: 1.25rem;
		font-weight: 700;
	}

	.stat-value.highlight {
		color: #ffd700;
		font-size: 1.5rem;
	}

	.stat-value.best {
		color: #90ee90;
	}

	.stat-value.worst {
		color: #ffb6b6;
	}

	.no-data {
		text-align: center;
		padding: 2rem;
		opacity: 0.7;
		font-style: italic;
	}

	.comparison {
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(10px);
		border-radius: 1rem;
		padding: 2rem;
		margin-bottom: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.comparison h2 {
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
		font-weight: 600;
		text-align: center;
	}

	.comparison-content {
		text-align: center;
		font-size: 1.1rem;
	}

	.comparison-content strong {
		color: #ffd700;
		font-size: 1.3rem;
	}

	.actions {
		display: flex;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.action-btn {
		padding: 1rem 2rem;
		background: rgba(255, 255, 255, 0.2);
		border: 2px solid white;
		border-radius: 0.5rem;
		color: white;
		text-decoration: none;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.action-btn:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: translateY(-2px);
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		h1 {
			font-size: 1.75rem;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.header {
			flex-direction: column;
			align-items: stretch;
		}

		.toggle-btn,
		.action-btn {
			width: 100%;
		}
	}
</style>
