/**
 * @fileoverview /instagram — Download Instagram posts, reels, or stories.
 * Requires IG_SESSION_ID in .env.
 */
import { config } from "#config";
import { downloadInstagram } from "#scrapers/instagram";
import { CommandBuilder } from "#structures/CommandBuilder";
import { errorEmbed } from "#utils/embeds";
import { AttachmentBuilder, EmbedBuilder, MessageFlags } from "discord.js";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB Discord limit

export const { data, execute, meta } = new CommandBuilder()
	.setName("instagram")
	.setDescription("Download Instagram posts, reels, or stories.")
	.setCategory("download")
	.setUsage("/instagram <url>")
	.setOptions((builder) =>
		builder.addStringOption((opt) =>
			opt
				.setName("url")
				.setDescription("Instagram post, reel, or story URL.")
				.setRequired(true)
		)
	)
	.setHandler(async (interaction) => {
		const url = interaction.options.getString("url");

		if (!url.includes("instagram.com") && !url.includes("instagr.am")) {
			return interaction.reply({
				embeds: [errorEmbed("Please provide a valid Instagram URL.")],
				flags: MessageFlags.Ephemeral,
			});
		}

		await interaction.deferReply();

		let result;
		try {
			result = await downloadInstagram(url);
		} catch (err) {
			return interaction.editReply({
				embeds: [errorEmbed(`Failed to fetch: ${err.message}`)],
			});
		}

		const embed = new EmbedBuilder()
			.setColor(config.color.default)
			.setTitle("Instagram Media")
			.setFooter({ text: `@${result.author.username}` })
			.setTimestamp();

		if (result.caption) {
			embed.setDescription(result.caption.slice(0, 2000));
		}

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
			}
		);

		if (result.stats.views) {
			embed.addFields({
				name: "👁️ Views",
				value: String(result.stats.views),
				inline: true,
			});
		}

		const files = [];
		const tooLarge = [];

		for (let i = 0; i < result.media.length; i++) {
			const item = result.media[i];
			try {
				const res = await fetch(item.url);
				const buf = await res.arrayBuffer();

				if (buf.byteLength > MAX_FILE_SIZE) {
					tooLarge.push(item.url);
					continue;
				}

				const ext = item.type === "video" ? "mp4" : "jpg";
				const name = `instagram-${i + 1}.${ext}`;
				files.push(new AttachmentBuilder(Buffer.from(buf), { name }));
			} catch {
				tooLarge.push(item.url);
			}
		}

		if (tooLarge.length) {
			embed.addFields({
				name: "⚠️ Too large to upload",
				value: tooLarge
					.map((u, i) => `[File ${i + 1}](${u})`)
					.join("\n"),
			});
		}

		await interaction.editReply({ embeds: [embed], files });
	})
	.build();
