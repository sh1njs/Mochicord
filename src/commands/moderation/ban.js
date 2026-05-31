/**
 * @fileoverview /ban — Permanently ban a member from the server.
 */
import { CommandBuilder } from "#structures/CommandBuilder";
import { errorEmbed, successEmbed } from "#utils/embeds";
import { PermissionFlagsBits } from "discord.js";

export const { data, execute, meta } = new CommandBuilder()
	.setName("ban")
	.setDescription("Permanently ban a member from the server.")
	.setCategory("moderation")
	.setUsage("/ban <target> [reason]")
	.setGuard("guild")
	.setOptions((builder) =>
		builder
			.addUserOption((opt) =>
				opt
					.setName("target")
					.setDescription("The member to ban.")
					.setRequired(true)
			)
			.addStringOption((opt) =>
				opt.setName("reason").setDescription("Reason for the ban.")
			)
			.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	)
	.setHandler(async (interaction) => {
		const target = interaction.options.getUser("target");
		const reason =
			interaction.options.getString("reason") ?? "No reason provided.";

		try {
			await interaction.guild.members.ban(target, { reason });
			await interaction.reply({
				embeds: [
					successEmbed(
						`**${target.username}** has been banned.\n**Reason:** ${reason}`
					),
				],
			});
		} catch {
			await interaction.reply({
				embeds: [
					errorEmbed(
						"Failed to ban this member. Make sure I have sufficient permissions."
					),
				],
				ephemeral: true,
			});
		}
	})
	.build();
