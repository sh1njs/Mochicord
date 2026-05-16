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
  warnings: () => [],
};

/**
 * Schema for each Discord server (guild).
 */
export const ServerSchema = {
  name: "",
  id: "",
  badword: () => ({
    enabled: false,
    words: [],
  }),
  welcome: () => ({
    enabled: false,
    channelId: null,
    message:
      "{user} just joined **{server}**! Welcome, you are member **#{membercount}**! 🎉",
  }),
  /** Action log configuration */
  actionlog: () => ({
    enabled: false,
    channelId: null,
  }),
};
