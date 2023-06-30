import {bold, green, red, whiteBright} from "colorette";
import {loadFiles} from "./functions.js";

/*
* Loads all events
* @param {Client} client - The client to load events for
* @returns {Promise<void>}
*/
export async function loadEvents(client) {
	await client.events.clear();

	try {
		// Load Event Files
		const eventFiles = await loadFiles("events");
		const resolvedFiles = await Promise.all(eventFiles.map(file => file));

		// Load Event Data
		resolvedFiles.forEach((file) => {
			const execute = (...args) => file.data.execute(...args, client);
			client.events.set(file.data.name || file.name, execute);

			// Load Events (on, custom)
			if (file.data.custom) execute(client);
			else {
				if (file.data.once) client.on(file.data.name, execute);
				else client.on(file.data.name, execute);
			}
		});

		console.log(
			bold(green("[ TODO ] ▪ ")) +
			whiteBright("Loaded Events")
		);
	} catch (err) {
		console.error(
			bold(red("[ ERR ] ▪ ")) +
			whiteBright("Loading events: ") +
			err
		);
	}
}