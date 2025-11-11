import { json } from "@sveltejs/kit";

export async function POST({ request, platform }) {
	try {
		const { id, nickname, age, sex, phone } = await request.json();

		if (!platform?.env?.telemetry) {
			return json({ error: "Database not available" }, { status: 503 });
		}

		await platform.env.telemetry
			.prepare("INSERT INTO user (id, nickname, age, sex, phone_no) VALUES (?, ?, ?, ?, ?)")
			.bind(id, nickname, age, sex, phone)
			.run();

		return json({ success: true, userId: id });
	} catch (error) {
		console.error("Error saving user:", error);
		return json({ error: "Failed to save user information" }, { status: 500 });
	}
}
