import { stickerCreateEmbed, sendLog } from "#services/guild/actionlogService";
import { Events } from "discord.js";

export const name = Events.GuildStickerCreate;

/** @param {import('discord.js').Sticker} sticker */
export async function execute(sticker) {
  if (!sticker.guild) return;
  const embed = stickerCreateEmbed(sticker);
  await sendLog(sticker.guild, embed);
}
