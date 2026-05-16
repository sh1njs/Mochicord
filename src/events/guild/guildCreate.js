import { ensureGuildConfig } from "#services/guild/guildService";
import { logger } from "#utils/logger";
import { Events, REST, Routes } from "discord.js";
import { readdirSync, statSync } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMMANDS_DIR = path.join(__dirname, "../../commands");

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

export const name = Events.GuildCreate;

/**
 * Fires when the bot joins a new guild.
 * Automatically registers the guild in the database and deploys slash commands.
 *
 * @param {import('discord.js').Guild} guild
 */
export async function execute(guild) {
  // 1. Register guild in DB
  ensureGuildConfig(guild.id, guild.name);
  logger.system(
    `Joined new guild: "${guild.name}" (${guild.id}) — config initialized.`,
  );

  // 2. Auto-deploy slash commands to the new guild
  try {
    const commands = [];
    for (const file of collectFiles(COMMANDS_DIR)) {
      const mod = await import(pathToFileURL(file).href);
      if (mod.data) commands.push(mod.data.toJSON());
    }

    const rest = new REST({ version: "10" }).setToken(
      process.env.DISCORD_TOKEN,
    );
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id),
      { body: commands },
    );

    logger.success(
      `Auto-deployed ${commands.length} command(s) to "${guild.name}" (${guild.id}).`,
    );
  } catch (err) {
    logger.error(
      `Failed to auto-deploy commands to "${guild.name}" (${guild.id}): ${err.message}`,
    );
  }
}
