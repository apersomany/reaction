import { json } from "@sveltejs/kit";

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, platform }) {
	try {
		const { user, lightness, chroma, hue, value } = await request.json();

		if (!platform?.env?.telemetry) {
			return json({ error: "Database not available" }, { status: 503 });
		}

		await platform.env.telemetry
			.prepare("INSERT INTO visual (user, time, lightness, chroma, hue, value) VALUES (?, ?, ?, ?, ?, ?)")
			.bind(user, Date.now(), lightness, chroma, hue, value)
			.run();

		return json({ success: true });
	} catch (error) {
		console.error("Error saving visual test:", error);
		return json({ error: "Failed to save test result" }, { status: 500 });
	}
}
