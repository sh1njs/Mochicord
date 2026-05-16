import { messageUpdateEmbed, sendLog } from "#services/guild/actionlogService";
import { Events } from "discord.js";

export const name = Events.MessageUpdate;

/**
 * @param {import('discord.js').Message} oldMessage
 * @param {import('discord.js').Message} newMessage
 */
export async function execute(oldMessage, newMessage) {
  // Ignore DMs, bots, partials, and embed-only updates (link previews)
  if (!newMessage.guild || newMessage.author?.bot) return;
  if (oldMessage.partial || newMessage.partial) return;
  if (oldMessage.content === newMessage.content) return;

  const embed = messageUpdateEmbed(oldMessage, newMessage);
  await sendLog(newMessage.guild, embed);
}
