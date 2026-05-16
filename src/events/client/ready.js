import { ensureGuildConfig } from "#services/guild/guildService";
import local from "#database/local";
import { logger } from "#utils/logger";
import { ActivityType, Events } from "discord.js";

export const name = Events.ClientReady;
export const once = true;

/**
 * Fires once when the bot successfully connects to Discord.
 * - Initializes the database.
 * - Ensures every cached guild is registered.
 * - Sets the bot's activity status.
 *
 * @param {import('discord.js').Client} client
 */
export async function execute(client) {
  logger.system(`Logged in as ${client.user.tag}`);

  // Initialize database & start auto-save
  await local.initialize();
  local.savePeriodically(10_000);

  // Register every guild the bot is already in
  for (const [guildId, guild] of client.guilds.cache) {
    ensureGuildConfig(guildId, guild.name);
  }

  client.user.setActivity(`/help | ${client.guilds.cache.size} server(s)`, {
    type: ActivityType.Watching,
  });

  logger.system(
    `Ready! Serving ${client.guilds.cache.size} guild(s) with ${client.commands.size} command(s).`,
  );
}
