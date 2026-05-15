import { ensureGuildConfig } from "#services/guild/guildService";
import { logger } from "#utils/logger";
import { Events } from "discord.js";

export const name = Events.GuildCreate;

/**
 * Fires when the bot joins a new guild.
 * Automatically creates a default config file for that guild.
 *
 * @param {import('discord.js').Guild} guild
 */
export async function execute(guild) {
	ensureGuildConfig(guild.id);
	logger.system(
		`Joined new guild: "${guild.name}" (${guild.id}) — config initialized.`
	);
}
