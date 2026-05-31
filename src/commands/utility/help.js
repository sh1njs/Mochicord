import { config } from "#config";
import { CommandBuilder } from "#structures/CommandBuilder";
import { truncate } from "#utils/helpers";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} from "discord.js";

const ICONS = {
	moderation: "🔨",
	download: "📤",
	utility: "🔧",
	automod: "🛡️",
	owner: "👑",
};

/**
 * @param {string} category
 * @param {string[]} lines
 * @param {import('discord.js').Client} client
 * @param {number} pageIndex
 * @param {number} totalPages
 */
function buildEmbed(category, lines, client, pageIndex, totalPages) {
	const icon = ICONS[category] ?? "📁";
	const title = `${icon} ${category.charAt(0).toUpperCase() + category.slice(1)}`;
	return new EmbedBuilder()
		.setColor(config.color.default)
		.setTitle(`${client.user.username} — ${title}`)
		.setThumbnail(client.user.displayAvatarURL())
		.setDescription(lines.join("\n"))
		.setFooter({
			text: `Page ${pageIndex + 1} of ${totalPages} · ${client.commands.size} commands loaded`,
		})
		.setTimestamp();
}

/**
 * @param {number} pageIndex
 * @param {number} totalPages
 * @param {string} uid
 */
function buildRow(pageIndex, totalPages, uid) {
	return new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId(`help_prev_${uid}`)
			.setLabel("◀ Prev")
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(pageIndex === 0),
		new ButtonBuilder()
			.setCustomId(`help_next_${uid}`)
			.setLabel("Next ▶")
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(pageIndex === totalPages - 1)
	);
}

export const { data, execute, meta } = new CommandBuilder()
	.setName("help")
	.setDescription("Show all available commands grouped by category.")
	.setCategory("utility")
	.setUsage("/help")
	.setHandler(async (interaction) => {
		const categories = new Map();

		for (const [, command] of interaction.client.commands) {
			const category = command.meta?.category ?? "misc";
			if (!categories.has(category)) categories.set(category, []);
			const usage = command.meta?.usage ?? `/${command.data.name}`;
			categories
				.get(category)
				.push(
					`\`${usage}\` — ${truncate(command.data.description, 60)}`
				);
		}

		const pages = [...categories.entries()].sort(([a], [b]) =>
			a.localeCompare(b)
		);

		if (!pages.length) {
			return interaction.reply({
				content: "No commands found.",
				ephemeral: true,
			});
		}

		let currentPage = 0;
		const uid = interaction.id;

		const reply = await interaction.reply({
			embeds: [
				buildEmbed(
					pages[0][0],
					pages[0][1],
					interaction.client,
					0,
					pages.length
				),
			],
			components: [buildRow(0, pages.length, uid)],
			ephemeral: true,
			fetchReply: true,
		});

		const collector = reply.createMessageComponentCollector({
			filter: (btn) =>
				btn.user.id === interaction.user.id &&
				(btn.customId === `help_prev_${uid}` ||
					btn.customId === `help_next_${uid}`),
			time: 120_000,
		});

		collector.on("collect", async (btn) => {
			if (btn.customId === `help_next_${uid}`) currentPage++;
			else if (btn.customId === `help_prev_${uid}`) currentPage--;
			await btn.update({
				embeds: [
					buildEmbed(
						pages[currentPage][0],
						pages[currentPage][1],
						interaction.client,
						currentPage,
						pages.length
					),
				],
				components: [buildRow(currentPage, pages.length, uid)],
			});
		});

		collector.on("end", async () => {
			const disabledRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`help_prev_${uid}_done`)
					.setLabel("◀ Prev")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(true),
				new ButtonBuilder()
					.setCustomId(`help_next_${uid}_done`)
					.setLabel("Next ▶")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(true)
			);
			await interaction
				.editReply({ components: [disabledRow] })
				.catch(() => {});
		});
	})
	.build();
