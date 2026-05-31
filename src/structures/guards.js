/**
 * @fileoverview Guard system for Mochi slash commands.
 * Ported from Katsumi's guards.js — guards throw GuardError to block execution.
 * The interactionCreate handler catches GuardError and replies ephemerally.
 * @module structures/guards
 */
import { PermissionFlagsBits } from "discord.js";

/**
 * Thrown by a guard when the command should be blocked.
 * The interactionCreate handler catches this and sends the message to the user.
 */
export class GuardError extends Error {
	constructor(message) {
		super(message);
		this.name = "GuardError";
	}
}

/**
 * Built-in guards. Pass their name string to CommandBuilder.setGuard().
 *
 * @type {Record<string, (interaction: import('discord.js').ChatInputCommandInteraction) => void | Promise<void>>}
 */
export const GUARDS = {
	/**
	 * Only the bot owner (OWNER_ID env var) can run this command.
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 */
	owner(interaction) {
		if (interaction.user.id !== process.env.OWNER_ID) {
			throw new GuardError(
				"❌ This command is restricted to the bot owner."
			);
		}
	},

	/**
	 * Command must be used inside a guild (not DMs).
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 */
	guild(interaction) {
		if (!interaction.inGuild()) {
			throw new GuardError(
				"❌ This command can only be used in a server."
			);
		}
	},

	/**
	 * Invoker must have the Administrator permission.
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 */
	admin(interaction) {
		if (!interaction.inGuild()) {
			throw new GuardError(
				"❌ This command can only be used in a server."
			);
		}
		if (
			!interaction.memberPermissions?.has(
				PermissionFlagsBits.Administrator
			)
		) {
			throw new GuardError(
				"❌ You need the **Administrator** permission to use this command."
			);
		}
	},

	/**
	 * Invoker must have the ModerateMembers (timeout) permission.
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 */
	moderator(interaction) {
		if (!interaction.inGuild()) {
			throw new GuardError(
				"❌ This command can only be used in a server."
			);
		}
		if (
			!interaction.memberPermissions?.has(
				PermissionFlagsBits.ModerateMembers
			) &&
			!interaction.memberPermissions?.has(
				PermissionFlagsBits.Administrator
			)
		) {
			throw new GuardError(
				"❌ You need the **Moderate Members** permission to use this command."
			);
		}
	},
};
