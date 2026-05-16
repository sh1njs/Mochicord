import local from "#database/local";
import {
  setWelcomeChannel,
  setWelcomeEnabled,
  setWelcomeMessage,
} from "#services/automod/welcomeService";
import { Command } from "#structures/Command";
import { WELCOME_PLACEHOLDERS } from "#utils/constants";
import { infoEmbed, successEmbed } from "#utils/embeds";
import {
  ActionRowBuilder,
  ChannelType,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

/**
 * `/welcome` — Configure the per-guild welcome system.
 * Subcommands: enable | disable | setchannel | setmessage
 *
 * Requires ManageGuild permission.
 */
class WelcomeCommand extends Command {
  constructor() {
    super("welcome", "Configure the welcome message system for this server.", {
      category: "automod",
      usage: "/welcome <enable|disable|setchannel|setmessage>",
    });

    this.data
      .addSubcommand((sub) =>
        sub.setName("enable").setDescription("Enable the welcome system."),
      )
      .addSubcommand((sub) =>
        sub.setName("disable").setDescription("Disable the welcome system."),
      )
      .addSubcommand((sub) =>
        sub
          .setName("setchannel")
          .setDescription("Set the channel where welcome messages are sent.")
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
          .setName("setmessage")
          .setDescription("Customize the welcome message via a form."),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
  }

  /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
  async run(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    switch (sub) {
      case "enable": {
        setWelcomeEnabled(guildId, true);
        return interaction.reply({
          embeds: [successEmbed("Welcome system has been **enabled**.")],
        });
      }

      case "disable": {
        setWelcomeEnabled(guildId, false);
        return interaction.reply({
          embeds: [successEmbed("Welcome system has been **disabled**.")],
        });
      }

      case "setchannel": {
        const channel = interaction.options.getChannel("channel");
        setWelcomeChannel(guildId, channel.id);
        return interaction.reply({
          embeds: [successEmbed(`Welcome channel set to ${channel}.`)],
        });
      }

      case "setmessage": {
        const server = local.servers.get(guildId);

        // Show a pre-filled modal with the current message template.
        const modal = new ModalBuilder()
          .setCustomId("welcome_msg_modal")
          .setTitle("Set Welcome Message");

        const input = new TextInputBuilder()
          .setCustomId("welcome_message_input")
          .setLabel(`Placeholders: ${WELCOME_PLACEHOLDERS.join(" ")}`)
          .setStyle(TextInputStyle.Paragraph)
          .setValue(server?.welcome?.message ?? "")
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);

        let submitted;
        try {
          submitted = await interaction.awaitModalSubmit({
            filter: (i) =>
              i.customId === "welcome_msg_modal" &&
              i.user.id === interaction.user.id,
            time: 60_000,
          });
        } catch {
          return; // Dismissed or timed out.
        }

        const message = submitted.fields.getTextInputValue(
          "welcome_message_input",
        );
        setWelcomeMessage(guildId, message);

        await submitted.reply({
          embeds: [
            successEmbed(
              `Welcome message updated!\n\n**Preview:**\n${message}`,
            ).setFooter({
              text: `Placeholders will be replaced when a member joins.`,
            }),
          ],
          ephemeral: true,
        });
        break;
      }

      default: {
        const server = local.servers.get(guildId);
        const status = server?.welcome?.enabled ? "🟢 Enabled" : "🔴 Disabled";
        const ch = server?.welcome?.channelId
          ? `<#${server.welcome.channelId}>`
          : "*not set*";

        return interaction.reply({
          embeds: [
            infoEmbed(
              `**Status:** ${status}\n**Channel:** ${ch}\n**Message:** ${server?.welcome?.message ?? "*not set*"}`,
              "Welcome System Settings",
            ),
          ],
          ephemeral: true,
        });
      }
    }
  }
}

const cmd = new WelcomeCommand();
export const data = cmd.data;
export const execute = (i) => cmd.execute(i);
export const meta = cmd.meta;
