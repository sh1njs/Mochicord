import db from "#database";
import { logger } from "#utils/logger";

/**
 * Ensure the server exists in the database. Safe to call on every command.
 * @param {string} guildId
 * @param {string} [guildName]
 * @returns {object}
 */
export function ensureGuildConfig(guildId, guildName = "") {
	const existing = db.servers.get(guildId);
	if (existing) return existing;

	const server = db.servers.set(guildId, { id: guildId, name: guildName });
	db.save();
	return server;
}

/**
 * Add a warning for a user in a guild. Warnings older than 24 h are pruned.
 * @param {string} guildId
 * @param {string} userId
 * @param {string} [userName]
 * @returns {number} Active warning count.
 */
export function addWarning(guildId, userId, userName = "") {
	const now = Date.now();
	const EXPIRY = 24 * 60 * 60 * 1000;

	const existing = db.users.get(userId) ?? {
		id: userId,
		name: userName,
		warnings: [],
	};
	const warnings = (existing.warnings ?? []).filter((t) => now - t < EXPIRY);
	warnings.push(now);

	db.users.set(userId, {
		id: userId,
		name: userName || existing.name,
		warnings,
	});
	db.save();

	logger.debug(
		`Warning added for ${userId} in ${guildId} — total: ${warnings.length}`
	);
	return warnings.length;
}

/**
 * Clear all warnings for a user.
 * @param {string} userId
 */
export function clearWarnings(userId) {
	const user = db.users.get(userId);
	if (!user) return;
	db.users.set(userId, { warnings: [] });
	db.save();
}
