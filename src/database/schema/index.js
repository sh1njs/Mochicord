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
      "Welcome {user} to **{server}** ✨\nYou just joined as member #{membercount}.\n\nHope you enjoy your stay here, make yourself at home!",
  }),
  /** Action log configuration */
  actionlog: () => ({
    enabled: false,
    channelId: null,
  }),
};
