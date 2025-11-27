import { json } from "@sveltejs/kit";

export async function GET({ platform }) {
	if (!platform?.env?.telemetry) {
		return json({ error: "Database not available" }, { status: 503 });
	}

	try {
		// Fetch all users
		const { results: users } = await platform.env.telemetry.prepare("SELECT * FROM user").all();
		
		// Fetch all visual data
		const { results: visualData } = await platform.env.telemetry.prepare("SELECT * FROM visual").all();
		
		// Fetch all auditory data
		const { results: auditoryData } = await platform.env.telemetry.prepare("SELECT * FROM auditory").all();

		const dump = {};

		// Initialize user objects
		for (const user of users) {
			dump[user.id] = {
				...user,
				auditory: [],
				visual: []
			};
		}

		// Populate visual data
		for (const record of visualData) {
			// If we have a user record for this visual data, add it
			if (dump[record.user]) {
				// Parse the data string back into JSON if possible, for a cleaner dump
				try {
					record.data = JSON.parse(record.data);
				} catch (e) {
					// keep as string if parse fails
				}
				dump[record.user].visual.push(record);
			} else {
                // If user doesn't exist in the user table (orphan record), we might want to handle it.
                // But the request implies structure by user_id.
                // If I strictly follow { <user_id>: ... }, orphan records might be lost or need a place.
                // Given the FK constraint in schema, orphans shouldn't exist if FKs are enforced.
                // SQLite enforces FKs if enabled.
            }
		}

		// Populate auditory data
		for (const record of auditoryData) {
			if (dump[record.user]) {
				try {
					record.data = JSON.parse(record.data);
				} catch (e) {
					// keep as string
				}
				dump[record.user].auditory.push(record);
			}
		}

		return json(dump);

	} catch (error) {
		console.error("Error dumping database:", error);
		return json({ error: "Failed to dump database" }, { status: 500 });
	}
}
