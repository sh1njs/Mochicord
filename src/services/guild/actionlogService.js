import db from "#database";
import { EmbedBuilder } from "discord.js";

/**
 * Returns the configured log channel for the guild, or null if not set/enabled.
 * @param {import('discord.js').Guild} guild
 * @returns {import('discord.js').TextChannel|null}
 */
export function getLogChannel(guild) {
	const server = db.servers.get(guild.id);
	if (!server?.actionlog?.enabled || !server.actionlog.channelId) return null;
	return guild.channels.cache.get(server.actionlog.channelId) ?? null;
}

/**
 * Send an embed to the guild's action log channel.
 * @param {import('discord.js').Guild} guild
 * @param {EmbedBuilder} embed
 */
export async function sendLog(guild, embed) {
	const channel = getLogChannel(guild);
	if (!channel) return;
	await channel.send({ embeds: [embed] }).catch(() => {});
}

/**
 * Enable or disable the action log for a guild.
 * @param {string} guildId
 * @param {boolean} enabled
 */
export function setActionlogEnabled(guildId, enabled) {
	const existing = db.servers.get(guildId) ?? {};
	const actionlog = { ...(existing.actionlog ?? {}), enabled };
	db.servers.set(guildId, { actionlog });
	db.save();
}

/**
 * Set the action log channel for a guild.
 * @param {string} guildId
 * @param {string} channelId
 */
export function setActionlogChannel(guildId, channelId) {
	const existing = db.servers.get(guildId) ?? {};
	const actionlog = { ...(existing.actionlog ?? {}), channelId };
	db.servers.set(guildId, { actionlog });
	db.save();
}

/** @param {import('discord.js').Message} message */
export function messageDeleteEmbed(message) {
	const embed = new EmbedBuilder()
		.setColor(0xed4245)
		.setAuthor({
			name: "Message Deleted",
			iconURL: message.author.displayAvatarURL({ dynamic: true }),
		})
		.setDescription(
			`${message.author} deleted a message in ${message.channel}\n\n` +
				(message.content?.slice(0, 1024) || "*[no text content]*")
		)
		.setFooter({ text: `User ID: ${message.author.id}` })
		.setTimestamp();

	if (message.attachments.size > 0) {
		embed.addFields({
			name: "Attachments",
			value: message.attachments
				.map((a) => a.url)
				.join("\n")
				.slice(0, 1024),
		});
	}

	return embed;
}

/**
 * @param {import('discord.js').Message} oldMessage
 * @param {import('discord.js').Message} newMessage
 */
export function messageUpdateEmbed(oldMessage, newMessage) {
	return new EmbedBuilder()
		.setColor(0xfee75c)
		.setAuthor({
			name: "Message Edited",
			iconURL: newMessage.author.displayAvatarURL({ dynamic: true }),
		})
		.setDescription(
			`${newMessage.author} edited a message in ${newMessage.channel}`
		)
		.addFields(
			{
				name: "Before",
				value: oldMessage.content?.slice(0, 1024) || "*[no text]*",
			},
			{
				name: "After",
				value: newMessage.content?.slice(0, 1024) || "*[no text]*",
			}
		)
		.setFooter({ text: `Message ID: ${newMessage.id}` })
		.setTimestamp();
}

/** @param {import('discord.js').GuildMember} member */
export function memberJoinEmbed(member) {
	const ms = Date.now() - member.user.createdTimestamp;
	const days = Math.floor(ms / 86_400_000);
	const parts = [];
	const years = Math.floor(days / 365);
	const months = Math.floor((days % 365) / 30);
	const rem = days % 30;
	if (years) parts.push(`${years} year`);
	if (months) parts.push(`${months} months`);
	if (rem) parts.push(`${rem} days`);

	return new EmbedBuilder()
		.setColor(0x57f287)
		.setAuthor({
			name: "Member Joined",
			iconURL: member.user.displayAvatarURL({ dynamic: true }),
		})
		.setDescription(`${member} (${member.user.tag}) joined the server`)
		.addFields({
			name: "Account Age",
			value: parts.join(" ▪︎ ") || "< 1 day",
			inline: true,
		})
		.setFooter({ text: `User ID: ${member.id}` })
		.setTimestamp();
}

/** @param {import('discord.js').GuildMember} member */
export function memberLeaveEmbed(member) {
	return new EmbedBuilder()
		.setColor(0xed4245)
		.setAuthor({
			name: "Member Left",
			iconURL: member.user.displayAvatarURL({ dynamic: true }),
		})
		.setDescription(`${member} (${member.user.tag}) left the server`)
		.setFooter({ text: `User ID: ${member.id}` })
		.setTimestamp();
}

/**
 * @param {import('discord.js').VoiceState} oldState
 * @param {import('discord.js').VoiceState} newState
 * @param {import('discord.js').GuildMember} member
 */
export function voiceStateEmbed(oldState, newState, member) {
	const oldCh = oldState.channel;
	const newCh = newState.channel;
	let title, color, description;

	if (!oldCh && newCh) {
		title = "Joined Voice";
		color = 0x57f287;
		description = `${member} joined **${newCh.name}**`;
	} else if (oldCh && !newCh) {
		title = "Left Voice";
		color = 0xed4245;
		description = `${member} left **${oldCh.name}**`;
	} else if (oldCh && newCh && oldCh.id !== newCh.id) {
		title = "Moved Voice Channel";
		color = 0xfee75c;
		description = `${member} moved from **${oldCh.name}** → **${newCh.name}**`;
	} else {
		const changes = [];
		if (oldState.mute !== newState.mute)
			changes.push(
				newState.mute ? "🔇 Server muted" : "🔊 Server unmuted"
			);
		if (oldState.deaf !== newState.deaf)
			changes.push(
				newState.deaf ? "🙉 Server deafened" : "👂 Server undeafened"
			);
		if (oldState.selfMute !== newState.selfMute)
			changes.push(
				newState.selfMute ? "🎤 Self-muted" : "🎤 Self-unmuted"
			);
		if (oldState.selfDeaf !== newState.selfDeaf)
			changes.push(
				newState.selfDeaf ? "🎧 Self-deafened" : "🎧 Self-undeafened"
			);
		if (oldState.streaming !== newState.streaming)
			changes.push(
				newState.streaming
					? "📡 Started streaming"
					: "📡 Stopped streaming"
			);
		if (!changes.length) return null;
		title = "Voice State Changed";
		color = 0x5865f2;
		description = `${member} in **${newCh?.name ?? oldCh?.name ?? "Unknown"}**\n${changes.join("\n")}`;
	}

	return new EmbedBuilder()
		.setColor(color)
		.setAuthor({
			name: title,
			iconURL: member.user.displayAvatarURL({ dynamic: true }),
		})
		.setDescription(description)
		.setFooter({ text: `User ID: ${member.id}` })
		.setTimestamp();
}

/** @param {import('discord.js').GuildEmoji} emoji */
export function emojiCreateEmbed(emoji) {
	return new EmbedBuilder()
		.setColor(0x57f287)
		.setAuthor({
			name: emoji.guild.name,
			iconURL: emoji.guild.iconURL({ dynamic: true }),
		})
		.setTitle("😄  Emoji Added")
		.setThumbnail(emoji.url)
		.addFields(
			{ name: "Name", value: `:${emoji.name}:`, inline: true },
			{
				name: "Animated",
				value: emoji.animated ? "Yes" : "No",
				inline: true,
			}
		)
		.setFooter({ text: `Emoji ID: ${emoji.id}` })
		.setTimestamp();
}

/** @param {import('discord.js').GuildEmoji} emoji */
export function emojiDeleteEmbed(emoji) {
	return new EmbedBuilder()
		.setColor(0xed4245)
		.setAuthor({
			name: emoji.guild.name,
			iconURL: emoji.guild.iconURL({ dynamic: true }),
		})
		.setTitle("😢  Emoji Removed")
		.addFields({ name: "Name", value: `:${emoji.name}:`, inline: true })
		.setFooter({ text: `Emoji ID: ${emoji.id}` })
		.setTimestamp();
}

/** @param {import('discord.js').Sticker} sticker */
export function stickerCreateEmbed(sticker) {
	return new EmbedBuilder()
		.setColor(0x57f287)
		.setAuthor({
			name: sticker.guild.name,
			iconURL: sticker.guild.iconURL({ dynamic: true }),
		})
		.setTitle("🎨  Sticker Added")
		.addFields(
			{ name: "Name", value: sticker.name, inline: true },
			{
				name: "Description",
				value: sticker.description || "*none*",
				inline: true,
			}
		)
		.setFooter({ text: `Sticker ID: ${sticker.id}` })
		.setTimestamp();
}

/** @param {import('discord.js').Sticker} sticker */
export function stickerDeleteEmbed(sticker) {
	return new EmbedBuilder()
		.setColor(0xed4245)
		.setAuthor({
			name: sticker.guild.name,
			iconURL: sticker.guild.iconURL({ dynamic: true }),
		})
		.setTitle("🗑️  Sticker Removed")
		.addFields({ name: "Name", value: sticker.name, inline: true })
		.setFooter({ text: `Sticker ID: ${sticker.id}` })
		.setTimestamp();
}
