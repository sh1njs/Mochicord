import { config } from "#config";
import { Command } from "#structures/Command";
import { truncate } from "#utils/helpers";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";

const ICONS = {
  moderation: "🔨",
  download: "📤",
  utility: "🔧",
  automod: "🛡️",
  owner: "👑",
};

/**
 * Build a single page embed for a given category.
 *
 * @param {string} category
 * @param {string[]} lines
 * @param {import('discord.js').Client} client
 * @param {number} pageIndex  0-based current page
 * @param {number} totalPages total number of category pages
 */
function buildEmbed(category, lines, client, pageIndex, totalPages) {
  const icon = ICONS[category] ?? "📁";
  const title = `${icon} ${category.charAt(0).toUpperCase() + category.slice(1)}`;

  return new EmbedBuilder()
    .setColor(config.color.default)
    .setTitle(`${client.user.username} — ${title}`)
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription(lines.join("\n"))
    .setFooter({
      text: `Page ${pageIndex + 1} of ${totalPages} · ${client.commands.size} commands loaded`,
    })
    .setTimestamp();
}

/**
 * Build the navigation row with Prev / Next buttons.
 *
 * @param {number} pageIndex
 * @param {number} totalPages
 * @param {string} interactionId  unique ID prefix to avoid cross-user conflicts
 */
function buildRow(pageIndex, totalPages, interactionId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`help_prev_${interactionId}`)
      .setLabel("◀ Prev")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pageIndex === 0),
    new ButtonBuilder()
      .setCustomId(`help_next_${interactionId}`)
      .setLabel("Next ▶")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pageIndex === totalPages - 1),
  );
}

/**
 * `/help` — Shows commands per category with Prev/Next navigation.
 */
class HelpCommand extends Command {
  constructor() {
    super("help", "Show all available commands grouped by category.", {
      category: "utility",
      usage: "/help",
    });
  }

  /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
  async run(interaction) {
    // Build sorted category pages
    const categories = new Map();

    for (const [, command] of interaction.client.commands) {
      const category = command.meta?.category ?? "misc";
      if (!categories.has(category)) categories.set(category, []);

      const usage = command.meta?.usage ?? `/${command.data.name}`;
      const desc = truncate(command.data.description, 60);
      categories.get(category).push(`\`${usage}\` — ${desc}`);
    }

    const pages = [...categories.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    );

    if (pages.length === 0) {
      await interaction.reply({
        content: "No commands found.",
        ephemeral: true,
      });
      return;
    }

    let currentPage = 0;
    const uid = interaction.id; // unique per interaction → no cross-user collision

    const embed = buildEmbed(
      pages[currentPage][0],
      pages[currentPage][1],
      interaction.client,
      currentPage,
      pages.length,
    );
    const row = buildRow(currentPage, pages.length, uid);

    const reply = await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
      fetchReply: true,
    });

    // Collect button clicks for 2 minutes
    const collector = reply.createMessageComponentCollector({
      filter: (btn) =>
        btn.user.id === interaction.user.id &&
        (btn.customId === `help_prev_${uid}` ||
          btn.customId === `help_next_${uid}`),
      time: 120_000,
    });

    collector.on("collect", async (btn) => {
      if (btn.customId === `help_next_${uid}`) currentPage++;
      else if (btn.customId === `help_prev_${uid}`) currentPage--;

      await btn.update({
        embeds: [
          buildEmbed(
            pages[currentPage][0],
            pages[currentPage][1],
            interaction.client,
            currentPage,
            pages.length,
          ),
        ],
        components: [buildRow(currentPage, pages.length, uid)],
      });
    });

    collector.on("end", async () => {
      // Disable buttons after timeout
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`help_prev_${uid}_done`)
          .setLabel("◀ Prev")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(`help_next_${uid}_done`)
          .setLabel("Next ▶")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
      );
      await interaction
        .editReply({ components: [disabledRow] })
        .catch(() => {});
    });
  }
}

const cmd = new HelpCommand();
export const data = cmd.data;
export const execute = (i) => cmd.execute(i);
export const meta = cmd.meta;
