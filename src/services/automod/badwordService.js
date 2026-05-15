import { loadGuild, saveGuild } from "#database/schema";

/**
 * Checks whether a message contains any blocked word for the guild.
 *
 * @param {string} guildId
 * @param {string} content  - Raw message content.
 * @returns {string|null}   - The matched word, or null if clean.
 */
export function findBadWord(guildId, content) {
	const db = loadGuild(guildId);
	if (!db.badword.enabled || !db.badword.words.length) return null;

	const lower = content.toLowerCase();
	return db.badword.words.find((w) => lower.includes(w)) ?? null;
}

/**
 * Adds words to the guild's blocklist, ignoring duplicates.
 *
 * @param {string}   guildId
 * @param {string[]} words - Already trimmed and lowercased.
 * @returns {number} Number of new words actually added.
 */
export function addBadWords(guildId, words) {
	const db = loadGuild(guildId);
	const set = new Set(db.badword.words);
	const before = set.size;

	for (const w of words) set.add(w);

	db.badword.words = [...set];
	saveGuild(guildId, db);
	return set.size - before;
}

/**
 * Removes specific words from the blocklist.
 *
 * @param {string}   guildId
 * @param {string[]} words
 * @returns {number} Number of words actually removed.
 */
export function removeBadWords(guildId, words) {
	const db = loadGuild(guildId);
	const before = db.badword.words.length;
	db.badword.words = db.badword.words.filter((w) => !words.includes(w));
	saveGuild(guildId, db);
	return before - db.badword.words.length;
}

/**
 * Enables or disables the badword filter for a guild.
 *
 * @param {string}  guildId
 * @param {boolean} enabled
 */
export function setBadwordEnabled(guildId, enabled) {
	const db = loadGuild(guildId);
	db.badword.enabled = enabled;
	saveGuild(guildId, db);
}

/**
 * Returns the current blocklist for a guild.
 *
 * @param {string} guildId
 * @returns {string[]}
 */
export function getBadWords(guildId) {
	return loadGuild(guildId).badword.words;
}
