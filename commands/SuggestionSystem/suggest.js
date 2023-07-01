import {errorEmbed, Option} from "../../handlers/functions.js";

import {dbDeleteOne, dbFindOne, dbInsertOne} from "../../handlers/mongo.js";

import {ButtonStyle} from "discord.js";

export default {
	category: "SuggestionSystem",
	description: "Suggest an idea.",
	cooldown: "10s", // To prevent spamming

	options: [
		new Option("type", "What type of suggestion is this?", 3, true, false, [
			{name: "Ram API", value: "Ram API"},
			{name: "Ram Bot", value: "Ram Bot"},
			{name: "Discord Server", value: "Discord Server"},
			{name: "Website", value: "Website"}
		]),
		new Option("description", "What is the suggestion?", 3, true)
	],

	execute: async function ({args, client, interaction}) {
		const settings = await dbFindOne("settings", {guildId: interaction.guild.id}).then(result => result || null);
		if (!settings?.channel_suggest) return interaction.reply(errorEmbed("Please set a suggestions channel with `/settings suggestions`."));
		const newTimestamp = Date.now();

		switch (args[0].value) {
		case "Ram API":
			// Send suggestion to Ram API (TESTED AND WORKING)
			client.ram_api.suggestionAsync(args[1].value, interaction.member.displayName).then(() => {
				interaction.reply("Your suggestion has been sent.");
			}).catch((error) => {
				console.warn(error);
				interaction.reply("There was an error sending your suggestion.");
			});
			break;
		default:
			try {
				interaction.guild.channels.cache.get(settings.channel_suggest).send({
					components: [{
						type: 1, components: [
							{custom_id: "suggest-upvote", emoji: {name: "🔼"}, style: ButtonStyle["Success"], type: 2},
							{custom_id: "suggest-downvote", emoji: {name: "🔽"}, style: ButtonStyle["Danger"], type: 2}
						]
					}],
					embeds: [{
						title: `[${args[0].value}] Suggestion`,
						description: args[1].value.substring(0, 80),
						footer: {text: `ID: ${newTimestamp} | Suggested by ${interaction.member.displayName}`},
						fields: [
							{name: "UPVOTES", value: "0", inline: true},
							{name: "DOWNVOTES", value: "0", inline: true}
						]
					}]
				}).then(async (message) => {
					await dbInsertOne("suggestions", {
						suggestion: args[1].value.substring(0, 80),
						guildId: interaction.guild.id,
						messageId: message.id,
						timestamp: newTimestamp,
					});
					return interaction.reply({content: "Your suggestion has been sent.", ephemeral: true});
				});
			} catch (error) {
				await dbDeleteOne("settings", {
					guildId: interaction.guild.id,
					channel_suggest: settings.channel_suggest
				});
				return interaction.reply(errorEmbed("There was an error sending your suggestion. | Please let a manager know to run `/settings suggestions`."));
			}
		}
	}
};