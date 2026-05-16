import { logger } from "#utils/logger";
import { readdirSync, statSync } from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVENTS_DIR = path.join(__dirname, "../events");

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
 * Loads all event files from `src/events/**` and registers them on the client.
 * Each file must export `name` (string) and `execute` (function).
 * Optionally export `once: true` for one-time listeners.
 *
 * @param {import('discord.js').Client} client
 * @returns {Promise<void>}
 */
export async function loadEvents(client) {
  const files = collectFiles(EVENTS_DIR);
  let loaded = 0;

  for (const file of files) {
    const event = await import(pathToFileURL(file).href);

    if (!event.name || !event.execute) {
      logger.warn(
        `Skipped event file — missing 'name' or 'execute': ${path.relative(EVENTS_DIR, file)}`,
      );
      continue;
    }

    const handler = (...args) => event.execute(...args);

    if (event.once) {
      client.once(event.name, handler);
    } else {
      client.on(event.name, handler);
    }

    const tag = event.once ? " (once)" : "";
    logger.success(`Event loaded: ${event.name}${tag}`);
    loaded++;
  }

  logger.system(`${loaded} event(s) loaded.`);
}
