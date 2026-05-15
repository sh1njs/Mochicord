import { Command } from "#structures/Command";
import { infoEmbed } from "#utils/embeds";

/**
 * `/ping` — Reports bot and Discord API latency.
 */
class PingCommand extends Command {
	constructor() {
		super("ping", "Check the bot and API latency.", {
			category: "utility",
			usage: "/ping",
		});
	}

	/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
	async run(interaction) {
		const sent = await interaction.reply({
			content: "Measuring...",
			fetchReply: true,
		});
		const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
		const apiLatency = Math.round(interaction.client.ws.ping);

		const embed = infoEmbed(
			`🏓 **Pong!**\n` +
				`> **Bot latency:** \`${botLatency}ms\`\n` +
				`> **API latency:** \`${apiLatency}ms\``,
			"Latency"
		);

		await interaction.editReply({ content: "", embeds: [embed] });
	}
}

const cmd = new PingCommand();
export const data = cmd.data;
export const execute = (i) => cmd.execute(i);
export const meta = cmd.meta;
