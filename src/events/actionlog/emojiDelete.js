import { emojiDeleteEmbed, sendLog } from "#services/guild/actionlogService";
import { Events } from "discord.js";

export const name = Events.GuildEmojiDelete;

/** @param {import('discord.js').GuildEmoji} emoji */
export async function execute(emoji) {
  const embed = emojiDeleteEmbed(emoji);
  await sendLog(emoji.guild, embed);
}
