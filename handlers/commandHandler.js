import {bold, green, red, whiteBright} from "colorette";

import {loadFiles, ms} from "./functions.js";

/*
* Loads all commands | Powered by Jena™️ V2-beta.1 handling
* @param {Client} client - The client to load commands for
* @returns {Promise<void>}
*/
export async function loadCommands(client) {
	try {
		// Load Command Files
		const unresolvedFiles = await loadFiles("commands");
		const slashCommands = unresolvedFiles.map((command) => command);

		// Load Command cooldown, set client.slashCommands
		await slashCommands.forEach(file => {
			file.data.cooldown = file.data.cooldown ? ms(file.data.cooldown) : null;
			client.slashCommands.set(file.name, file.data);
		});

		// Load Command Data
		const globalCommands = client.slashCommands.map((file, name) => ({
			defaultMemberPermissions: file["defaultMemberPermissions"],
			description: file["description"],
			dmPermission: !file["guildOnly"],
			options: file["options"],
			name: name
		}));

		// Actually set the commands in Discord
		await client.application.commands.set(globalCommands);
		console.log(bold(green("[ TODO ] ▪ ")) + whiteBright("Loaded Commands"));

		// Initialize Interaction Handling
		await onInteraction(client);
	} catch (error) {
		console.log(bold(red("[ ERR ] ▪ ")) + whiteBright("Loading Commands: ") + red(error));
		console.log(error);
	}
}

/*
* Handles slash command interactions
* @param {Client} client - The client to handle interactions for
* @returns {Promise<void>}
*/
async function onInteraction(client) {
	client.on("interactionCreate", async (interaction) => {
		if (!interaction.isCommand()) return;

		const commandName = interaction.commandName;
		const command = client.slashCommands.get(commandName);


		if (!command) return;

		// Handle cooldown
		if (command.cooldown) {
			const userId = interaction.user.id;
			const cooldownExpiration = client.cooldowns.get(userId) || 0;

			if (Date.now() < cooldownExpiration) {
				const timeLeft = cooldownExpiration - Date.now();
				return interaction.reply({
					content: `Slow down! Please wait ${ms(timeLeft)} before using this command again.`,
					ephemeral: true,
				});
			}

			client.cooldowns.set(userId, Date.now() + command.cooldown);
			setTimeout(() => {
				client.cooldowns.delete(userId);
			}, command.cooldown);
		}

		// Continue with command execution

		const args = interaction.options.data
			.filter(option => [3, 4, 5, 6, 7, 8, 10, 11].includes(option.type))
			.map(option => ({name: option.name, type: option.type, value: option.value}));

		// for each subcommand, add its options to the args array
		interaction.options.data.filter(option => option.type === 1).map(values => {
			values.options.map(option => {
				args.push({name: option.name, type: option.type, value: option.value});
			});
		});

		const {channel, guild, member, user} = interaction;

		// Execute command, catch errors
		try {
			await command.execute({args, channel, client, guild, interaction, member, user});
		} catch (error) {
			console.warn(bold(red("[ ERR ] ▪ ")) + whiteBright(`Error Executing "${commandName}": `));
			console.warn(red(error));

			await interaction.reply({
				embeds: [{
					title: "Error",
					color: 0xFF0000,
					description: "An error occurred while executing this command.",
					fields: [
						{
							name: "Diagnostic Nerd Stuff",
							value: `Command: ${commandName}\n - Parameters: ${args}`
						},
						{
							name: "Error Message",
							value: `\`\`\`${error.message}\`\`\``
						}
					]
				}], ephemeral: true
			}).catch(() => {
				console.warn(bold(red("[ ERR ] ▪ ")) + whiteBright(`Error Executing "${commandName}": `));
				console.warn(red(error));
			});
		}
	});
}