import { SlashCommandBuilder } from "discord.js";

/**
 * Legacy base class for slash commands.
 * @deprecated Use CommandBuilder instead.
 */
export class Command {
	/**
	 * @param {string} name
	 * @param {string} description
	 * @param {{ category?: string, usage?: string }} [meta={}]
	 */
	constructor(name, description, meta = {}) {
		this.data = new SlashCommandBuilder()
			.setName(name)
			.setDescription(description);
		this.meta = {
			category: meta.category ?? "utility",
			usage: meta.usage ?? `/${name}`,
		};
	}

	/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
	async run(interaction) {
		await interaction.reply({
			content: "This command has no implementation yet.",
			ephemeral: true,
		});
	}

	/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
	async execute(interaction) {
		await this.run(interaction);
	}
}
