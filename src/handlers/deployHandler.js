/**
 * Standalone script to deploy slash commands to Discord.
 * Run with: `npm run deploy`
 *
 * Deployment logic:
 * 1. Read all servers registered in the local database.
 * 2. If any exist, deploy guild commands to all servers (instant).
 * 3. If the database is empty, fallback to global deploy (propagation takes ~1 hour).
 */
import local from "#database/local";
import { logger } from "#utils/logger";
import { REST, Routes } from "discord.js";
import "dotenv/config";
import { readdirSync, statSync } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMMANDS_DIR = path.join(__dirname, "../commands");

/** Recursively collect all .js files in the commands folder. */
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

await local.initialize();
const servers = Object.keys(local.servers.all());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

try {
  logger.system(`Deploying ${commands.length} slash command(s)...`);

  if (servers.length > 0) {
    logger.system(
      `Found ${servers.length} server(s) in database. Deploying to each...`,
    );

    const results = await Promise.allSettled(
      servers.map((guildId) =>
        rest
          .put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
            { body: commands },
          )
          .then(() => ({ guildId, ok: true }))
          .catch((err) => ({ guildId, ok: false, err: err.message })),
      ),
    );

    for (const result of results) {
      const { guildId, ok, err } = result.value;
      if (ok) {
        logger.success(`Deployed to server ${guildId}.`);
      } else {
        logger.error(`Failed to deploy to server ${guildId}: ${err}`);
      }
    }
  } else {
    logger.system(
      "No servers found in database. Falling back to global deploy...",
    );
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    logger.success(
      "Global commands deployed. May take up to 1 hour to propagate.",
    );
  }
} catch (err) {
  logger.error(`Deployment failed: ${err.message}`);
  process.exit(1);
}
