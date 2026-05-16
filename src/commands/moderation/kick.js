import { Command } from "#structures/Command";
import { errorEmbed, successEmbed } from "#utils/embeds";
import { PermissionFlagsBits } from "discord.js";

/**
 * `/kick` — Kicks a member from the server.
 * Requires the invoker to have the KickMembers permission.
 */
class KickCommand extends Command {
  constructor() {
    super("kick", "Kick a member from the server.", {
      category: "moderation",
      usage: "/kick <target> [reason]",
    });

    this.data
      .addUserOption((opt) =>
        opt
          .setName("target")
          .setDescription("The member to kick.")
          .setRequired(true),
      )
      .addStringOption((opt) =>
        opt.setName("reason").setDescription("Reason for the kick."),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);
  }

  /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
  async run(interaction) {
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
            "I can't kick this member. They may have a higher role than me.",
          ),
        ],
        ephemeral: true,
      });
    }

    await target.kick(reason);
    await interaction.reply({
      embeds: [
        successEmbed(
          `**${target.user.username}** has been kicked.\n**Reason:** ${reason}`,
        ),
      ],
    });
  }
}

const cmd = new KickCommand();
export const data = cmd.data;
export const execute = (i) => cmd.execute(i);
export const meta = cmd.meta;
