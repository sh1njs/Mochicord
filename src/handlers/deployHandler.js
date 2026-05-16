/**
 * Standalone script to deploy slash commands to Discord.
 * Run with: `npm run deploy`
 *
 * Deployment logic:
 * 1. Load all local commands and fetch currently deployed commands per guild.
 * 2. If new commands are detected (diff by name), deploy to that guild only.
 * 3. If --force flag is passed, deploy to all servers regardless.
 * 4. If the database is empty, fallback to global deploy.
 */
import db from "#database/MochiDB";
import { logger } from "#utils/logger";
import { REST, Routes } from "discord.js";
import "dotenv/config";
import { readdirSync, statSync } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMMANDS_DIR = path.join(__dirname, "../commands");
const FORCE = process.argv.includes("--force");

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

// Load all local commands
const commands = [];
for (const file of collectFiles(COMMANDS_DIR)) {
  const mod = await import(pathToFileURL(file).href);
  if (mod.data) commands.push(mod.data.toJSON());
}

const localNames = new Set(commands.map((c) => c.name));

await db.initialize();
const servers = Object.keys(db.servers.all());
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

logger.system(
  `Loaded ${commands.length} local command(s): ${[...localNames].join(", ")}`,
);

try {
  if (servers.length > 0) {
    logger.system(
      `Found ${servers.length} server(s) in database. Checking for new commands...`,
    );

    const results = await Promise.allSettled(
      servers.map(async (guildId) => {
        try {
          // Fetch currently deployed commands for this guild
          let deployed = [];
          if (!FORCE) {
            deployed = await rest.get(
              Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
            );
          }

          const deployedNames = new Set(deployed.map((c) => c.name));

          // Find new commands not yet deployed to this guild
          const newCommands = commands.filter(
            (c) => !deployedNames.has(c.name),
          );

          if (!FORCE && newCommands.length === 0) {
            logger.info(`Server ${guildId} — no new commands, skipped.`);
            return { guildId, ok: true, skipped: true };
          }

          const reason = FORCE
            ? "force deploy"
            : `${newCommands.length} new command(s): ${newCommands.map((c) => c.name).join(", ")}`;

          await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
            { body: commands },
          );

          return { guildId, ok: true, skipped: false, reason };
        } catch (err) {
          return { guildId, ok: false, err: err.message };
        }
      }),
    );

    for (const result of results) {
      const { guildId, ok, skipped, reason, err } = result.value;
      if (!ok) {
        logger.error(`Failed to deploy to server ${guildId}: ${err}`);
      } else if (skipped) {
        logger.info(`Server ${guildId} — up to date, skipped.`);
      } else {
        logger.success(`Deployed to server ${guildId} (${reason}).`);
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
