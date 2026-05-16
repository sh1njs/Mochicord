import { ensureGuildConfig } from "#services/guild/guildService";
import { logger } from "#utils/logger";
import { Events } from "discord.js";

export const name = Events.GuildCreate;

/**
 * Fires when the bot joins a new guild.
 * Automatically registers the guild in the database.
 *
 * @param {import('discord.js').Guild} guild
 */
export async function execute(guild) {
  ensureGuildConfig(guild.id, guild.name);
  logger.system(
    `Joined new guild: "${guild.name}" (${guild.id}) — config initialized.`,
  );
}
