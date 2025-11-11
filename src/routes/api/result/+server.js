import { json } from "@sveltejs/kit";

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

		// Fetch visual data
		const visualResult = await db
			.prepare("SELECT data FROM visual WHERE user = ? ORDER BY time DESC LIMIT 1")
			.bind(user)
			.first();

		// Fetch auditory data
		const auditoryResult = await db
			.prepare("SELECT data FROM auditory WHERE user = ? ORDER BY time DESC LIMIT 1")
			.bind(user)
			.first();

		if (!visualResult || !auditoryResult) {
			return json({ error: "Test results not found" }, { status: 404 });
		}

		const visualSamples = JSON.parse(visualResult.data);
		const auditorySamples = JSON.parse(auditoryResult.data);

		return json({ 
			visual: visualSamples,
			auditory: auditorySamples 
		});
	} catch (error) {
		console.error("Error fetching results:", error);
		return json({ error: "Failed to fetch results" }, { status: 500 });
	}
}
