import { CommandBuilder } from "#structures/CommandBuilder";
import { infoEmbed } from "#utils/embeds";

export const { data, execute, meta } = new CommandBuilder()
	.setName("ping")
	.setDescription("Check the bot and API latency.")
	.setCategory("utility")
	.setUsage("/ping")
	.setHandler(async (interaction) => {
		const sent = await interaction.reply({
			content: "Measuring...",
			fetchReply: true,
		});
		const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
		const apiLatency = Math.round(interaction.client.ws.ping);

		await interaction.editReply({
			content: "",
			embeds: [
				infoEmbed(
					`🏓 **Pong!**\n> **Bot latency:** \`${botLatency}ms\`\n> **API latency:** \`${apiLatency}ms\``,
					"Latency"
				),
			],
		});
	})
	.build();
