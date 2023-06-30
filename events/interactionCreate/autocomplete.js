import {bold, red, white} from "colorette";
import {dbFindMany} from "../../handlers/mongo.js";

export default {
	name: "interactionCreate",

	execute: async function (interaction) {
		if (!interaction.isAutocomplete()) return;
		let input = interaction.options?.getFocused();

		switch (interaction.commandName) {
		case "todo":
			// fetch list of taskIds from the database and filter by the input

			dbFindMany("tasks", {guildId: interaction.guild.id}).then(result => {
				const filteredTasks = result.filter(task => task.taskId.toString().includes(input));

				interaction.respond(filteredTasks.map(task => ({
						name: `${task.taskId} - ${task.task}`, value: task.taskId
					})
				)).catch((error) => {
					console.warn(
						bold(red("[ ERR ] ▪ ")) +
						white(`Executing "${interaction.commandName}": `) +
						red(error)
					);
				});
			});
		}
	}
};