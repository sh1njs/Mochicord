import { CommandBuilder } from "#structures/CommandBuilder";
import { errorEmbed } from "#utils/embeds";
import { truncate } from "#utils/helpers";
import { exec } from "child_process";
import { MessageFlags, PermissionFlagsBits, codeBlock } from "discord.js";
import { promisify } from "util";

const execAsync = promisify(exec);

export const { data, execute, meta } = new CommandBuilder()
	.setName("exec")
	.setDescription("Execute shell commands. (Owner only)")
	.setCategory("owner")
	.setUsage("/exec <command>")
	.setOptions((builder) =>
		builder
			.addStringOption((opt) =>
				opt
					.setName("command")
					.setDescription("Shell command to execute.")
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
				flags: MessageFlags.Ephemeral,
			});
		}

		const command = interaction.options.getString("command");
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		try {
			const { stdout, stderr } = await execAsync(command, {
				timeout: 60_000,
				maxBuffer: 1024 * 1024 * 10,
			});
			let output = "";
			if (stdout)
				output += `**STDOUT:**\n${codeBlock("bash", truncate(stdout, 1800))}\n`;
			if (stderr)
				output += `**STDERR:**\n${codeBlock("bash", truncate(stderr, 1800))}`;
			await interaction.editReply(output.trim() || "*(No output)*");
		} catch (err) {
			const errMsg = err.stderr || err.stdout || err.message;
			await interaction.editReply({
				embeds: [
					errorEmbed(
						codeBlock("bash", truncate(String(errMsg), 1000)),
						"Exec Error"
					),
				],
			});
		}
	})
	.build();
