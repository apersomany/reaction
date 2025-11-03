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
 */
function calculateStats(values) {
	if (values.length === 0) {
		return {
			count: 0,
			mean: null,
			median: null,
			min: null,
			max: null,
			stdDev: null,
		};
	}

	const sorted = [...values].sort((a, b) => a - b);
	const count = values.length;
	const sum = values.reduce((acc, val) => acc + val, 0);
	const mean = sum / count;

	const median = count % 2 === 0 ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2 : sorted[Math.floor(count / 2)];

	const min = sorted[0];
	const max = sorted[count - 1];

	const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
	const stdDev = Math.sqrt(variance);

	return {
		count,
		mean: Math.round(mean),
		median: Math.round(median),
		min: Math.round(min),
		max: Math.round(max),
		stdDev: Math.round(stdDev),
	};
}
