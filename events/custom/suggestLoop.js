import {dbDeleteOne, dbFindMany, dbInsertOne} from "../../handlers/mongo.js";

export default {
	custom: true,

	execute: async function (client) {
		setInterval(async () => {
			const suggestions = await dbFindMany("suggestions", {});
			const settings = await dbFindMany("settings", {});

			// check timestamp of every suggestion, if older than 2 day conclude the results
			await Promise.all(suggestions.map(async suggestion => {
				if (Date.now() - suggestion.timestamp < 259200000) return; // 3 days

				// Make sure we're not dealing with a conspiracy theory
				const message = await client.guilds.cache.get(suggestion.guildId).channels.cache.get(settings.find(setting => setting.guildId === suggestion.guildId).channel_suggest)?.messages.fetch(suggestion.messageId).catch(() => null);
				if (!message) return dbDeleteOne("suggestions", {messageId: suggestion.messageId});

				// Check if vote was successful
				const voteSuccess = message.embeds[0].fields[0]?.value >= message.embeds[0].fields[1]?.value;

				// If settings are not found or thread_todo is not set, conclude the suggestion
				if (!settings || !settings.find(setting => setting.guildId === suggestion.guildId)?.thread_todo) return message.edit({
					components: [], embeds: [{
						title: message.embeds[0].title,
						description: suggestion.suggestion,
						fields: [{
							name: "Status - Concluded",
							value: `Vote ${voteSuccess ? "Approved" : "Rejected"} | Unable to add suggestion, there was an error.`
						}]
					}]
				});

				// If vote was successful, send the suggestion to the thread_todo channel
				await message.edit({
					components: [],
					embeds: [{
						title: message.embeds[0].title,
						description: suggestion.suggestion,
						fields: [{
							name: "Status - Concluded", value: voteSuccess ? "Approved" : "Rejected",
						}], color: voteSuccess ? 0x00FF00 : 0xFF0000,
						footer: {text: message.embeds[0].footer?.text.split(" | ")[1]}
					}]
				});

				if (!voteSuccess) return await dbDeleteOne("suggestions", {messageId: suggestion.messageId});

				client.guilds.cache.get(suggestion.guildId).channels.cache.get(settings.find(setting => setting.guildId === suggestion.guildId).thread_todo)?.send({
					embeds: [{
						color: 0xFF0000, footer: {text: `Task ID: ${suggestion.timestamp}`},
						title: suggestion.suggestion
					}]
				}).then(async (message) => {
					await dbInsertOne("tasks", {
						guildId: message.guild.id,
						messageId: message.id,
						category: "thread_todo",
						color: 0xFF0000,
						task: suggestion.suggestion,
						taskId: suggestion.timestamp
					});

					await dbDeleteOne("suggestions", {messageId: suggestion.messageId});
				});
			}));

		}, 20 * 60 * 1000);
	}
};