import { json } from "@sveltejs/kit";

export async function POST({ request, platform }) {
	try {
		const { user, samples } = await request.json();

		if (!platform?.env?.telemetry) {
			return json({ error: "Database not available" }, { status: 503 });
		}

		const mean = Math.round(samples.reduce((sum, s) => sum + s.value, 0) / samples.length);

		await platform.env.telemetry
			.prepare("INSERT INTO auditory (user, time, mean, data) VALUES (?, ?, ?, ?)")
			.bind(user, Date.now(), mean, JSON.stringify(samples))
			.run();

		return json({ success: true });
	} catch (error) {
		console.error("Error saving auditory test:", error);
		return json({ error: "Failed to save test result" }, { status: 500 });
	}
}
