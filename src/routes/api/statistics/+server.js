import { json } from "@sveltejs/kit";

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, platform }) {
	try {
		if (!platform?.env?.telemetry) {
			return json({ error: "Database not available" }, { status: 503 });
		}

		const user = url.searchParams.get("user");
		const db = platform.env.telemetry;

		let visualStats = null;
		let auditoryStats = null;

		if (user) {
			// User-specific statistics
			const visualResults = await db.prepare("SELECT value FROM visual WHERE user = ? ORDER BY time DESC").bind(user).all();

			const auditoryResults = await db.prepare("SELECT value FROM auditory WHERE user = ? ORDER BY time DESC").bind(user).all();

			visualStats = calculateStats(visualResults.results?.map((r) => r.value) || []);
			auditoryStats = calculateStats(auditoryResults.results?.map((r) => r.value) || []);
		} else {
			// Global statistics
			const visualResults = await db.prepare("SELECT value FROM visual").all();
			const auditoryResults = await db.prepare("SELECT value FROM auditory").all();

			visualStats = calculateStats(visualResults.results?.map((r) => r.value) || []);
			auditoryStats = calculateStats(auditoryResults.results?.map((r) => r.value) || []);
		}

		return json({
			visual: visualStats,
			auditory: auditoryStats,
		});
	} catch (error) {
		console.error("Error fetching statistics:", error);
		return json({ error: "Failed to fetch statistics" }, { status: 500 });
	}
}

/**
 * Calculate statistics from an array of values
 * @param {number[]} values
 * @param {number} excludePercent - Percentage to exclude from both top and bottom (default 10%)
 */
function calculateStats(values, excludePercent = 10) {
	if (values.length === 0) {
		return {
			count: 0,
			filteredCount: 0,
			mean: null,
			median: null,
			min: null,
			max: null,
			stdDev: null,
			excluded: 0,
		};
	}

	const originalCount = values.length;
	const sorted = [...values].sort((a, b) => a - b);

	// Calculate how many values to exclude from each end
	const excludeCount = Math.floor((sorted.length * excludePercent) / 100);

	// Filter out top and bottom N%
	const filtered = excludeCount > 0 ? sorted.slice(excludeCount, -excludeCount) : sorted;

	// If filtering removed all values, use original data
	const dataToUse = filtered.length > 0 ? filtered : sorted;
	const count = dataToUse.length;

	const sum = dataToUse.reduce((acc, val) => acc + val, 0);
	const mean = sum / count;

	const median = count % 2 === 0 ? (dataToUse[count / 2 - 1] + dataToUse[count / 2]) / 2 : dataToUse[Math.floor(count / 2)];

	const min = dataToUse[0];
	const max = dataToUse[count - 1];

	const variance = dataToUse.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
	const stdDev = Math.sqrt(variance);

	return {
		count: originalCount,
		filteredCount: count,
		mean: Math.round(mean),
		median: Math.round(median),
		min: Math.round(min),
		max: Math.round(max),
		stdDev: Math.round(stdDev),
		excluded: originalCount - count,
	};
}
