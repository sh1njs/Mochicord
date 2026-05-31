/**
 * @fileoverview Database schemas for Mochi.
 * Each schema defines the default shape for a collection entry.
 * Fields with function values are called fresh for each new entry.
 */

/**
 * Global settings schema.
 * @type {Record<string, never>}
 */
export const SettingsSchema = {};

/**
 * Schema for each Discord user.
 */
export const UserSchema = {
	name: "",
	id: "",
	/** @returns {number[]} Array of warning timestamps (ms) */
	warnings: () => [],
};

/**
 * Schema for each Discord server (guild).
 */
export const ServerSchema = {
	name: "",
	id: "",

	/** Bad-word automod */
	badword: () => ({
		enabled: false,
		words: [],
	}),

	/** Welcome message config */
	welcome: () => ({
		enabled: false,
		channelId: null,
		message:
			"Welcome {user} to **{server}** ✨\nYou just joined as member #{membercount}.\n\nHope you enjoy your stay here, make yourself at home!",
	}),

	/** Action log config */
	actionlog: () => ({
		enabled: false,
		channelId: null,
	}),
};
