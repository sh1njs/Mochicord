/**
 * @fileoverview /kick — Kick a member from the server.
 */
import { CommandBuilder } from "#structures/CommandBuilder";
import { errorEmbed, successEmbed } from "#utils/embeds";
import { PermissionFlagsBits } from "discord.js";

export const { data, execute, meta } = new CommandBuilder()
	.setName("kick")
	.setDescription("Kick a member from the server.")
	.setCategory("moderation")
	.setUsage("/kick <target> [reason]")
	.setGuard("guild")
	.setOptions((builder) =>
		builder
			.addUserOption((opt) =>
				opt
					.setName("target")
					.setDescription("The member to kick.")
					.setRequired(true)
			)
			.addStringOption((opt) =>
				opt.setName("reason").setDescription("Reason for the kick.")
			)
			.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
	)
	.setHandler(async (interaction) => {
		const target = interaction.options.getMember("target");
		const reason =
			interaction.options.getString("reason") ?? "No reason provided.";

		if (!target) {
			return interaction.reply({
				embeds: [errorEmbed("That member is not in this server.")],
				ephemeral: true,
			});
		}

		if (!target.kickable) {
			return interaction.reply({
				embeds: [
					errorEmbed(
						"I can't kick this member. They may have a higher role than me."
					),
				],
				ephemeral: true,
			});
		}

		await target.kick(reason);
		await interaction.reply({
			embeds: [
				successEmbed(
					`**${target.user.username}** has been kicked.\n**Reason:** ${reason}`
				),
			],
		});
	})
	.build();
