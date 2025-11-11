import { json } from "@sveltejs/kit";

const TTL = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Calculate percentiles from sorted values
 */
function calculatePercentiles(sortedValues) {
	if (sortedValues.length === 0) return {};
	
	const percentiles = {};
	const percentilePoints = [1, 5, 10, 25, 50, 75, 90, 95, 99];
	
	for (const p of percentilePoints) {
		const index = Math.ceil((p / 100) * sortedValues.length) - 1;
		percentiles[`p${p}`] = sortedValues[Math.max(0, index)];
	}
	
	return percentiles;
}

/**
 * Find percentile for a given value using percentile breakpoints
 * Lower values (faster reaction times) = lower percentile number = better performance
 */
function findPercentile(value, percentiles) {
	const points = Object.keys(percentiles)
		.map(k => ({ percentile: parseInt(k.slice(1)), value: percentiles[k] }))
		.sort((a, b) => a.percentile - b.percentile);
	
	if (value <= points[0].value) return points[0].percentile;
	if (value >= points[points.length - 1].value) return points[points.length - 1].percentile;
	
	// Linear interpolation between breakpoints
	for (let i = 0; i < points.length - 1; i++) {
		if (value >= points[i].value && value <= points[i + 1].value) {
			const ratio = (value - points[i].value) / (points[i + 1].value - points[i].value);
			return points[i].percentile + ratio * (points[i + 1].percentile - points[i].percentile);
		}
	}
	
	return 50; // fallback
}

/**
 * Recalculate statistics and update the database
 */
async function updateStatistics(db) {
	// Get latest test per user for visual
	const visualResults = await db
		.prepare(`
			SELECT DISTINCT v1.mean 
			FROM visual v1
			INNER JOIN (
				SELECT user, MAX(time) as max_time
				FROM visual
				GROUP BY user
			) v2 ON v1.user = v2.user AND v1.time = v2.max_time
			ORDER BY v1.mean
		`)
		.all();
	
	// Get latest test per user for auditory
	const auditoryResults = await db
		.prepare(`
			SELECT DISTINCT a1.mean 
			FROM auditory a1
			INNER JOIN (
				SELECT user, MAX(time) as max_time
				FROM auditory
				GROUP BY user
			) a2 ON a1.user = a2.user AND a1.time = a2.max_time
			ORDER BY a1.mean
		`)
		.all();
	
	const visualMeans = visualResults.results.map(r => r.mean);
	const auditoryMeans = auditoryResults.results.map(r => r.mean);
	
	const visualPercentiles = calculatePercentiles(visualMeans);
	const auditoryPercentiles = calculatePercentiles(auditoryMeans);
	
	// Upsert statistics (delete and insert to handle single-row constraint)
	await db.prepare("DELETE FROM statistics WHERE id = 1").run();
	await db
		.prepare(`
			INSERT INTO statistics (id, visual_percentiles, auditory_percentiles, visual_count, auditory_count, updated_at)
			VALUES (1, ?, ?, ?, ?, ?)
		`)
		.bind(
			JSON.stringify(visualPercentiles),
			JSON.stringify(auditoryPercentiles),
			visualMeans.length,
			auditoryMeans.length,
			Date.now()
		)
		.run();
	
	return {
		visualPercentiles,
		auditoryPercentiles,
		visualCount: visualMeans.length,
		auditoryCount: auditoryMeans.length,
		updatedAt: Date.now()
	};
}

/**
 * Get or refresh statistics
 */
async function getStatistics(db) {
	const stats = await db
		.prepare("SELECT * FROM statistics WHERE id = 1")
		.first();
	
	// If no stats exist or they're stale, recalculate
	if (!stats || (Date.now() - stats.updated_at) > TTL) {
		return await updateStatistics(db);
	}
	
	return {
		visualPercentiles: JSON.parse(stats.visual_percentiles),
		auditoryPercentiles: JSON.parse(stats.auditory_percentiles),
		visualCount: stats.visual_count,
		auditoryCount: stats.auditory_count,
		updatedAt: stats.updated_at
	};
}

export async function GET({ url, platform }) {
	try {
		if (!platform?.env?.telemetry) {
			return json({ error: "Database not available" }, { status: 503 });
		}

		const user = url.searchParams.get("user");
		if (!user) {
			return json({ error: "User ID required" }, { status: 400 });
		}

		const db = platform.env.telemetry;

		// Get user's latest results
		const visualResult = await db
			.prepare("SELECT mean FROM visual WHERE user = ? ORDER BY time DESC LIMIT 1")
			.bind(user)
			.first();

		const auditoryResult = await db
			.prepare("SELECT mean FROM auditory WHERE user = ? ORDER BY time DESC LIMIT 1")
			.bind(user)
			.first();

		if (!visualResult || !auditoryResult) {
			return json({ error: "Test results not found" }, { status: 404 });
		}

		// Get or refresh statistics
		const stats = await getStatistics(db);

		// Calculate percentiles
		const visualPercentile = findPercentile(visualResult.mean, stats.visualPercentiles);
		const auditoryPercentile = findPercentile(auditoryResult.mean, stats.auditoryPercentiles);

		// Calculate "better than" counts
		const visualBetterThan = Math.round((visualPercentile / 100) * stats.visualCount);
		const auditoryBetterThan = Math.round((auditoryPercentile / 100) * stats.auditoryCount);

		return json({
			visual: {
				mean: visualResult.mean,
				percentile: Math.round(visualPercentile * 10) / 10,
				better_than: visualBetterThan,
				total_users: stats.visualCount
			},
			auditory: {
				mean: auditoryResult.mean,
				percentile: Math.round(auditoryPercentile * 10) / 10,
				better_than: auditoryBetterThan,
				total_users: stats.auditoryCount
			},
			stats_updated_at: stats.updatedAt
		});
	} catch (error) {
		console.error("Error fetching rank:", error);
		return json({ error: "Failed to fetch rank" }, { status: 500 });
	}
}
