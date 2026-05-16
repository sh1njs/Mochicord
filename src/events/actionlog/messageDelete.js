import { messageDeleteEmbed, sendLog } from "#services/guild/actionlogService";
import { Events } from "discord.js";

export const name = Events.MessageDelete;

/** @param {import('discord.js').Message} message */
export async function execute(message) {
  // Ignore partial messages, DMs, bots
  if (!message.guild || message.author?.bot) return;
  if (message.partial) return;

  const embed = messageDeleteEmbed(message);
  await sendLog(message.guild, embed);
}
