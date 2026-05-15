import { EmbedBuilder, MessageFlags, AttachmentBuilder } from 'discord.js';
import { Command } from '#structures/Command';
import { errorEmbed, infoEmbed } from '#utils/embeds';
import { config } from '#config';
import fesnuk from '#scrapers/facebook';

/**
 * `/facebook` — Download and display Facebook video/image posts.
 * Fetches media from a Facebook URL and sends it to the channel.
 */
class FacebookCommand extends Command {
	constructor() {
		super('facebook', 'Download Facebook videos or images from a URL.', {
			category: 'download',
			usage: '/facebook <url>',
		});

		this.data.addStringOption(opt =>
			opt.setName('url')
				.setDescription('Facebook post/video URL.')
				.setRequired(true)
		);
	}

	/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
	async run(interaction) {
		const input = interaction.options.getString('url');

		if (!input.includes('facebook.com') && !input.includes('fb.watch')) {
			return interaction.reply({
				embeds: [errorEmbed('Please provide a valid Facebook URL.')],
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
				embeds: [errorEmbed('Failed to download. The URL may be invalid or the content is unavailable.')],
			});
		}

		let description = `**Type:** ${result.type === 'video' ? '🎥 Video' : '🖼️ Post'}\n`;
		description += `**Title:** ${result.title || 'Facebook'}\n`;
		description += `**Source:** [View Original](${result.url})\n`;

		if (result.externalUrl) {
			description += `**External Link:** ${result.externalUrl}\n`;
		}

		if (result.comments && Array.isArray(result.comments) && result.comments.length > 0) {
			description += '\n💬 **Top Comments:**\n';
			const topComments = result.comments.slice(0, 3);
			for (const comment of topComments) {
				if (comment.text && comment.text.trim() !== '') {
					description += `• **${comment.author.name}:** ${comment.text}\n`;
				}
			}
		}

		const embed = new EmbedBuilder()
			.setColor(config.color.default)
			.setTitle('Facebook Media')
			.setDescription(description.trim())
			.setFooter({ text: 'Facebook Downloader' })
			.setTimestamp();

		if (result.type === 'image' && Array.isArray(result.image) && result.image.length > 0) {
			embed.setImage(result.image[0]);
			await interaction.editReply({ embeds: [embed] });

			for (let i = 1; i < result.image.length; i++) {
				const additionalEmbed = new EmbedBuilder()
					.setColor(config.color.default)
					.setImage(result.image[i]);
				
				await interaction.followUp({ embeds: [additionalEmbed] });
			}
			return;
		}

		if (result.type === 'video' && (result.hd || result.sd)) {
			const videoUrl = result.hd || result.sd;
			const quality = result.hd ? 'HD' : 'SD';
			
			embed.addFields({ name: 'Quality', value: quality, inline: true });
			embed.setDescription(description.trim());

			try {
				await interaction.editReply({
					content: `**Download:** ${videoUrl}`,
					embeds: [embed],
				});
			} catch {
				await interaction.editReply({
					embeds: [embed],
				});
			}
			return;
		}

		await interaction.editReply({
			embeds: [errorEmbed('No downloadable media found in this post.')],
		});
	}
}

const cmd = new FacebookCommand();
export const data = cmd.data;
export const execute = (i) => cmd.execute(i);
export const meta = cmd.meta;