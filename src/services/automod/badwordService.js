import db from "#database/MochiDB";

/**
 * Checks if a message contains a forbidden word on the server.
 *
 * @param {string} guildId
 * @param {string} content - The raw message content.
 * @returns {string|null} - The matching word, or null if clean.
 */
export function findBadWord(guildId, content) {
  const server = db.servers.get(guildId);
  if (!server?.badword?.enabled || !server.badword.words.length) return null;

  const lower = content.toLowerCase();
  return server.badword.words.find((w) => lower.includes(w)) ?? null;
}

/**
 * Adds a word to the server's blocklist, ignoring duplicates.
 *
 * @param {string} guildId
 * @param {string[]} words - Trimmed and lowercased.
 * @returns {number} The number of new words successfully added.
 */
export function addBadWords(guildId, words) {
  const server = db.servers.set(guildId, {});
  const set = new Set(server.badword.words);
  const before = set.size;

  for (const w of words) set.add(w);

  server.badword.words = [...set];
  db.save();
  return set.size - before;
}

/**
 * Removes the specified word from the block list.
 *
 * @param {string} guildId
 * @param {string[]} words
 * @returns {number} The number of words successfully removed.
 */
export function removeBadWords(guildId, words) {
  const server = db.servers.set(guildId, {});
  const before = server.badword.words.length;
  server.badword.words = server.badword.words.filter((w) => !words.includes(w));
  db.save();
  return before - server.badword.words.length;
}

/**
 * Enables or disables the badword filter for the server.
 *
 * @param {string} guildId
 * @param {boolean} enabled
 */
export function setBadwordEnabled(guildId, enabled) {
  const server = db.servers.set(guildId, {});
  server.badword.enabled = enabled;
  db.save();
}

/**
 * Returns the current server's banned words list.
 *
 * @param {string} guildId
 * @returns {string[]}
 */
export function getBadWords(guildId) {
  return db.servers.get(guildId)?.badword?.words ?? [];
}
