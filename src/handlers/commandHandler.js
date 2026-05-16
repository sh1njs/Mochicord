import { logger } from "#utils/logger";
import { readdirSync, statSync } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMMANDS_DIR = path.join(__dirname, "../commands");

/**
 * Recursively collects all `.js` file paths under a directory.
 *
 * @param {string} dir
 * @returns {string[]}
 */
function collectFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectFiles(full));
    } else if (entry.endsWith(".js")) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Loads all commands from `src/commands/**` into `client.commands`.
 * Commands must export `data` (SlashCommandBuilder) and `execute` (function).
 *
 * @param {import('discord.js').Client} client
 * @returns {Promise<void>}
 */
export async function loadCommands(client) {
  const files = collectFiles(COMMANDS_DIR);
  let loaded = 0;

  for (const file of files) {
    const mod = await import(pathToFileURL(file).href);

    if (!mod.data || !mod.execute) {
      logger.warn(
        `Skipped command file — missing 'data' or 'execute': ${path.relative(COMMANDS_DIR, file)}`,
      );
      continue;
    }

    // Attach meta so /help can read category/usage at runtime.
    client.commands.set(mod.data.name, {
      data: mod.data,
      execute: mod.execute,
      meta: mod.meta ?? { category: "misc", usage: `/${mod.data.name}` },
    });

    logger.success(`Command loaded: /${mod.data.name}`);
    loaded++;
  }

  logger.system(`${loaded} command(s) loaded.`);
}
