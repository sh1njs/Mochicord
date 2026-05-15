import { ensureGuildConfig } from "#services/guild/guildService";
import { logger } from "#utils/logger";
import { ActivityType, Events } from "discord.js";

export const name = Events.ClientReady;
export const once = true;

/**
 * Fires once when the bot successfully connects to Discord.
 * - Sets the bot's activity status.
 * - Ensures every cached guild has a config file.
 *
 * @param {import('discord.js').Client} client
 */
export async function execute(client) {
	logger.system(`Logged in as ${client.user.tag}`);

	// Initialize config for every guild the bot is already in.
	for (const [guildId] of client.guilds.cache) {
		ensureGuildConfig(guildId);
	}

	client.user.setActivity(`/help | ${client.guilds.cache.size} server(s)`, {
		type: ActivityType.Watching,
	});

	logger.system(
		`Ready! Serving ${client.guilds.cache.size} guild(s) with ${client.commands.size} command(s).`
	);
}
