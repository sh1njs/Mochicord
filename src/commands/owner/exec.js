import { PermissionFlagsBits, codeBlock, MessageFlags } from 'discord.js';
import { Command } from '#structures/Command';
import { errorEmbed } from '#utils/embeds';
import { truncate } from '#utils/helpers';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * `/exec` — Execute shell commands (owner-only).
 * This command is gated behind `OWNER_ID` from the environment.
 */
class ExecCommand extends Command {
	constructor() {
		super('exec', 'Execute shell commands. (Owner only)', {
			category: 'owner',
			usage: '/exec <command>',
		});

		this.data
			.addStringOption(opt =>
				opt.setName('command')
					.setDescription('Shell command to execute.')
					.setRequired(true)
			)
			.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
	}

	/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
	async run(interaction) {
		// Hard owner-only guard — do not remove.
		if (interaction.user.id !== process.env.OWNER_ID) {
			return interaction.reply({
				embeds: [errorEmbed('This command is restricted to the bot owner.')],
				flags: MessageFlags.Ephemeral,
			});
		}

		const command = interaction.options.getString('command');
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		try {
			const { stdout, stderr } = await execAsync(command, {
				timeout: 60000,
				maxBuffer: 1024 * 1024 * 10,
			});

			let output = '';
			if (stdout) output += `**STDOUT:**\n${codeBlock('bash', truncate(stdout, 1800))}\n`;
			if (stderr) output += `**STDERR:**\n${codeBlock('bash', truncate(stderr, 1800))}`;

			if (!output.trim()) output = '*(No output)*';

			await interaction.editReply(output);
		} catch (err) {
			const errMsg = err.stderr || err.stdout || err.message;
			await interaction.editReply({
				embeds: [errorEmbed(codeBlock('bash', truncate(String(errMsg), 1000)), 'Exec Error')],
			});
		}
	}
}

const cmd = new ExecCommand();
export const data = cmd.data;
export const execute = (i) => cmd.execute(i);
export const meta = cmd.meta;