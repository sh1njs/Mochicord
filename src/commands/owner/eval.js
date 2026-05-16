import { Command } from "#structures/Command";
import { errorEmbed } from "#utils/embeds";
import { truncate } from "#utils/helpers";
import { PermissionFlagsBits, codeBlock } from "discord.js";

/**
 * `/eval` — Execute arbitrary JavaScript (owner-only).
 * This command is gated behind `OWNER_ID` from the environment — it will
 * silently refuse anyone who isn't the registered owner.
 */
class EvalCommand extends Command {
  constructor() {
    super("eval", "Execute arbitrary JavaScript code. (Owner only)", {
      category: "owner",
      usage: "/eval <code>",
    });

    this.data
      .addStringOption((opt) =>
        opt
          .setName("code")
          .setDescription("JavaScript code to execute.")
          .setRequired(true),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
  }

  /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
  async run(interaction) {
    // Hard owner-only guard — do not remove.
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        embeds: [errorEmbed("This command is restricted to the bot owner.")],
        ephemeral: true,
      });
    }

    const code = interaction.options.getString("code");
    await interaction.deferReply({ ephemeral: true });

    try {
      let result = await eval(code);

      if (typeof result !== "string") {
        result = require("util").inspect(result, { depth: 1 });
      }

      await interaction.editReply(codeBlock("js", truncate(result, 1900)));
    } catch (err) {
      await interaction.editReply({
        embeds: [
          errorEmbed(codeBlock("js", String(err).slice(0, 1000)), "Eval Error"),
        ],
      });
    }
  }
}

const cmd = new EvalCommand();
export const data = cmd.data;
export const execute = (i) => cmd.execute(i);
export const meta = cmd.meta;
