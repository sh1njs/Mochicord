import { Command } from "#structures/Command";
import { announcementEmbed, errorEmbed } from "#utils/embeds";
import { checkBotPermissions } from "#utils/permissions";
import { PermissionFlagsBits } from "discord.js";

/**
 * `/announce` — Sends a formatted announcement embed to the current channel.
 * Requires the invoker to have the Administrator permission.
 */
class AnnounceCommand extends Command {
  constructor() {
    super("announce", "Send an official announcement to this channel.", {
      category: "moderation",
      usage: "/announce <message>",
    });

    this.data
      .addStringOption((opt) =>
        opt
          .setName("message")
          .setDescription("The announcement content.")
          .setRequired(true),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
  }

  /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
  async run(interaction) {
    const ok = await checkBotPermissions(interaction);
    if (!ok) return;

    const message = interaction.options.getString("message");

    try {
      await interaction.channel.send({
        embeds: [
          announcementEmbed(message, interaction.guild, interaction.user),
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
            "Failed to send the announcement. Check my channel permissions.",
          ),
        ],
        ephemeral: true,
      });
    }
  }
}

const cmd = new AnnounceCommand();
export const data = cmd.data;
export const execute = (i) => cmd.execute(i);
export const meta = cmd.meta;
