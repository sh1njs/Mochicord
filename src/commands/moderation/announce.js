/**
 * @fileoverview /announce — Send a formatted announcement embed to the current channel.
 * Uses CommandBuilder + admin guard. Prompts for both title and message.
 */
import { CommandBuilder } from "#structures/CommandBuilder";
import { announcementEmbed, errorEmbed } from "#utils/embeds";
import { checkBotPermissions } from "#utils/permissions";
import { PermissionFlagsBits } from "discord.js";

export const { data, execute, meta } = new CommandBuilder()
	.setName("announce")
	.setDescription("Send an official announcement to this channel.")
	.setCategory("moderation")
	.setUsage("/announce <title> <message>")
	.setGuard("guild", "admin")
	.setOptions((builder) =>
		builder
			.addStringOption((opt) =>
				opt
					.setName("title")
					.setDescription(
						"Announcement title (e.g. Server Update, Event Alert)."
					)
					.setRequired(true)
			)
			.addStringOption((opt) =>
				opt
					.setName("message")
					.setDescription("The full announcement content.")
					.setRequired(true)
			)
			.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	)
	.setHandler(async (interaction) => {
		const ok = await checkBotPermissions(interaction);
		if (!ok) return;

		const title = interaction.options.getString("title");
		const message = interaction.options.getString("message");

		try {
			await interaction.channel.send({
				embeds: [
					announcementEmbed(
						title,
						message,
						interaction.guild,
						interaction.user
					),
				],
			});
			await interaction.reply({
				content: "✅ Announcement sent.",
				ephemeral: true,
			});
		} catch {
			await interaction.reply({
				embeds: [
					errorEmbed(
						"Failed to send the announcement. Check my channel permissions."
					),
				],
				ephemeral: true,
			});
		}
	})
	.build();
