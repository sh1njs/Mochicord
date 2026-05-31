import db from "#database/index";
import { logger } from "#utils/logger";
import { Events } from "discord.js";

export const name = Events.GuildDelete;

/**
 * Fires when the bot is removed from a guild.
 * Automatically removes the guild from the database.
 *
 * @param {import('discord.js').Guild} guild
 */
export async function execute(guild) {
	db.servers.delete(guild.id);
	logger.system(
		`Removed from guild: "${guild.name}" (${guild.id}) — database entry deleted.`
	);
}
