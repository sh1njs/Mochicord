import { errorEmbed } from "#utils/embeds";
import { logger } from "#utils/logger";
import { Events } from "discord.js";

export const name = Events.InteractionCreate;

/**
 * Routes all incoming interactions to their respective handlers.
 * Currently handles: slash commands.
 *
 * @param {import('discord.js').Interaction} interaction
 */
export async function execute(interaction) {
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`Unknown command invoked: /${interaction.commandName}`);
      return interaction.reply({
        embeds: [
          errorEmbed("That command does not exist or is not registered."),
        ],
        ephemeral: true,
      });
    }

    try {
      await command.execute(interaction);
      logger.info(
        `/${interaction.commandName} used by ${interaction.user.tag} in "${interaction.guild?.name ?? "DM"}"`,
      );
    } catch (err) {
      logger.error(`Error in /${interaction.commandName}: ${err.message}`);

      const payload = {
        embeds: [
          errorEmbed("Something went wrong while running this command."),
        ],
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }

    return;
  }
}
