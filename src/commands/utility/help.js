import { config } from "#config";
import { Command } from "#structures/Command";
import { truncate } from "#utils/helpers";
import { EmbedBuilder } from "discord.js";

/**
 * `/help` — Shows all available commands grouped by category.
 * Command metadata is sourced live from `client.commands`.
 */
class HelpCommand extends Command {
	constructor() {
		super("help", "Show all available commands grouped by category.", {
			category: "utility",
			usage: "/help",
		});
	}

	/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
	async run(interaction) {
		/** @type {Map<string, string[]>} category → list of command lines */
		const categories = new Map();

		for (const [, command] of interaction.client.commands) {
			const category = command.meta?.category ?? "misc";
			if (!categories.has(category)) categories.set(category, []);

			const usage = command.meta?.usage ?? `/${command.data.name}`;
			const desc = truncate(command.data.description, 60);
			categories.get(category).push(`\`${usage}\` — ${desc}`);
		}

		const ICONS = {
			moderation: "🔨",
			download: "📤",
			utility: "🔧",
			automod: "🛡️",
			owner: "👑",
		};

		const embed = new EmbedBuilder()
			.setColor(config.color.default)
			.setTitle(`${interaction.client.user.username} — Command List`)
			.setThumbnail(interaction.client.user.displayAvatarURL())
			.setFooter({
				text: `${interaction.client.commands.size} commands loaded`,
			})
			.setTimestamp();

		// Sort categories alphabetically for a consistent layout.
		const sorted = [...categories.entries()].sort(([a], [b]) =>
			a.localeCompare(b)
		);

		for (const [category, lines] of sorted) {
			const icon = ICONS[category] ?? "📁";
			const title = `${icon} ${category.charAt(0).toUpperCase() + category.slice(1)}`;
			embed.addFields({
				name: title,
				value: lines.join("\n"),
				inline: false,
			});
		}

		await interaction.reply({ embeds: [embed], ephemeral: true });
	}
}

const cmd = new HelpCommand();
export const data = cmd.data;
export const execute = (i) => cmd.execute(i);
export const meta = cmd.meta;
