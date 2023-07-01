import {bold, red, white} from "colorette";
import {dbFindMany} from "../../handlers/mongo.js";

export default {
	name: "interactionCreate",

	execute: async function (interaction) {
		if (!interaction.isAutocomplete()) return;
		let input = interaction.options?.getFocused();

		switch (interaction.commandName) {
		case "todo":
			dbFindMany("tasks", {guildId: interaction.guild.id}).then(result => {
				const filteredTasks = result.filter(task => task.taskId.toString().includes(input));

				return interaction.respond(filteredTasks.map(task => ({
					name: `${task.taskId} - ${task.task}`, value: task.taskId
				})
				)).catch((error) => {
					return console.warn(
						bold(red("[ ERR ] ▪ ")) +
						white(`Executing "${interaction.commandName}": `) +
						red(error)
					);
				});
			});
			break;
		case "reject":
			switch (interaction.options.getSubcommand()) {
			case "suggestion":
				dbFindMany("suggestions", {guildId: interaction.guild.id}).then(result => {
					const filteredSuggestions = result.filter(suggestion => suggestion.timestamp.toString().includes(input));

					return interaction.respond(filteredSuggestions.map(suggestion => ({
						name: `${suggestion.timestamp} - ${suggestion.suggestion}`, value: suggestion.timestamp
					})
					)).catch((error) => {
						return console.warn(
							bold(red("[ ERR ] ▪ ")) +
							white(`Executing "${interaction.commandName}": `) +
							red(error)
						);
					});
				});
			}
		}
	}
};