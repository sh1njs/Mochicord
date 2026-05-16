import { emojiCreateEmbed, sendLog } from "#services/guild/actionlogService";
import { Events } from "discord.js";

export const name = Events.GuildEmojiCreate;

/** @param {import('discord.js').GuildEmoji} emoji */
export async function execute(emoji) {
  const embed = emojiCreateEmbed(emoji);
  await sendLog(emoji.guild, embed);
}
