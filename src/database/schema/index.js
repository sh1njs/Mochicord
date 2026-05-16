/**
 * Global settings schema — kosong untuk sekarang, bisa diisi nanti.
 * @type {Record<string, never>}
 */
export const SettingsSchema = {};

/**
 * Schema for each Discord user.
 * The () function is used so that each user has their own array/object instance (not shared).
 */
export const UserSchema = {
  /** Username Discord */
  name: "",
  /** Discord user ID */
  id: "",
  /** Array of warning timestamps (ms). Diprune otomatis oleh guildService. */
  warnings: () => [],
};

/**
 * Schema for each Discord server (guild).
 * The () function is used so that each server has its own object instance (not shared).
 */
export const ServerSchema = {
  /** Server name */
  name: "",
  /** Discord guild ID */
  id: "",
  /** Badword filter configuration */
  badword: () => ({
    enabled: false,
    words: [],
  }),
  /** Welcome message configuration */
  welcome: () => ({
    enabled: false,
    channelId: null,
    message:
      "{user} just joined **{server}**! Welcome, you are member **#{membercount}**! 🎉",
  }),
};
