import db from "#database";
import {
	addBadWords,
	getBadWords,
	removeBadWords,
	setBadwordEnabled,
} from "#services/automod/badwordService";
import { CommandBuilder } from "#structures/CommandBuilder";
import { errorEmbed, infoEmbed, successEmbed, warnEmbed } from "#utils/embeds";
import { parseCommaSeparated } from "#utils/helpers";
import {
	ActionRowBuilder,
	ModalBuilder,
	PermissionFlagsBits,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";

export const { data, execute, meta } = new CommandBuilder()
	.setName("badword")
	.setDescription("Configure the bad word filter for this server.")
	.setCategory("automod")
	.setUsage("/badword <enable|disable|set|remove|list>")
	.setGuard("guild")
	.setOptions((builder) =>
		builder
			.addSubcommand((sub) =>
				sub
					.setName("enable")
					.setDescription("Enable the bad word filter.")
			)
			.addSubcommand((sub) =>
				sub
					.setName("disable")
					.setDescription("Disable the bad word filter.")
			)
			.addSubcommand((sub) =>
				sub
					.setName("set")
					.setDescription("Add blocked words via a form.")
			)
			.addSubcommand((sub) =>
				sub
					.setName("remove")
					.setDescription("Remove specific words from the blocklist.")
					.addStringOption((opt) =>
						opt
							.setName("words")
							.setDescription("Comma-separated words to remove.")
							.setRequired(true)
					)
			)
			.addSubcommand((sub) =>
				sub
					.setName("list")
					.setDescription("Show all currently blocked words.")
			)
			.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
	)
	.setHandler(async (interaction) => {
		const sub = interaction.options.getSubcommand();
		const guildId = interaction.guildId;

		switch (sub) {
			case "enable": {
				setBadwordEnabled(guildId, true);
				return interaction.reply({
					embeds: [
						successEmbed("Bad word filter has been **enabled**."),
					],
				});
			}

			case "disable": {
				setBadwordEnabled(guildId, false);
				return interaction.reply({
					embeds: [
						successEmbed("Bad word filter has been **disabled**."),
					],
				});
			}

			case "set": {
				const modal = new ModalBuilder()
					.setCustomId("badword_set_modal")
					.setTitle("Add Blocked Words");
				const input = new TextInputBuilder()
					.setCustomId("badword_input")
					.setLabel("Words to block (comma-separated)")
					.setStyle(TextInputStyle.Paragraph)
					.setPlaceholder("spam, hate, offensive")
					.setRequired(true);
				modal.addComponents(
					new ActionRowBuilder().addComponents(input)
				);
				await interaction.showModal(modal);

				let submitted;
				try {
					submitted = await interaction.awaitModalSubmit({
						filter: (i) =>
							i.customId === "badword_set_modal" &&
							i.user.id === interaction.user.id,
						time: 30_000,
					});
				} catch {
					return;
				}

				const words = parseCommaSeparated(
					submitted.fields.getTextInputValue("badword_input")
				);
				if (!words.length) {
					return submitted.reply({
						embeds: [errorEmbed("No valid words were provided.")],
						ephemeral: true,
					});
				}

				const added = addBadWords(guildId, words);
				await submitted.reply({
					embeds: [
						successEmbed(
							added > 0
								? `Added **${added}** new word(s) to the blocklist.\n${words.map((w) => `\`${w}\``).join(", ")}`
								: "All provided words were already in the blocklist."
						),
					],
					ephemeral: true,
				});
				break;
			}

			case "remove": {
				const words = parseCommaSeparated(
					interaction.options.getString("words")
				);
				const removed = removeBadWords(guildId, words);
				if (removed === 0) {
					return interaction.reply({
						embeds: [
							warnEmbed(
								"None of those words were in the blocklist."
							),
						],
						ephemeral: true,
					});
				}
				return interaction.reply({
					embeds: [
						successEmbed(
							`Removed **${removed}** word(s) from the blocklist.`
						),
					],
					ephemeral: true,
				});
			}

			case "list": {
				const words = getBadWords(guildId);
				const server = db.servers.get(guildId);
				if (!words.length) {
					return interaction.reply({
						embeds: [
							infoEmbed("The blocklist is currently empty."),
						],
						ephemeral: true,
					});
				}
				const status = server?.badword?.enabled
					? "🟢 Enabled"
					: "🔴 Disabled";
				return interaction.reply({
					embeds: [
						infoEmbed(
							words
								.map((w, i) => `\`${i + 1}.\` ${w}`)
								.join("\n"),
							`Bad Word Filter — ${status} (${words.length} words)`
						),
					],
					ephemeral: true,
				});
			}
		}
	})
	.build();
