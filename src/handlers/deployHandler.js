/**
 * Standalone script for deploying slash commands to Discord.
 * Run with: `npm run deploy`
 *
 * Deploys to a specific guild if GUILD_ID is set (fast, ~instant).
 * Deploys globally if GUILD_ID is not set (can take up to 1 hour to propagate).
 */
import { logger } from "#utils/logger";
import { REST, Routes } from "discord.js";
import "dotenv/config";
import { readdirSync, statSync } from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMMANDS_DIR = path.join(__dirname, "../commands");

/** @returns {string[]} */
function collectFiles(dir) {
	const results = [];
	for (const entry of readdirSync(dir)) {
		const full = path.join(dir, entry);
		statSync(full).isDirectory()
			? results.push(...collectFiles(full))
			: entry.endsWith(".js") && results.push(full);
	}
	return results;
}

const commands = [];
for (const file of collectFiles(COMMANDS_DIR)) {
	const mod = await import(pathToFileURL(file).href);
	if (mod.data) commands.push(mod.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

try {
	logger.system(`Deploying ${commands.length} slash command(s)...`);

	if (process.env.GUILD_ID) {
		await rest.put(
			Routes.applicationGuildCommands(
				process.env.CLIENT_ID,
				process.env.GUILD_ID
			),
			{ body: commands }
		);
		logger.success(
			`Guild commands deployed to guild ${process.env.GUILD_ID}.`
		);
	} else {
		await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
			body: commands,
		});
		logger.success(
			"Global commands deployed. May take up to 1 hour to propagate."
		);
	}
} catch (err) {
	logger.error(`Deployment failed: ${err.message}`);
	process.exit(1);
}
