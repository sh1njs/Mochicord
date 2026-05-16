import { Command } from "#structures/Command";
import { errorEmbed, successEmbed } from "#utils/embeds";
import { PermissionFlagsBits } from "discord.js";

/**
 * `/ban` — Permanently bans a member from the server.
 * Requires the invoker to have the BanMembers permission.
 */
class BanCommand extends Command {
  constructor() {
    super("ban", "Permanently ban a member from the server.", {
      category: "moderation",
      usage: "/ban <target> [reason]",
    });

    this.data
      .addUserOption((opt) =>
        opt
          .setName("target")
          .setDescription("The member to ban.")
          .setRequired(true),
      )
      .addStringOption((opt) =>
        opt.setName("reason").setDescription("Reason for the ban."),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);
  }

  /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
  async run(interaction) {
    const target = interaction.options.getUser("target");
    const reason =
      interaction.options.getString("reason") ?? "No reason provided.";

    try {
      await interaction.guild.members.ban(target, { reason });
      await interaction.reply({
        embeds: [
          successEmbed(
            `**${target.username}** has been banned.\n**Reason:** ${reason}`,
          ),
        ],
      });
    } catch {
      await interaction.reply({
        embeds: [
          errorEmbed(
            "Failed to ban this member. Make sure I have sufficient permissions.",
          ),
        ],
        ephemeral: true,
      });
    }
  }
}

const cmd = new BanCommand();
export const data = cmd.data;
export const execute = (i) => cmd.execute(i);
export const meta = cmd.meta;
