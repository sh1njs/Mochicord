import { ChannelType, PermissionFlagsBits } from "discord.js";
import {
  setActionlogChannel,
  setActionlogEnabled,
} from "#services/guild/actionlogService";
import { ensureGuildConfig } from "#services/guild/guildService";
import { Command } from "#structures/Command";
import db from "#database/MochiDB";
import { errorEmbed, infoEmbed, successEmbed } from "#utils/embeds";

/**
 * `/actionlog` — Configure the per-guild action log system.
 * Subcommands: enable | disable | setchannel | status
 *
 * Requires ManageGuild permission.
 * Channel must be set before enabling.
 */
class ActionlogCommand extends Command {
  constructor() {
    super("actionlog", "Configure the action log system for this server.", {
      category: "utility",
      usage: "/actionlog <enable|disable|setchannel|status>",
    });

    this.data
      .addSubcommand((sub) =>
        sub.setName("enable").setDescription("Enable the action log."),
      )
      .addSubcommand((sub) =>
        sub.setName("disable").setDescription("Disable the action log."),
      )
      .addSubcommand((sub) =>
        sub
          .setName("setchannel")
          .setDescription("Set the channel where action logs are sent.")
          .addChannelOption((opt) =>
            opt
              .setName("channel")
              .setDescription("The text channel to use.")
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("status")
          .setDescription("Show current action log settings."),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
  }

  /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
  async run(interaction) {
    const sub = interaction.options.getSubcommand();
    const { guildId, guild } = interaction;

    ensureGuildConfig(guildId, guild.name);

    const server = db.servers.get(guildId);

    switch (sub) {
      case "enable": {
        if (!server.actionlog?.channelId) {
          return interaction.reply({
            embeds: [
              errorEmbed(
                "You need to set a log channel first!\nUse `/actionlog setchannel #channel` before enabling.",
              ),
            ],
            ephemeral: true,
          });
        }
        setActionlogEnabled(guildId, true);
        return interaction.reply({
          embeds: [
            successEmbed(
              `Action log has been **enabled**.\nLogs will be sent to <#${server.actionlog.channelId}>.`,
            ),
          ],
        });
      }

      case "disable": {
        setActionlogEnabled(guildId, false);
        return interaction.reply({
          embeds: [successEmbed("Action log has been **disabled**.")],
        });
      }

      case "setchannel": {
        const channel = interaction.options.getChannel("channel");
        setActionlogChannel(guildId, channel.id);
        return interaction.reply({
          embeds: [
            successEmbed(
              `Action log channel set to ${channel}.\nUse \`/actionlog enable\` to activate it.`,
            ),
          ],
        });
      }

      case "status":
      default: {
        const status = server.actionlog?.enabled ? "🟢 Enabled" : "🔴 Disabled";
        const ch = server.actionlog?.channelId
          ? `<#${server.actionlog.channelId}>`
          : "*not set — use `/actionlog setchannel` first*";

        const logged = [
          "🗑️ Message deleted",
          "✏️ Message edited",
          "📥 Member joined",
          "📤 Member left",
          "🔊 Voice join/leave/move",
          "😄 Emoji added/removed",
          "🎨 Sticker added/removed",
        ].join("\n");

        return interaction.reply({
          embeds: [
            infoEmbed(
              `**Status:** ${status}\n**Channel:** ${ch}\n\n**Logged Events:**\n${logged}`,
              "Action Log Settings",
            ),
          ],
          ephemeral: true,
        });
      }
    }
  }
}

const cmd = new ActionlogCommand();
export const data = cmd.data;
export const execute = (i) => cmd.execute(i);
export const meta = cmd.meta;
