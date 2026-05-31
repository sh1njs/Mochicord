/**
 * @fileoverview /tiktok — Download TikTok videos (HD with SD fallback).
 * Uses tikwm.com API, no API key required.
 */
import { config } from "#config";
import { downloadTikTok } from "#scrapers/tiktok";
import { CommandBuilder } from "#structures/CommandBuilder";
import { errorEmbed } from "#utils/embeds";
import { AttachmentBuilder, EmbedBuilder, MessageFlags } from "discord.js";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export const { data, execute, meta } = new CommandBuilder()
	.setName("tiktok")
	.setDescription("Download a TikTok video (HD with SD fallback).")
	.setCategory("download")
	.setUsage("/tiktok <url>")
	.setOptions((builder) =>
		builder.addStringOption((opt) =>
			opt
				.setName("url")
				.setDescription("TikTok video URL.")
				.setRequired(true)
		)
	)
	.setHandler(async (interaction) => {
		const url = interaction.options.getString("url");

		if (!url.includes("tiktok.com") && !url.includes("vm.tiktok.com")) {
			return interaction.reply({
				embeds: [errorEmbed("Please provide a valid TikTok URL.")],
				flags: MessageFlags.Ephemeral,
			});
		}

		await interaction.deferReply();

		let result;
		try {
			result = await downloadTikTok(url);
		} catch (err) {
			return interaction.editReply({
				embeds: [errorEmbed(`Failed to fetch: ${err.message}`)],
			});
		}

		const embed = new EmbedBuilder()
			.setColor(config.color.default)
			.setTitle(result.title?.slice(0, 256) || "TikTok Video")
			.setFooter({
				text: `@${result.author.name} • ${result.author.nickname}`,
			})
			.setTimestamp();

		embed.addFields(
			{
				name: "❤️ Likes",
				value: String(result.stats.likes),
				inline: true,
			},
			{
				name: "💬 Comments",
				value: String(result.stats.comments),
				inline: true,
			},
			{
				name: "🔗 Shares",
				value: String(result.stats.shares),
				inline: true,
			},
			{
				name: "👁️ Views",
				value: String(result.stats.views),
				inline: true,
			}
		);

		if (result.musicInfo?.title) {
			embed.addFields({
				name: "🎵 Music",
				value: `${result.musicInfo.title} — ${result.musicInfo.author}`,
			});
		}

		// Image slideshow type
		if (result.images?.length) {
			const files = [];
			for (let i = 0; i < Math.min(result.images.length, 5); i++) {
				try {
					const res = await fetch(result.images[i]);
					const buf = await res.arrayBuffer();
					if (buf.byteLength <= MAX_FILE_SIZE) {
						files.push(
							new AttachmentBuilder(Buffer.from(buf), {
								name: `tiktok-${i + 1}.jpg`,
							})
						);
					}
				} catch {}
			}
			return interaction.editReply({ embeds: [embed], files });
		}

		// Video
		if (!result.video) {
			return interaction.editReply({
				embeds: [
					errorEmbed("No downloadable media found for this TikTok."),
				],
			});
		}

		try {
			const res = await fetch(result.video);
			const buf = await res.arrayBuffer();

			if (buf.byteLength > MAX_FILE_SIZE) {
				return interaction.editReply({
					embeds: [embed],
					content: `⚠️ Video too large (${(buf.byteLength / 1024 / 1024).toFixed(1)} MB). [Download directly](${result.video})`,
				});
			}

			const file = new AttachmentBuilder(Buffer.from(buf), {
				name: "tiktok.mp4",
			});
			await interaction.editReply({ embeds: [embed], files: [file] });
		} catch {
			await interaction.editReply({
				embeds: [embed],
				content: `Failed to upload. [Download directly](${result.video})`,
			});
		}
	})
	.build();
