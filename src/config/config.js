/**
 * Central configuration for the Mochi bot.
 * All tuneable values live here — no magic numbers scattered across files.
 */
export const config = {
  /** Bot accent color used in most embeds (Discord Blurple) */
  color: {
    default: 0x5865f2,
    success: 0x57f287,
    error: 0xed4245,
    warning: 0xfee75c,
    info: 0x5865f2,
  },

  /** Automod warning thresholds */
  automod: {
    /** Warnings before a temporary ban is issued */
    maxWarnings: 3,
    /** How long a temporary ban lasts (ms) — default 1 hour */
    tempBanDuration: 60 * 60 * 1000,
    /** Warning expiry window (ms) — default 24 hours */
    warningExpiry: 24 * 60 * 60 * 1000,
  },

  /** Permissions the bot requires to operate in a channel */
  requiredBotPermissions: ["SendMessages", "ViewChannel", "ManageMessages"],
};
