import { createClient } from "#client";
import { loadCommands } from "#handlers/commandHandler";
import { loadEvents } from "#handlers/eventHandler";
import { logger } from "#utils/logger";
import "dotenv/config";

// Validate required environment variables
const REQUIRED_ENV = ["DISCORD_TOKEN", "CLIENT_ID"];
for (const key of REQUIRED_ENV) {
	if (!process.env[key]) {
		logger.error(`Missing required environment variable: ${key}`);
		process.exit(1);
	}
}

// Bootstrap
const client = createClient();

logger.system("Loading commands...");
await loadCommands(client);

logger.system("Loading events...");
await loadEvents(client);

logger.system("Connecting to Discord...");
await client.login(process.env.DISCORD_TOKEN);

// Global error guards
process.on("unhandledRejection", (err) => {
	logger.error(`Unhandled rejection: ${err}`);
});

process.on("uncaughtException", (err) => {
	logger.error(`Uncaught exception: ${err.message}`);
	process.exit(1);
});
