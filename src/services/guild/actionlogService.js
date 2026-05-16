import db from "#database/MochiDB";
import { EmbedBuilder } from "discord.js";

/**
 * Returns the action log channel for a guild, or null if not configured/enabled.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {import('discord.js').TextChannel | null}
 */
export function getLogChannel(guild) {
  const server = db.servers.get(guild.id);
  if (!server?.actionlog?.enabled || !server.actionlog.channelId) return null;
  return guild.channels.cache.get(server.actionlog.channelId) ?? null;
}

/**
 * Sends an embed log to the guild's action log channel.
 *
 * @param {import('discord.js').Guild} guild
 * @param {EmbedBuilder} embed
 */
export async function sendLog(guild, embed) {
  const channel = getLogChannel(guild);
  if (!channel) return;
  await channel.send({ embeds: [embed] }).catch(() => {});
}

// ── Embed builders ────────────────────────────────────────────────────────────

/** Message deleted */
export function messageDeleteEmbed(message) {
  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setAuthor({
      name: message.author.username,
      iconURL: message.author.displayAvatarURL({ dynamic: true }),
    })
    .setTitle("🗑️  Message Deleted")
    .addFields(
      { name: "Author", value: `${message.author} (${message.author.tag})`, inline: true },
      { name: "Channel", value: `${message.channel}`, inline: true },
      {
        name: "Content",
        value: message.content?.slice(0, 1024) || "*[no text content]*",
      },
    )
    .setFooter({ text: `User ID: ${message.author.id}` })
    .setTimestamp();

  if (message.attachments.size > 0) {
    embed.addFields({
      name: "Attachments",
      value: message.attachments.map((a) => a.url).join("\n").slice(0, 1024),
    });
  }

  return embed;
}

/** Message edited */
export function messageUpdateEmbed(oldMessage, newMessage) {
  return new EmbedBuilder()
    .setColor(0xfee75c)
    .setAuthor({
      name: newMessage.author.username,
      iconURL: newMessage.author.displayAvatarURL({ dynamic: true }),
    })
    .setTitle("✏️  Message Edited")
    .setURL(newMessage.url)
    .addFields(
      { name: "Channel", value: `${newMessage.channel}`, inline: true },
      {
        name: "Before",
        value: oldMessage.content?.slice(0, 1024) || "*[no text]*",
      },
      {
        name: "After",
        value: newMessage.content?.slice(0, 1024) || "*[no text]*",
      },
    )
    .setFooter({ text: `Message ID: ${newMessage.id}` })
    .setTimestamp();
}

/** Member joined */
export function memberJoinEmbed(member) {
  const accountAge = Math.floor(
    (Date.now() - member.user.createdTimestamp) / 86_400_000,
  );
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setAuthor({
      name: member.user.username,
      iconURL: member.user.displayAvatarURL({ dynamic: true }),
    })
    .setTitle("📥  Member Joined")
    .addFields(
      { name: "User", value: `${member} (${member.user.tag})`, inline: true },
      { name: "Account Age", value: `${accountAge} day(s)`, inline: true },
      { name: "Member Count", value: `${member.guild.memberCount}`, inline: true },
    )
    .setFooter({ text: `User ID: ${member.id}` })
    .setTimestamp();
}

/** Member left */
export function memberLeaveEmbed(member) {
  return new EmbedBuilder()
    .setColor(0xed4245)
    .setAuthor({
      name: member.user.username,
      iconURL: member.user.displayAvatarURL({ dynamic: true }),
    })
    .setTitle("📤  Member Left")
    .addFields(
      { name: "User", value: `${member.user.tag}`, inline: true },
      { name: "Member Count", value: `${member.guild.memberCount}`, inline: true },
      {
        name: "Roles",
        value:
          member.roles.cache
            .filter((r) => r.id !== member.guild.id)
            .map((r) => r.toString())
            .join(", ")
            .slice(0, 1024) || "*none*",
      },
    )
    .setFooter({ text: `User ID: ${member.id}` })
    .setTimestamp();
}

/** Voice state change */
export function voiceStateEmbed(oldState, newState, member) {
  let title, color, description;

  const oldCh = oldState.channel;
  const newCh = newState.channel;

  if (!oldCh && newCh) {
    title = "🔊  Joined Voice";
    color = 0x57f287;
    description = `${member} joined **${newCh.name}**`;
  } else if (oldCh && !newCh) {
    title = "🔇  Left Voice";
    color = 0xed4245;
    description = `${member} left **${oldCh.name}**`;
  } else if (oldCh && newCh && oldCh.id !== newCh.id) {
    title = "🔄  Moved Voice Channel";
    color = 0xfee75c;
    description = `${member} moved from **${oldCh.name}** → **${newCh.name}**`;
  } else {
    const changes = [];
    if (oldState.mute !== newState.mute)
      changes.push(newState.mute ? "🔇 Server muted" : "🔊 Server unmuted");
    if (oldState.deaf !== newState.deaf)
      changes.push(newState.deaf ? "🙉 Server deafened" : "👂 Server undeafened");
    if (oldState.selfMute !== newState.selfMute)
      changes.push(newState.selfMute ? "🎤 Self-muted" : "🎤 Self-unmuted");
    if (oldState.selfDeaf !== newState.selfDeaf)
      changes.push(newState.selfDeaf ? "🎧 Self-deafened" : "🎧 Self-undeafened");
    if (oldState.streaming !== newState.streaming)
      changes.push(newState.streaming ? "📡 Started streaming" : "📡 Stopped streaming");

    if (changes.length === 0) return null;
    title = "🔊  Voice State Changed";
    color = 0x5865f2;
    description = `${member} in **${newCh?.name ?? oldCh?.name ?? "Unknown"}**\n${changes.join("\n")}`;
  }

  return new EmbedBuilder()
    .setColor(color)
    .setAuthor({
      name: member.user.username,
      iconURL: member.user.displayAvatarURL({ dynamic: true }),
    })
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: `User ID: ${member.id}` })
    .setTimestamp();
}

/** Emoji created */
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
      { name: "Animated", value: emoji.animated ? "Yes" : "No", inline: true },
    )
    .setFooter({ text: `Emoji ID: ${emoji.id}` })
    .setTimestamp();
}

/** Emoji deleted */
export function emojiDeleteEmbed(emoji) {
  return new EmbedBuilder()
    .setColor(0xed4245)
    .setAuthor({
      name: emoji.guild.name,
      iconURL: emoji.guild.iconURL({ dynamic: true }),
    })
    .setTitle("😢  Emoji Removed")
    .addFields(
      { name: "Name", value: `:${emoji.name}:`, inline: true },
    )
    .setFooter({ text: `Emoji ID: ${emoji.id}` })
    .setTimestamp();
}

/** Sticker created */
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
      { name: "Description", value: sticker.description || "*none*", inline: true },
    )
    .setFooter({ text: `Sticker ID: ${sticker.id}` })
    .setTimestamp();
}

/** Sticker deleted */
export function stickerDeleteEmbed(sticker) {
  return new EmbedBuilder()
    .setColor(0xed4245)
    .setAuthor({
      name: sticker.guild.name,
      iconURL: sticker.guild.iconURL({ dynamic: true }),
    })
    .setTitle("🗑️  Sticker Removed")
    .addFields(
      { name: "Name", value: sticker.name, inline: true },
    )
    .setFooter({ text: `Sticker ID: ${sticker.id}` })
    .setTimestamp();
}

export function setActionlogEnabled(guildId, enabled) {
  const server = db.servers.set(guildId, {});
  server.actionlog.enabled = enabled;
  db.save();
}

export function setActionlogChannel(guildId, channelId) {
  const server = db.servers.set(guildId, {});
  server.actionlog.channelId = channelId;
  db.save();
}