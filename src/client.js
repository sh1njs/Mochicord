import { Client, Collection, GatewayIntentBits } from "discord.js";

/**
 * Creates and returns the configured Discord client instance.
 * The `commands` Collection is attached here so handlers can populate it.
 *
 * @returns {import('discord.js').Client & { commands: Collection<string, any> }}
 */
export function createClient() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds, // Guild info, emoji, sticker events
      GatewayIntentBits.GuildMessages, // Message create/delete/update
      GatewayIntentBits.MessageContent, // Required to read message text
      GatewayIntentBits.GuildMembers, // Member join/leave events
      GatewayIntentBits.GuildVoiceStates, // Voice join/leave/move events
      GatewayIntentBits.GuildExpressions, // Emoji & sticker create/delete
    ],
  });

  /** @type {Collection<string, { data: any, execute: Function, meta: object }>} */
  client.commands = new Collection();

  return client;
}
