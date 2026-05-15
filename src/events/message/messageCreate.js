import { config } from "#config";
import { findBadWord } from "#services/automod/badwordService";
import { addWarning } from "#services/guild/guildService";
import { logger } from "#utils/logger";
import { Events, PermissionFlagsBits } from "discord.js";

export const name = Events.MessageCreate;

/**
 * Fires for every new message in a guild.
 *
 * Automod pipeline:
 *  1. Ignore bots and DMs.
 *  2. Skip members with ManageMessages (moderators).
 *  3. Check message against the guild's bad word list.
 *  4. Delete the violating message.
 *  5. Send a warning DM to the user.
 *  6. Record the warning — if threshold is reached, issue a temp ban.
 *
 * @param {import('discord.js').Message} message
 */
export async function execute(message) {
	// Ignore bots and DMs.
	if (message.author.bot || !message.guild) return;

	// Moderators are exempt from automod.
	if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages))
		return;

	const match = findBadWord(message.guildId, message.content);
	if (!match) return;

	// --- Delete the offending message ---
	await message.delete().catch(() => {});

	// --- Track warning and DM the user ---
	const warnCount = addWarning(message.guildId, message.author.id);

	try {
		await message.author.send(
			`⚠️ Your message in **${message.guild.name}** was removed because it contained a blocked word.\n` +
				`**Warning ${warnCount}/${config.automod.maxWarnings}.**\n` +
				(warnCount >= config.automod.maxWarnings
					? "You have reached the warning limit and may be temporarily banned."
					: "Please follow the server rules.")
		);
	} catch {
		// User has DMs disabled — log silently.
		logger.debug(
			`Could not DM warning to ${message.author.tag} — DMs likely closed.`
		);
	}

	logger.info(
		`Automod: deleted message by ${message.author.tag} in "${message.guild.name}" — matched word: "${match}"`
	);

	// --- Temp ban if threshold reached ---
	if (warnCount >= config.automod.maxWarnings) {
		try {
			await message.guild.members.ban(message.author, {
				reason: `Automod: ${warnCount} warnings for using blocked words.`,
				deleteMessageSeconds: 0,
			});

			// Schedule unban.
			setTimeout(async () => {
				await message.guild.members
					.unban(message.author.id, "Temporary automod ban expired.")
					.catch(() => {});
				logger.info(
					`Automod: auto-unbanned ${message.author.tag} in "${message.guild.name}"`
				);
			}, config.automod.tempBanDuration);

			logger.info(
				`Automod: temp-banned ${message.author.tag} in "${message.guild.name}" for ${config.automod.maxWarnings} warnings.`
			);
		} catch (err) {
			logger.error(
				`Automod temp-ban failed for ${message.author.tag}: ${err.message}`
			);
		}
	}
}
