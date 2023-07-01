import {dbDeleteOne, dbFindOne, dbInsertOne, dbUpdateOne} from "../../handlers/mongo.js";
import {errorEmbed, Option, SubCommand} from "../../handlers/functions.js";
import {PermissionFlagsBits} from "discord.js";

export default {
	category: "ToDo",
	cooldown: "5s",
	description: "Manage your to-do list.",
	defaultMemberPermissions: [PermissionFlagsBits["Administrator"]],

	options: [
		new SubCommand("create", "Create a new task.", [
			new Option("task", "What is the task?", 3, true)
		]),
		new SubCommand("delete", "Delete a task.", [
			new Option("task-id", "What is the task ID?", 10, true, true)
		]),
		new SubCommand("edit", "Edit a task.", [
			new Option("task-id", "What is the task ID?", 10, true, true),
			new Option("new-task", "What is the new task?", 3, true)
		]),
		new SubCommand("move", "Move a task to another category", [
			new Option("task-id", "What is the task ID?", 10, true, true),
			new Option("category", "What is the new category?", 3, true, false, [
				{name: "To Do", value: "thread_todo"},
				{name: "In Progress", value: "thread_progress"},
				{name: "Completed", value: "thread_complete"}
			])
		]),
		new SubCommand("settings", "Change the settings for this server.", [
			new Option("thread_todo", "What is the todo thread?", 7, false, false, [], {channel_types: [11]}),
			new Option("thread_progress", "What is the progress thread?", 7, false, false, [], {channel_types: [11]}),
			new Option("thread_complete", "What is the complete thread?", 7, false, false, [], {channel_types: [11]}),
			new Option("channel_suggest", "What is the suggestion channel?", 7, false, false, [], {channel_types: [0]}),
		])
	],

	execute: async function ({args, interaction}) {
		const settings = await dbFindOne("settings", {guildId: interaction.guild.id}).then(result => result || null);
		const threadChannel = interaction.guild.channels.cache.get(settings[args[1]?.value]);
		let taskQuery = null, message = null;

		if (args[0]?.value) {
			taskQuery = await dbFindOne("tasks", {
				guildId: interaction.guild.id, taskId: args[0].value
			}).then(result => result || null);

			if (taskQuery) message = await interaction.guild.channels.cache.get(settings[taskQuery.category])?.messages.fetch(taskQuery.messageId).catch(() => null);
		}
		const newId = Date.now();

		switch (interaction.options.getSubcommand()) {
		case "create":
			if (!settings?.thread_todo) return interaction.reply(errorEmbed("Please set a ToDo thread with `/todo settings`."));

			interaction.guild.channels.cache.get(settings.thread_todo)?.send({
				embeds: [{
					title: args[0].value.substring(0, 80),
					footer: {text: `Task ID: ${newId}`},
					color: 0xFF0000,
				}]
			}).then(async (message) => {
				await dbInsertOne("tasks", {
					guildId: interaction.guild.id,
					messageId: message.id,
					category: "thread_todo",
					color: 0xFF0000,
					task: args[0].value.substring(0, 80),
					taskId: newId
				});
				interaction.reply({content: `Created task with ID: ${newId}`, ephemeral: true});
			}).catch(error => {
				console.warn(error);
				interaction.reply(errorEmbed("There was an issue sending the message, make sure the thread still exists."));
			});
			break;

		case "delete":
			if (!taskQuery) return interaction.reply(errorEmbed("Invalid task ID."));

			if (message) await message.delete();

			await dbDeleteOne("tasks", {guildId: interaction.guild.id, taskId: args[0].value});
			return interaction.reply({content: `Deleted task with ID: ${args[0].value}`, ephemeral: true});

		case "edit":
			if (!taskQuery) return interaction.reply(errorEmbed("Invalid task ID."));

			if (!message) {
				await dbDeleteOne("tasks", {guildId: interaction.guild.id, taskId: args[0].value});
				return interaction.reply(errorEmbed("We couldn't find the message, so we deleted it from the database."));
			}

			return await message.edit({
				embeds: [{
					title: args[1].value.substring(0, 80),
					footer: {text: `Task ID: ${taskQuery.taskId}`},
					color: taskQuery.color,
				}]
			}).then(async () => {
				await dbUpdateOne("tasks", {
					guildId: interaction.guild.id,
					taskId: args[0].value
				}, {$set: {task: args[1].value.substring(0, 80)}});
				interaction.reply({content: `Edited task with ID: ${args[0].value}`, ephemeral: true});
			});

		case "move":
			if (!taskQuery) return interaction.reply(errorEmbed("Invalid task ID."));
			if (!settings?.thread_todo || !settings?.thread_progress || !settings?.thread_complete) return interaction.reply(errorEmbed("Please set all threads with `/todo settings`."));
			if (taskQuery.category === args[1].value) return interaction.reply(errorEmbed("Task is already in that category."));

			if (!message) {
				await dbDeleteOne("tasks", {guildId: interaction.guild.id, taskId: args[0].value});
				return interaction.reply(errorEmbed("We couldn't find the message, so we deleted it from the database."));
			}

			await message.delete();

			if (!threadChannel) return interaction.reply(errorEmbed("Category thread doesn't exist, please reset it with `/todo settings`."));

			const newColor = args[1].value === "thread_todo" ? 0xFF0000 : args[1].value === "thread_progress" ? 0xFFFF00 : 0x00FF00;

			return await threadChannel.send({
				embeds: [{
					title: taskQuery.task.substring(0, 80),
					footer: {text: `Task ID: ${taskQuery.taskId}`},
					color: newColor,
				}]
			}).then(async (message) => {
				await dbUpdateOne("tasks", {
					guildId: interaction.guild.id, taskId: args[0].value
				}, {$set: {category: args[1].value, color: newColor, messageId: message.id}});
				return interaction.reply({content: `Moved task with ID: ${args[0].value}`, ephemeral: true});
			}).catch(error => {
				console.warn(error);
				return interaction.reply(errorEmbed("There was an issue sending the message, make sure the thread still exists."));
			});

		case "settings":
			if (!args.length) return interaction.reply({
				embeds: [{
					title: "Settings",
					fields: [
						{
							name: "To Do Thread",
							value: settings?.thread_todo || "Not Set"
						},
						{
							name: "In Progress Thread",
							value: settings?.thread_progress || "Not Set"
						},
						{
							name: "Completed Thread",
							value: settings?.thread_complete || "Not Set"
						},
						{
							name: "Suggestion Channel",
							value: settings?.channel_suggest || "Not Set"
						}
					]
				}], ephemeral: true
			});

			await Promise.all(args.map(async (arg) => {
				await dbUpdateOne("settings", {guildId: interaction.guild.id}, {$set: {[arg.name]: arg.value}}, {upsert: true});
			}));

			return interaction.reply({content: "Settings updated.", ephemeral: true});
		default:
			return interaction.reply({
				embeds: [{
					title: "How did you get here?",
					description: "This was supposed to be impossible. \n Please contact the developers and tell them how you got here.",
				}], ephemeral: true
			});
		}
	}
};