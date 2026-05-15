import { SlashCommandBuilder } from "discord.js";

/**
 * Base class for every slash command.
 *
 * Extend this class in your command file, implement `run()`, then export:
 * ```js
 * const cmd = new MyCommand();
 * export const data    = cmd.data;
 * export const execute = (i) => cmd.execute(i);
 * export const meta    = cmd.meta; // category, description, usage
 * ```
 */
export class Command {
	/**
	 * @param {string} name        - Slash command name (lowercase, no spaces).
	 * @param {string} description - Short description shown in Discord.
	 * @param {object} [meta={}]   - Extra metadata (category, usage).
	 * @param {string} [meta.category='utility'] - Category folder name.
	 * @param {string} [meta.usage='']           - Usage hint shown in /help.
	 */
	constructor(name, description, meta = {}) {
		/** @type {SlashCommandBuilder} */
		this.data = new SlashCommandBuilder()
			.setName(name)
			.setDescription(description);

		/** @type {{ category: string, usage: string }} */
		this.meta = {
			category: meta.category ?? "utility",
			usage: meta.usage ?? `/${name}`,
		};
	}

	/**
	 * Main command logic — **must** be overridden in subclasses.
	 *
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @returns {Promise<void>}
	 */
	async run(interaction) {
		await interaction.reply({
			content: "This command has no implementation yet.",
			ephemeral: true,
		});
	}

	/**
	 * Called by the command handler. Wraps `run()` for future pre/post hooks.
	 *
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @returns {Promise<void>}
	 */
	async execute(interaction) {
		await this.run(interaction);
	}
}
