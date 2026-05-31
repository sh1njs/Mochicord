import { config } from "#config";
import fesnuk from "#scrapers/facebook";
import { CommandBuilder } from "#structures/CommandBuilder";
import { errorEmbed } from "#utils/embeds";
import { AttachmentBuilder, EmbedBuilder, MessageFlags } from "discord.js";

const MAX_SIZE = 25 * 1024 * 1024;

export const { data, execute, meta } = new CommandBuilder()
	.setName("facebook")
	.setDescription("Download Facebook videos or images from a URL.")
	.setCategory("download")
	.setUsage("/facebook <url>")
	.setOptions((builder) =>
		builder.addStringOption((opt) =>
			opt
				.setName("url")
				.setDescription("Facebook post/video URL.")
				.setRequired(true)
		)
	)
	.setHandler(async (interaction) => {
		const input = interaction.options.getString("url");

		if (!input.includes("facebook.com") && !input.includes("fb.watch")) {
			return interaction.reply({
				embeds: [errorEmbed("Please provide a valid Facebook URL.")],
				flags: MessageFlags.Ephemeral,
			});
		}

		await interaction.deferReply();

		let result;
		try {
			result = await fesnuk(input);
		} catch (err) {
			return interaction.editReply({
				embeds: [errorEmbed(`Failed to fetch media: ${err.message}`)],
			});
		}

		if (!result) {
			return interaction.editReply({
				embeds: [
					errorEmbed(
						"Failed to download. The URL may be invalid or the content is unavailable."
					),
				],
			});
		}

		let description = `**Type:** ${result.type === "video" ? "🎥 Video" : "🖼️ Post"}\n`;
		description += `**Title:** ${result.title || "Facebook"}\n`;
		description += `**Source:** [View Original](${result.url})\n`;
		if (result.externalUrl)
			description += `**External Link:** ${result.externalUrl}\n`;

		if (Array.isArray(result.comments) && result.comments.length > 0) {
			description += "\n💬 **Top Comments:**\n";
			for (const comment of result.comments.slice(0, 3)) {
				if (comment.text?.trim())
					description += `• **${comment.author.name}:** ${comment.text}\n`;
			}
		}

		const embed = new EmbedBuilder()
			.setColor(config.color.default)
			.setTitle("Facebook Media")
			.setDescription(description.trim())
			.setFooter({ text: "Facebook Downloader" })
			.setTimestamp();

		if (
			result.type === "image" &&
			Array.isArray(result.image) &&
			result.image.length > 0
		) {
			try {
				const files = [];
				for (let i = 0; i < result.image.length; i++) {
					const res = await fetch(result.image[i]);
					const buf = await res.arrayBuffer();
					files.push(
						new AttachmentBuilder(Buffer.from(buf), {
							name: `facebook-image-${i + 1}.jpg`,
						})
					);
				}
				const [first, ...rest] = files;
				await interaction.editReply({
					embeds: [embed],
					files: [first],
				});
				for (const f of rest)
					await interaction.followUp({ files: [f] });
			} catch (err) {
				await interaction.editReply({
					embeds: [
						errorEmbed(`Failed to download images: ${err.message}`),
					],
				});
			}
			return;
		}

		if (result.type === "video" && (result.hd || result.sd)) {
			const videoUrl = result.hd || result.sd;
			embed.addFields({
				name: "Quality",
				value: result.hd ? "HD" : "SD",
				inline: true,
			});

			try {
				const res = await fetch(videoUrl);
				const buf = await res.arrayBuffer();
				if (buf.byteLength > MAX_SIZE) {
					return interaction.editReply({
						embeds: [embed],
						content: `⚠️ Video too large (${(buf.byteLength / 1024 / 1024).toFixed(2)} MB).\n**Download:** ${videoUrl}`,
					});
				}
				return interaction.editReply({
					embeds: [embed],
					files: [
						new AttachmentBuilder(Buffer.from(buf), {
							name: "facebook-video.mp4",
						}),
					],
				});
			} catch {
				return interaction.editReply({
					embeds: [embed],
					content: `Failed to upload video. **Download:** ${videoUrl}`,
				});
			}
		}

		await interaction.editReply({
			embeds: [errorEmbed("No downloadable media found in this post.")],
		});
	})
	.build();
