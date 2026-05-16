import { stickerDeleteEmbed, sendLog } from "#services/guild/actionlogService";
import { Events } from "discord.js";

export const name = Events.GuildStickerDelete;

/** @param {import('discord.js').Sticker} sticker */
export async function execute(sticker) {
  if (!sticker.guild) return;
  const embed = stickerDeleteEmbed(sticker);
  await sendLog(sticker.guild, embed);
}
