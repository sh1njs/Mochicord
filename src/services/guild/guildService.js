import local from "#database/local";
import { logger } from "#utils/logger";

/**
 * Ensure the server is registered in the database.
 * Call this when the bot joins a new server or at startup.
 *
 * @param {string} guildId
 * @param {string} [guildName]
 * @returns {object} Data server
 */
export function ensureGuildConfig(guildId, guildName = "") {
  const existing = local.servers.get(guildId);
  if (existing) return existing;

  const server = local.servers.set(guildId, { id: guildId, name: guildName });
  local.save();
  return server;
}

/**
 * Adds a warning timestamp for the user and returns the number of active warnings.
 * Warnings older than 24 hours are automatically truncated.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {string} [userName]
 * @returns {number} Number of active warnings.
 */
export function addWarning(guildId, userId, userName = "") {
  const now = Date.now();
  const EXPIRY = 24 * 60 * 60 * 1000;

  // Make sure the user exists in the database, then retrieve the data
  local.users.set(userId, { id: userId, name: userName });
  const user = local.users.get(userId);

  if (!user.warnings) user.warnings = [];
  user.warnings.push(now);
  user.warnings = user.warnings.filter((t) => now - t < EXPIRY);

  local.save();

  logger.debug(
    `Warning added for user ${userId} in guild ${guildId} — total: ${user.warnings.length}`,
  );
  return user.warnings.length;
}

/**
 * Removes all warnings for the user.
 *
 * @param {string} userId
 */
export function clearWarnings(userId) {
  const user = local.users.get(userId);
  if (!user) return;

  user.warnings = [];
  local.save();
}
