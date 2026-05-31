import { SlashCommandBuilder } from "discord.js";
import { GUARDS } from "./guards.js";

export { GuardError } from "./guards.js";

/**
 * @typedef {object} CommandDefinition
 * @property {SlashCommandBuilder} data
 * @property {Function} execute
 * @property {{ category: string, usage: string }} meta
 */

/**
 * Fluent builder for Discord slash commands.
 *
 * @example
 *   export const { data, execute, meta } = new CommandBuilder()
 *     .setName("ping")
 *     .setDescription("Check bot latency")
 *     .setCategory("utility")
 *     .setHandler(async (i) => i.reply("Pong!"))
 *     .build();
 */
export class CommandBuilder {
	#def = {
		name: "",
		description: "",
		category: "utility",
		usage: "",
		guards: [],
		handler: async () => {},
		builderFn: null,
	};

	/** @param {string} name */
	setName(name) {
		this.#def.name = name.toLowerCase();
		return this;
	}

	/** @param {string} text */
	setDescription(text) {
		this.#def.description = text;
		return this;
	}

	/** @param {string} category */
	setCategory(category) {
		this.#def.category = category;
		return this;
	}

	/** @param {string} text */
	setUsage(text) {
		this.#def.usage = text;
		return this;
	}

	/**
	 * Pass a function that receives the SlashCommandBuilder and adds options/permissions.
	 * @param {(builder: SlashCommandBuilder) => SlashCommandBuilder} fn
	 */
	setOptions(fn) {
		this.#def.builderFn = fn;
		return this;
	}

	/**
	 * Attach guards by name ("owner", "admin", "guild") or by custom function.
	 * @param {...(string|Function)} guards
	 */
	setGuard(...guards) {
		for (const g of guards.flat()) {
			if (typeof g === "function") {
				this.#def.guards.push(g);
				continue;
			}
			if (!GUARDS[g])
				throw new Error(
					`Unknown guard: "${g}". Available: ${Object.keys(GUARDS).join(", ")}`
				);
			this.#def.guards.push(GUARDS[g]);
		}
		return this;
	}

	/** @param {(interaction: import('discord.js').ChatInputCommandInteraction) => Promise<void>} fn */
	setHandler(fn) {
		this.#def.handler = fn;
		return this;
	}

	/**
	 * Finalize and return the command definition object.
	 * @returns {CommandDefinition}
	 */
	build() {
		const def = this.#def;
		if (!def.name) throw new Error("CommandBuilder: name is required.");
		if (!def.description)
			throw new Error("CommandBuilder: description is required.");

		const builder = new SlashCommandBuilder()
			.setName(def.name)
			.setDescription(def.description);
		if (def.builderFn) def.builderFn(builder);

		const { guards, handler } = def;

		return {
			data: builder,
			meta: {
				category: def.category,
				usage: def.usage || `/${def.name}`,
			},
			/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
			async execute(interaction) {
				for (const guard of guards) await guard(interaction);
				await handler(interaction);
			},
		};
	}
}
