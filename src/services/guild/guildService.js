import { loadGuild, saveGuild } from "#database/schema";
import { logger } from "#utils/logger";

/**
 * Ensures a guild config file exists and is up-to-date.
 * Call this whenever the bot joins a new guild or on startup.
 *
 * @param {string} guildId
 * @returns {import('#database/schema').GuildConfig}
 */
export function ensureGuildConfig(guildId) {
	return loadGuild(guildId);
}

/**
 * Adds a warning timestamp for a user and returns their current active count.
 * Warnings older than 24 hours are automatically pruned.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {number} Active warning count.
 */
export function addWarning(guildId, userId) {
	const db = loadGuild(guildId);
	const now = Date.now();
	const EXPIRY = 24 * 60 * 60 * 1000;

	if (!db.warnings[userId]) db.warnings[userId] = [];
	db.warnings[userId].push(now);
	db.warnings[userId] = db.warnings[userId].filter((t) => now - t < EXPIRY);

	saveGuild(guildId, db);
	logger.debug(
		`Warning added for user ${userId} in guild ${guildId} — total: ${db.warnings[userId].length}`
	);
	return db.warnings[userId].length;
}

/**
 * Resets all warnings for a user in a guild.
 *
 * @param {string} guildId
 * @param {string} userId
 */
export function clearWarnings(guildId, userId) {
	const db = loadGuild(guildId);
	db.warnings[userId] = [];
	saveGuild(guildId, db);
}
