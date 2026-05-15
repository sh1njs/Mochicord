import { config } from "#config";
import { EmbedBuilder } from "discord.js";

/**
 * Factory functions for common embed styles.
 * Always use these instead of creating raw EmbedBuilders in commands.
 */

/**
 * Standard informational embed.
 * @param {string} description
 * @param {string} [title]
 * @returns {EmbedBuilder}
 */
export function infoEmbed(description, title) {
	const embed = new EmbedBuilder()
		.setColor(config.color.info)
		.setDescription(description)
		.setTimestamp();
	if (title) embed.setTitle(title);
	return embed;
}

/**
 * Success embed (green).
 * @param {string} description
 * @param {string} [title]
 * @returns {EmbedBuilder}
 */
export function successEmbed(description, title) {
	const embed = new EmbedBuilder()
		.setColor(config.color.success)
		.setDescription(`✅  ${description}`)
		.setTimestamp();
	if (title) embed.setTitle(title);
	return embed;
}

/**
 * Error embed (red).
 * @param {string} description
 * @param {string} [title]
 * @returns {EmbedBuilder}
 */
export function errorEmbed(description, title) {
	const embed = new EmbedBuilder()
		.setColor(config.color.error)
		.setDescription(`❌  ${description}`)
		.setTimestamp();
	if (title) embed.setTitle(title);
	return embed;
}

/**
 * Warning embed (yellow).
 * @param {string} description
 * @param {string} [title]
 * @returns {EmbedBuilder}
 */
export function warnEmbed(description, title) {
	const embed = new EmbedBuilder()
		.setColor(config.color.warning)
		.setDescription(`⚠️  ${description}`)
		.setTimestamp();
	if (title) embed.setTitle(title);
	return embed;
}

/**
 * Branded announcement embed with guild icon.
 * @param {string} description
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').User} author
 * @returns {EmbedBuilder}
 */
export function announcementEmbed(description, guild, author) {
	return new EmbedBuilder()
		.setColor(config.color.default)
		.setTitle("📢  Server Announcement")
		.setDescription(description)
		.setThumbnail(guild.iconURL({ dynamic: true }))
		.setFooter({ text: guild.name, iconURL: author.displayAvatarURL() })
		.setTimestamp();
}
