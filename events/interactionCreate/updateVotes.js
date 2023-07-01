import {dbFindOne, dbUpdateOne} from "../../handlers/mongo.js";

export default {
	name: "interactionCreate",

	execute: async function (interaction) {
		if (interaction.customId !== "suggest-upvote" && interaction.customId !== "suggest-downvote") return;

		const suggestion = await dbFindOne("suggestions", {
			messageId: interaction.message.id
		});
		if (!suggestion) return interaction.message.delete().catch(() => null);

		// if user id is in voter list, return interaction
		if (suggestion.voters?.includes(interaction.user.id)) return interaction.reply({
			content: "You have already voted on this suggestion!", ephemeral: true
		});

		// add user id to voter list
		await dbUpdateOne("suggestions", {messageId: interaction.message.id}, {
			$push: {voters: interaction.user.id}
		});

		switch (interaction.customId) {
		case "suggest-upvote":
			return interaction.update({
				embeds: [{
					...interaction.message.embeds[0].data, // Copy the existing embed object
					fields: [
						{
							inline: true, name: "UPVOTES",
							value: parseInt(interaction.message.embeds[0].fields[0].value) + 1
						},
						{name: "DOWNVOTES", value: interaction.message.embeds[0].fields[1].value, inline: true}
					]
				}]
			});
		case "suggest-downvote":
			return interaction.update({
				embeds: [{
					...interaction.message.embeds[0].data, // Copy the existing embed object
					fields: [
						{inline: true, name: "UPVOTES", value: interaction.message.embeds[0].fields[0].value},
						{
							inline: true, name: "DOWNVOTES",
							value: parseInt(interaction.message.embeds[0].fields[1].value) + 1
						}
					]
				}]
			});
		}
	}
};