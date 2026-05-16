import { sendWelcomeMessage } from "#services/automod/welcomeService";
import { logger } from "#utils/logger";
import { Events } from "discord.js";

export const name = Events.GuildMemberAdd;

/**
 * Fires when a new member joins a guild.
 * Delegates to the welcome service which checks if the feature is enabled
 * and sends the configured message.
 *
 * @param {import('discord.js').GuildMember} member
 */
export async function execute(member) {
  await sendWelcomeMessage(member);
  logger.info(`New member joined "${member.guild.name}": ${member.user.tag}`);
}
