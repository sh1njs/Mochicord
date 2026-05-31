# Mochicord

A modular, scalable Discord bot built with [discord.js v14](https://discord.js.org/) and `better-sqlite3`. Features slash commands, a guard system, server automod, media downloaders, and a flexible dual-backend database (SQLite or JSON).

> Built by [sh1njs](https://github.com/sh1njs)

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Commands](#commands)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Bot](#running-the-bot)
  - [Deploying Slash Commands](#deploying-slash-commands)
- [Adding a New Command](#adding-a-new-command)
- [Guard System](#guard-system)
- [Database](#database)
- [Events](#events)
- [Deployment](#deployment)
- [Tech Stack](#tech-stack)

---

## Features

- Slash command handler with auto-discovery (no manual registration in code)
- Fluent `CommandBuilder` API for writing clean, consistent commands
- Built-in guard system (`owner`, `admin`, `moderator`, `guild`)
- Automod: bad word filter, welcome messages, action logging
- Media downloaders: TikTok, Instagram (posts/reels/stories), Facebook
- Moderation commands: ban, kick, announce
- Dual database backend: SQLite (default) or JSON flat-file
- Paginated `/help` command with category grouping
- Smart deploy script — only pushes to guilds with new commands

---

## Project Structure

```
src/
├── index.js                  # Entry point — loads commands, events, connects
├── client.js                 # Creates and configures the Discord client
├── config/
│   └── config.js             # Bot-wide config (colors, automod thresholds)
├── commands/
│   ├── automod/              # actionlog, badword, welcome
│   ├── download/             # facebook, instagram, tiktok
│   ├── moderation/           # announce, ban, kick
│   ├── owner/                # eval, exec
│   └── utility/              # help, ping
├── events/
│   ├── actionlog/            # Message/voice/emoji/sticker event listeners
│   ├── client/               # interactionCreate, ready
│   ├── guild/                # guildCreate, guildMemberAdd
│   └── message/              # messageCreate (badword filter)
├── handlers/
│   ├── commandHandler.js     # Recursively loads commands into client.commands
│   ├── eventHandler.js       # Recursively registers event listeners
│   └── deployHandler.js      # Deploys slash commands to Discord
├── services/
│   ├── automod/              # badwordService, welcomeService
│   ├── guild/                # actionlogService, guildService
│   └── scrapers/             # facebook, instagram, tiktok scrapers
├── structures/
│   ├── Command.js            # Legacy base class (deprecated, use CommandBuilder)
│   ├── CommandBuilder.js     # Fluent builder for slash commands
│   └── guards.js             # Guard system (owner, admin, moderator, guild)
├── database/
│   ├── index.js              # DB factory — returns SqliteDB or JsonDB
│   └── schema/
│       └── index.js          # Schemas for users, servers, settings
└── utils/
    ├── constants.js          # Shared constants (e.g. welcome placeholders)
    ├── embeds.js             # Embed factory helpers
    ├── helpers.js            # Misc utilities (truncate, parseCommaSeparated)
    ├── logger.js             # Colored console logger
    └── permissions.js       # Bot permission checker
```

---

## Commands

### Utility

| Command | Description |
|---------|-------------|
| `/ping` | Check bot and API latency |
| `/help` | Browse all commands grouped by category (paginated) |

### Moderation

| Command | Description | Required Permission |
|---------|-------------|---------------------|
| `/ban <target> [reason]` | Permanently ban a member | Ban Members |
| `/kick <target> [reason]` | Kick a member from the server | Kick Members |
| `/announce <title> <message>` | Send a formatted announcement embed | Administrator |

### Automod

| Command | Description | Required Permission |
|---------|-------------|---------------------|
| `/badword <enable\|disable\|set\|remove\|list>` | Manage the bad word filter | Manage Guild |
| `/welcome <enable\|disable\|setchannel\|setmessage\|status>` | Configure welcome messages | Manage Guild |
| `/actionlog <enable\|disable\|setchannel\|status>` | Configure the server action log | Manage Guild |

**Action log tracks:** message deletions, message edits, member joins/leaves, voice state changes, emoji and sticker additions/removals.

**Welcome message placeholders:** `{user}`, `{server}`, `{membercount}`

### Download

| Command | Description |
|---------|-------------|
| `/tiktok <url>` | Download a TikTok video (HD with SD fallback) |
| `/instagram <url>` | Download Instagram posts, reels, or stories |
| `/facebook <url>` | Download Facebook videos or images |

> Files over 25 MB (Discord's upload limit) will be sent as direct download links instead.

### Owner

| Command | Description |
|---------|-------------|
| `/eval <code>` | Execute arbitrary JavaScript (owner only) |
| `/exec <command>` | Execute shell commands (owner only) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A Discord bot application — create one at the [Discord Developer Portal](https://discord.com/developers/applications)

### Installation

```bash
git clone https://github.com/sh1njs/mochicord.git
cd mochicord
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | ✅ | Your bot token from the Developer Portal |
| `CLIENT_ID` | ✅ | Application (client) ID of your bot |
| `OWNER_ID` | ✅ | Your Discord user ID (enables owner-only commands) |
| `DB_TYPE` | — | `sqlite` (default) or `json` |
| `DB_PATH` | — | Path to the SQLite file (default: `./data/mochi.db`) |
| `DB_JSON_PATH` | — | Path to the JSON file (default: `./data/database.json`) |
| `IG_SESSION_ID` | — | Instagram session cookie — required for `/instagram` |
| `IG_DS_USER_ID` | — | Required for Instagram story videos |
| `IG_MID` | — | Required for Instagram story videos |
| `IG_DID` | — | Required for Instagram story videos |

**Where to get your bot token and client ID:**
1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Select your application → **Bot** tab → copy the token
3. **General Information** tab → copy the **Application ID**

**Where to get your Instagram cookies:**
1. Log in to Instagram in your browser
2. Open DevTools → **Application** tab → **Cookies** → `https://www.instagram.com`
3. Copy the values for `sessionid`, `ds_user_id`, `mid`, and `ig_did`

**Required bot intents** (enable in Developer Portal → Bot → Privileged Gateway Intents):
- Server Members Intent
- Message Content Intent

### Running the Bot

```bash
# Production
npm start

# Development (auto-restarts on file changes)
npm run dev
```

### Deploying Slash Commands

Before commands are usable, they need to be registered with Discord. Run the deploy script after starting the bot at least once (so the database has a guild list):

```bash
npm run deploy
```

The deploy script is smart — it only pushes to guilds where new commands are detected. To force a full re-deploy to all guilds:

```bash
npm run deploy -- --force
```

If no guilds are found in the database yet, it falls back to a global deploy (may take up to 1 hour to propagate).

---

## Adding a New Command

1. Create a `.js` file inside the appropriate category folder under `src/commands/`. For a new category, just create a new subfolder — the handler will pick it up automatically.

2. Use `CommandBuilder` to define and export your command:

```js
// src/commands/utility/greet.js
import { CommandBuilder } from '#structures/CommandBuilder';
import { successEmbed } from '#utils/embeds';

export const { data, execute, meta } = new CommandBuilder()
  .setName('greet')
  .setDescription('Send a greeting to a user.')
  .setCategory('utility')
  .setUsage('/greet <user>')
  .setGuard('guild')                    // optional: restrict to guilds
  .setOptions((builder) =>
    builder.addUserOption((opt) =>
      opt.setName('user').setDescription('User to greet.').setRequired(true)
    )
  )
  .setHandler(async (interaction) => {
    const user = interaction.options.getUser('user');
    await interaction.reply({
      embeds: [successEmbed(`Hello, ${user}! 👋`)],
    });
  })
  .build();
```

3. Run `npm run deploy` to register the new command with Discord.

That's it — no other configuration needed. The command handler discovers and loads all `.js` files recursively.

---

## Guard System

Guards are pre-execution checks attached to a command via `.setGuard()`. If a guard fails, it throws a `GuardError` which is caught by `interactionCreate` and sent back as an ephemeral error message.

**Built-in guards:**

| Guard | Description |
|-------|-------------|
| `guild` | Command must be used inside a server (not DMs) |
| `admin` | User must have the Administrator permission |
| `moderator` | User must have Moderate Members (or Administrator) |
| `owner` | Restricted to the user ID set in `OWNER_ID` |

**Using multiple guards:**

```js
.setGuard('guild', 'admin')
```

**Custom guard function:**

```js
.setGuard((interaction) => {
  if (interaction.channel.name !== 'bot-commands') {
    throw new GuardError('This command can only be used in #bot-commands.');
  }
})
```

---

## Database

Mochi supports two backends, toggled via the `DB_TYPE` environment variable.

| Backend | `DB_TYPE` | Best for |
|---------|-----------|----------|
| SQLite | `sqlite` (default) | Production — persistent, performant |
| JSON | `json` | Quick testing, no native dependencies |

Both backends expose the same API through three collections: `db.users`, `db.servers`, and `db.settings`.

```js
import db from '#database';

// Read
const server = db.servers.get(guildId);

// Write / upsert (merges partial into existing record)
db.servers.set(guildId, { name: guild.name });

// Delete
db.servers.delete(guildId);

// Get all entries
const all = db.servers.all();
```

**Schemas** are defined in `src/database/schema/index.js`. New fields with default values are automatically applied on read/write.

---

## Events

Events are loaded from `src/events/**` and registered automatically. Each file must export:

| Export | Type | Description |
|--------|------|-------------|
| `name` | `string` | The discord.js event name (e.g. `'messageCreate'`) |
| `execute` | `Function` | The handler function |
| `once` | `boolean` (optional) | If `true`, registers as a one-time listener |

Example:

```js
// src/events/guild/myEvent.js
export const name = 'guildMemberAdd';
export const once = false;

export async function execute(member) {
  console.log(`${member.user.tag} joined ${member.guild.name}`);
}
```

---

## Deployment

Mochi is a standard Node.js process. Any environment that can run Node.js 18+ works.

**PM2 (recommended for VPS):**

```bash
npm install -g pm2
pm2 start src/index.js --name mochicord
pm2 save
pm2 startup
```

**Docker:**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
CMD ["node", "src/index.js"]
```

**Railway / Render / Fly.io:** Point the start command to `node src/index.js` and set the environment variables in the platform's dashboard.

---

## Tech Stack

| Package | Purpose |
|---------|---------|
| [discord.js v14](https://discord.js.org/) | Discord API wrapper |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | Synchronous SQLite driver |
| [axios](https://axios-http.com/) | HTTP client (used by scrapers) |
| [dotenv](https://github.com/motdotla/dotenv) | Environment variable loading |

---

## License

MIT © [sh1njs](https://github.com/sh1njs)
