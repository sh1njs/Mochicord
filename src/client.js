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
			GatewayIntentBits.Guilds, // Required for guild info
			GatewayIntentBits.GuildMessages, // Required to receive messages
			GatewayIntentBits.MessageContent, // Required to read message text
			GatewayIntentBits.GuildMembers, // Required for member join events
		],
	});

	/** @type {Collection<string, { data: any, execute: Function, meta: object }>} */
	client.commands = new Collection();

	return client;
}
