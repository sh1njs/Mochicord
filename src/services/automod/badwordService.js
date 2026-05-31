import db from "#database";

/**
 * Check if a message contains a blocked word for the guild.
 * @param {string} guildId
 * @param {string} content
 * @returns {string|null} The matched word, or null if clean.
 */
export function findBadWord(guildId, content) {
	const server = db.servers.get(guildId);
	if (!server?.badword?.enabled || !server.badword.words.length) return null;
	const lower = content.toLowerCase();
	return server.badword.words.find((w) => lower.includes(w)) ?? null;
}

/**
 * Add words to the guild blocklist, ignoring duplicates.
 * @param {string} guildId
 * @param {string[]} words
 * @returns {number} Number of new words added.
 */
export function addBadWords(guildId, words) {
	const existing = db.servers.get(guildId) ?? {};
	const current = existing.badword?.words ?? [];
	const set = new Set(current);
	const before = set.size;
	for (const w of words) set.add(w.toLowerCase().trim());
	const updated = [...set];
	db.servers.set(guildId, {
		badword: { ...(existing.badword ?? {}), words: updated },
	});
	db.save();
	return set.size - before;
}

/**
 * Remove words from the guild blocklist.
 * @param {string} guildId
 * @param {string[]} words
 * @returns {number} Number of words removed.
 */
export function removeBadWords(guildId, words) {
	const existing = db.servers.get(guildId) ?? {};
	const current = existing.badword?.words ?? [];
	const filtered = current.filter((w) => !words.includes(w));
	db.servers.set(guildId, {
		badword: { ...(existing.badword ?? {}), words: filtered },
	});
	db.save();
	return current.length - filtered.length;
}

/**
 * Enable or disable the bad word filter for a guild.
 * @param {string} guildId
 * @param {boolean} enabled
 */
export function setBadwordEnabled(guildId, enabled) {
	const existing = db.servers.get(guildId) ?? {};
	db.servers.set(guildId, {
		badword: { ...(existing.badword ?? {}), enabled },
	});
	db.save();
}

/**
 * Get the current blocklist for a guild.
 * @param {string} guildId
 * @returns {string[]}
 */
export function getBadWords(guildId) {
	return db.servers.get(guildId)?.badword?.words ?? [];
}
