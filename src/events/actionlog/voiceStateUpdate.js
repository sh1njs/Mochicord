import { voiceStateEmbed, sendLog } from "#services/guild/actionlogService";
import { Events } from "discord.js";

export const name = Events.VoiceStateUpdate;

/**
 * @param {import('discord.js').VoiceState} oldState
 * @param {import('discord.js').VoiceState} newState
 */
export async function execute(oldState, newState) {
  const member = newState.member ?? oldState.member;
  if (!member || member.user.bot) return;

  const embed = voiceStateEmbed(oldState, newState, member);
  if (!embed) return; // no meaningful change

  await sendLog(newState.guild ?? oldState.guild, embed);
}
