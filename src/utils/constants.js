/**
 * Shared constants used across the project.
 * Add new app-wide literals here instead of inlining them.
 */

/** Discord invite regex — detects server invite links. */
export const INVITE_REGEX =
  /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+/i;

/** Placeholder tokens supported by the welcome message system. */
export const WELCOME_PLACEHOLDERS = ["{user}", "{server}", "{membercount}"];

/** Default welcome message used when a guild hasn't customized one. */
export const DEFAULT_WELCOME_MESSAGE =
  "Welcome to **{server}**, {user}! You are member **#{membercount}**. 🎉";
