// IMPORTS

import "dotenv/config";

import {MongoClient} from "mongodb";

import {loadCommands} from "./handlers/commandHandler.js";

import {bold, green, red, whiteBright, yellow} from "colorette";

import {Client, Collection, IntentsBitField, Partials} from "discord.js";

import ram_api from "ram-api.js";
import {loadEvents} from "./handlers/eventHandler.js";


// Discord.JS Client (exported for easy access)
export let client = new Client({
	intents: [
		IntentsBitField.Flags["Guilds"],
		IntentsBitField.Flags["GuildMembers"],
		IntentsBitField.Flags["GuildMessages"],
		IntentsBitField.Flags["GuildModeration"],
		IntentsBitField.Flags["MessageContent"],
		IntentsBitField.Flags["GuildVoiceStates"],
	],
	partials: [Partials.Channel, Partials.GuildMember, Partials.Message],
	presence: {
		status: "idle"
	}
});


// Ram API Setup
const ram_api_client = new ram_api.RamApiPro(process.env["RAM_API"], "v13");


// MongoDB Setup
MongoClient.connect(process.env["MONGO"]).then((dbClient) => {
	client.mongo = dbClient.db("todoSystem");
	console.log(
		bold(green("[ TODO ] ▪ ")) +
		whiteBright("Database Connected")
	);

	// Connects to Discord
	client.once("ready", async () => {
		client.slashCommands = new Collection();
		client.cooldowns = new Collection();
		client.events = new Collection();
		await loadCommands(client);
		await loadEvents(client);

		// RAM API Version Check
		setInterval(() => ram_api_client.version_checkAsync(), 3600000); // 1 Hour

		console.log(
			bold(green("[ TODO ] ▪ ")) +
			whiteBright("Core Systems Active")
		);
	});


	// Closes the Database & Discord Connection on close.
	process.on("SIGINT", () => {
		dbClient.close().then(() => {
			console.log(
				bold(yellow("[ TODO ] ▪ ")) +
				whiteBright("Database Closed")
			);

			client.destroy();
			console.log(
				bold(yellow("[ TODO ] ▪ ")) +
				whiteBright("Client Closed. Goodbye!")
			);

			process.exit(0);
		});
	});
}).catch((err) => {
	console.error(
		bold(red("[ MONGODB ERROR ] ▪ ")) +
		whiteBright(err.message)
	);
	process.exit(1);
});

// Connects to Discord, .then() is for my IDE to stop complaining
client.login(process.env["TOKEN"]).then();