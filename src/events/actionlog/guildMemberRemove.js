import { memberLeaveEmbed, sendLog } from "#services/guild/actionlogService";
import { Events } from "discord.js";

export const name = Events.GuildMemberRemove;

/** @param {import('discord.js').GuildMember} member */
export async function execute(member) {
  if (member.partial) return;
  const embed = memberLeaveEmbed(member);
  await sendLog(member.guild, embed);
}
