import {errorEmbed, Option, SubCommand} from "../../handlers/functions.js";

import {PermissionFlagsBits} from "discord.js";
import {dbDeleteOne, dbFindOne} from "../../handlers/mongo.js";

export default {
	category: "Utilities",
	description: "Reject stuff.",
	defaultMemberPermissions: [PermissionFlagsBits["Administrator"]],
	options: [
		new SubCommand("suggestion", "Reject a suggestion.", [
			new Option("suggestion-id", "What is the suggestion ID?", 10, true, true),
			new Option("reason", "What is the reason?", 3, true)
		]),
	],

	execute: async function ({args, interaction}) {
		const settings = await dbFindOne("settings", {guildId: interaction.guild.id});
		const result = await dbFindOne("suggestions", {timestamp: args[0].value});
		if (!result) return interaction.reply(errorEmbed("We couldn't find that suggestion."));

		const suggestionMessage = await interaction.guild.channels.cache.get(settings.channel_suggest).messages.fetch(result.messageId).catch(() => null);

		if (!suggestionMessage) {
			await dbDeleteOne("suggestions", {guildId: interaction.guild.id, timestamp: args[0].value});
			return interaction.reply(errorEmbed("We couldn't find that suggestion. It has been deleted from the database."));
		}

		const suggestionEmbed = suggestionMessage.embeds[0];

		if (!suggestionMessage.components.length) return interaction.reply(errorEmbed("This suggestion has already concluded."));

		await suggestionMessage.edit({
			components: [],
			embeds: [{
				title: suggestionEmbed.title,
				description: suggestionEmbed.description,
				fields: [{
					name: "Status - Rejected", value: args[1].value,
				}], color: 0xFF0000,
			}]
		});

		await dbDeleteOne("suggestions", {guildId: interaction.guild.id, timestamp: args[0].value}).catch(() => null);

		await interaction.reply({
			embeds: [{
				title: "Rejected Suggestion",
				description: suggestionEmbed.description,
				color: 0xFF0000,
			}], ephemeral: true
		});
	}
};