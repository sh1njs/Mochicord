import { config } from "#config";
import db from "#database";
import { resolveWelcomeMessage } from "#utils/helpers";
import { EmbedBuilder } from "discord.js";

/**
 * Set the welcome channel for a guild.
 * @param {string} guildId
 * @param {string} channelId
 */
export function setWelcomeChannel(guildId, channelId) {
	const existing = db.servers.get(guildId) ?? {};
	db.servers.set(guildId, {
		welcome: { ...(existing.welcome ?? {}), channelId },
	});
	db.save();
}

/**
 * Set the welcome message template for a guild.
 * @param {string} guildId
 * @param {string} message
 */
export function setWelcomeMessage(guildId, message) {
	const existing = db.servers.get(guildId) ?? {};
	db.servers.set(guildId, {
		welcome: { ...(existing.welcome ?? {}), message },
	});
	db.save();
}

/**
 * Enable or disable the welcome system for a guild.
 * @param {string} guildId
 * @param {boolean} enabled
 */
export function setWelcomeEnabled(guildId, enabled) {
	const existing = db.servers.get(guildId) ?? {};
	db.servers.set(guildId, {
		welcome: { ...(existing.welcome ?? {}), enabled },
	});
	db.save();
}

/**
 * Send a welcome message when a member joins.
 * @param {import('discord.js').GuildMember} member
 */
export async function sendWelcomeMessage(member) {
	const server = db.servers.get(member.guild.id);
	if (!server?.welcome?.enabled || !server.welcome.channelId) return;

	const channel = member.guild.channels.cache.get(server.welcome.channelId);
	if (!channel) return;

	const text = resolveWelcomeMessage(server.welcome.message, member);

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
