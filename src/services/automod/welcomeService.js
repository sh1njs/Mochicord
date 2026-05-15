import { EmbedBuilder } from 'discord.js';
import { loadGuild, saveGuild } from "#database/schema";
import { resolveWelcomeMessage } from "#utils/helpers";
import { config } from "#config";

/**
 * Sets the welcome channel for a guild.
 *
 * @param {string} guildId
 * @param {string} channelId
 */
export function setWelcomeChannel(guildId, channelId) {
	const db = loadGuild(guildId);
	db.welcome.channelId = channelId;
	saveGuild(guildId, db);
}

/**
 * Sets the custom welcome message template for a guild.
 *
 * @param {string} guildId
 * @param {string} message - Raw template with placeholders.
 */
export function setWelcomeMessage(guildId, message) {
	const db = loadGuild(guildId);
	db.welcome.message = message;
	saveGuild(guildId, db);
}

/**
 * Enables or disables the welcome system for a guild.
 *
 * @param {string}	guildId
 * @param {boolean} enabled
 */
export function setWelcomeEnabled(guildId, enabled) {
	const db = loadGuild(guildId);
	db.welcome.enabled = enabled;
	saveGuild(guildId, db);
}

/**
 * Sends the configured welcome message when a member joins.
 * Does nothing if the system is disabled or the channel is not found.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {Promise<void>}
 */
export async function sendWelcomeMessage(member) {
	const db = loadGuild(member.guild.id);
	if (!db.welcome.enabled || !db.welcome.channelId) return;

	const channel = member.guild.channels.cache.get(db.welcome.channelId);
	if (!channel) return;

	const text = resolveWelcomeMessage(db.welcome.message, member);

	const embed = new EmbedBuilder()
		.setColor(config.color.default)
		.setDescription(text)
		.setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
		.setFooter({
			text: member.guild.name,
			iconURL: member.guild.iconURL({ dynamic: true }),
		})
		.setTimestamp();

	await channel.send({ embeds: [embed] }).catch(() => {});
}