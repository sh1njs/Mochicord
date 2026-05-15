import { logger } from "#utils/logger";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GUILDS_DIR = path.join(__dirname, "guilds");

// Ensure the guilds directory always exists.
if (!fs.existsSync(GUILDS_DIR)) fs.mkdirSync(GUILDS_DIR, { recursive: true });

/**
 * The default configuration applied to every new guild.
 * @returns {GuildConfig}
 */
export function defaultGuildConfig() {
	return {
		badword: {
			enabled: false,
			words: [],
		},
		welcome: {
			enabled: false,
			channelId: null,
			message:
				"{user} just joined **{server}**! Welcome, you are member **#{membercount}**! 🎉",
		},
		warnings: {}, // { [userId]: number[] }  (array of timestamps)
	};
}

/**
 * @typedef {ReturnType<defaultGuildConfig>} GuildConfig
 */

/**
 * Resolves the file path for a guild's JSON config.
 * @param {string} guildId
 * @returns {string}
 */
function guildPath(guildId) {
	return path.join(GUILDS_DIR, `${guildId}.json`);
}

/**
 * Loads a guild config from disk, creating it with defaults if it doesn't exist.
 *
 * @param {string} guildId
 * @returns {GuildConfig}
 */
export function loadGuild(guildId) {
	const filePath = guildPath(guildId);

	if (!fs.existsSync(filePath)) {
		const defaults = defaultGuildConfig();
		fs.writeFileSync(filePath, JSON.stringify(defaults, null, 2), "utf8");
		logger.info(`Created new guild config for ${guildId}`);
		return defaults;
	}

	try {
		return JSON.parse(fs.readFileSync(filePath, "utf8"));
	} catch {
		logger.warn(
			`Corrupted config for guild ${guildId} — resetting to defaults.`
		);
		const defaults = defaultGuildConfig();
		fs.writeFileSync(filePath, JSON.stringify(defaults, null, 2), "utf8");
		return defaults;
	}
}

/**
 * Persists a guild config back to disk.
 *
 * @param {string} guildId
 * @param {GuildConfig} data
 * @returns {void}
 */
export function saveGuild(guildId, data) {
	fs.writeFileSync(guildPath(guildId), JSON.stringify(data, null, 2), "utf8");
}
