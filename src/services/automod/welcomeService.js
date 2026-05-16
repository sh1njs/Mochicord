import local from "#database/local";
import { config } from "#config";
import { resolveWelcomeMessage } from "#utils/helpers";
import { EmbedBuilder } from "discord.js";

/**
 * Sets the welcome channel for the server.
 *
 * @param {string} guildId
 * @param {string} channelId
 */
export function setWelcomeChannel(guildId, channelId) {
  const server = local.servers.set(guildId, {});
  server.welcome.channelId = channelId;
  local.save();
}

/**
 * Sets the welcome message template for the server.
 *
 * @param {string} guildId
 * @param {string} message - Raw template with placeholders.
 */
export function setWelcomeMessage(guildId, message) {
  const server = local.servers.set(guildId, {});
  server.welcome.message = message;
  local.save();
}

/**
 * Enable or disable the welcome system for the server.
 *
 * @param {string} guildId
 * @param {boolean} enabled
 */
export function setWelcomeEnabled(guildId, enabled) {
  const server = local.servers.set(guildId, {});
  server.welcome.enabled = enabled;
  local.save();
}

/**
 * Sends a welcome message when a new member joins.
 * Does nothing if the system is disabled or the channel is not found.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {Promise<void>}
 */
export async function sendWelcomeMessage(member) {
  const server = local.servers.get(member.guild.id);
  if (!server?.welcome?.enabled || !server.welcome.channelId) return;

  const channel = member.guild.channels.cache.get(server.welcome.channelId);
  if (!channel) return;

  const text = resolveWelcomeMessage(server.welcome.message, member);

  const embed = new EmbedBuilder()
    .setColor(config.color.default)
    .setDescription(text)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setFooter({
      text: member.guild.name,
      iconURL: member.guild.iconURL({ dynamic: true }),
    })
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(() => {});
}
