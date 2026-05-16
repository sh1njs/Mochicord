import { config } from "#config";
import { errorEmbed } from "#utils/embeds";
import { PermissionFlagsBits } from "discord.js";

/**
 * Checks that the bot has every permission in `config.requiredBotPermissions`
 * for the channel the interaction was created in.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Promise<boolean>} `true` if all permissions are present.
 */
export async function checkBotPermissions(interaction) {
  const botMember = interaction.guild.members.me;
  const channel = interaction.channel;

  for (const perm of config.requiredBotPermissions) {
    if (!botMember.permissionsIn(channel).has(PermissionFlagsBits[perm])) {
      await interaction.reply({
        embeds: [
          errorEmbed(`I'm missing the **${perm}** permission in this channel.`),
        ],
        ephemeral: true,
      });
      return false;
    }
  }
  return true;
}

/**
 * Checks whether a guild member has at least one of the given permissions.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {...import('discord.js').PermissionResolvable} perms
 * @returns {boolean}
 */
export function memberHasAny(member, ...perms) {
  return perms.some((p) => member.permissions.has(p));
}
