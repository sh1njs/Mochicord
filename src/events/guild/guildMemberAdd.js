import { memberJoinEmbed, sendLog } from "#services/guild/actionlogService";
import { sendWelcomeMessage } from "#services/automod/welcomeService";
import { logger } from "#utils/logger";
import { Events } from "discord.js";

export const name = Events.GuildMemberAdd;

/**
 * Fires when a new member joins a guild.
 * - Sends a welcome message (if enabled + channel set).
 * - Logs the join event to the action log (if enabled + channel set).
 *
 * @param {import('discord.js').GuildMember} member
 */
export async function execute(member) {
  await sendWelcomeMessage(member);

  // Action log — member joined
  const embed = memberJoinEmbed(member);
  await sendLog(member.guild, embed);

  logger.info(`New member joined "${member.guild.name}": ${member.user.tag}`);
}
