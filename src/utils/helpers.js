/**
 * General-purpose utility helpers.
 */

/**
 * Splits a comma-separated string into a trimmed, lowercased, deduplicated array.
 *
 * @param {string} input - Raw comma-separated user input.
 * @returns {string[]}
 */
export function parseCommaSeparated(input) {
	return [
		...new Set(
			input
				.split(",")
				.map((w) => w.trim().toLowerCase())
				.filter(Boolean)
		),
	];
}

/**
 * Replaces welcome message placeholders with their runtime values.
 *
 * @param {string} template - Message template with `{user}`, `{server}`, `{membercount}`.
 * @param {import('discord.js').GuildMember} member - The member who just joined.
 * @returns {string}
 */
export function resolveWelcomeMessage(template, member) {
	return template
		.replace(/{user}/gi, `<@${member.id}>`)
		.replace(/{server}/gi, member.guild.name)
		.replace(/{membercount}/gi, String(member.guild.memberCount));
}

/**
 * Returns a Discord timestamp string (rendered natively in the client).
 *
 * @param {number} ms - Unix timestamp in milliseconds.
 * @param {'t'|'T'|'d'|'D'|'f'|'F'|'R'} [style='R'] - Discord timestamp style.
 * @returns {string}
 */
export function discordTimestamp(ms, style = "R") {
	return `<t:${Math.floor(ms / 1000)}:${style}>`;
}

/**
 * Truncates a string to `maxLength` characters, appending `…` if cut.
 *
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(str, maxLength) {
	return str.length <= maxLength ? str : `${str.slice(0, maxLength - 1)}…`;
}
