import { CommandBuilder } from "#structures/CommandBuilder";
import { errorEmbed } from "#utils/embeds";
import { truncate } from "#utils/helpers";
import { PermissionFlagsBits, codeBlock } from "discord.js";
import { inspect } from "util";

export const { data, execute, meta } = new CommandBuilder()
	.setName("eval")
	.setDescription("Execute arbitrary JavaScript code. (Owner only)")
	.setCategory("owner")
	.setUsage("/eval <code>")
	.setOptions((builder) =>
		builder
			.addStringOption((opt) =>
				opt
					.setName("code")
					.setDescription("JavaScript code to execute.")
					.setRequired(true)
			)
			.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	)
	.setHandler(async (interaction) => {
		if (interaction.user.id !== process.env.OWNER_ID) {
			return interaction.reply({
				embeds: [
					errorEmbed("This command is restricted to the bot owner."),
				],
				ephemeral: true,
			});
		}

		const code = interaction.options.getString("code");
		await interaction.deferReply({ ephemeral: true });

		try {
			let result = await eval(code);
			if (typeof result !== "string")
				result = inspect(result, { depth: 1 });
			await interaction.editReply(
				codeBlock("js", truncate(result, 1900))
			);
		} catch (err) {
			await interaction.editReply({
				embeds: [
					errorEmbed(
						codeBlock("js", String(err).slice(0, 1000)),
						"Eval Error"
					),
				],
			});
		}
	})
	.build();
