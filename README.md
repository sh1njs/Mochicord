# Mochi — Discord Bot

A modular, scalable Discord bot built with **discord.js v14**.  
Clean architecture · Unified local JSON database · Professional logging · Slash commands

---

## Project Structure

```
mochi/
├── src/
│   ├── commands/
│   │   ├── moderation/     # ban, kick, announce
│   │   ├── utility/        # ping, help
│   │   ├── automod/        # badword, welcome
│   │   └── owner/          # eval, exec
│   │
│   ├── events/
│   │   ├── client/         # ready, interactionCreate
│   │   ├── guild/          # guildCreate, guildMemberAdd
│   │   └── message/        # messageCreate (automod)
│   │
│   ├── handlers/
│   │   ├── commandHandler.js   # Recursive command loader
│   │   ├── eventHandler.js     # Recursive event loader
│   │   └── deployHandler.js    # Slash command deployer (npm run deploy)
│   │
│   ├── services/
│   │   ├── automod/
│   │   │   ├── badwordService.js
│   │   │   └── welcomeService.js
│   │   └── guild/
│   │       └── guildService.js
│   │
│   ├── database/
│   │   ├── schema/
│   │   │   └── index.js    # ServerSchema, UserSchema, SettingsSchema
│   │   └── local.js        # LocalDB — unified JSON database
│   │
│   ├── structures/
│   │   └── Command.js      # Base class for all commands
│   │
│   ├── utils/
│   │   ├── logger.js       # Colored, timestamped logger
│   │   ├── embeds.js       # Reusable embed builders
│   │   ├── permissions.js  # Bot/member permission helpers
│   │   ├── constants.js    # Shared constants
│   │   └── helpers.js      # Generic utility functions
│   │
│   ├── config/
│   │   └── config.js       # Centralized config values
│   │
│   ├── client.js           # Discord client factory
│   └── index.js            # Entry point
│
├── sessions/
│   └── database.json       # Auto-created on first run
│
├── .env                    # Secret tokens (never commit this)
├── package.json
└── README.md
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```env
DISCORD_TOKEN=your_token_here
CLIENT_ID=your_client_id_here
OWNER_ID=your_user_id_here
```

> `DATABASE_LOCAL_PATH` is optional — defaults to `./sessions/database.json`.

### 3. Start the bot

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

The bot will automatically register every server it's in to the database on startup.

### 4. Deploy slash commands

```bash
npm run deploy
```

Commands are deployed to **all servers** stored in the database (instant guild deploy).  
If the database has no servers yet, it falls back to a global deploy (~1 hour to propagate).

---

## Features

### Bad Word Filter (`/badword`)

| Subcommand                | Description                   |
| ------------------------- | ----------------------------- |
| `/badword enable`         | Enable the filter             |
| `/badword disable`        | Disable the filter            |
| `/badword set`            | Add words via a Discord modal |
| `/badword remove <words>` | Remove specific words         |
| `/badword list`           | Show all blocked words        |

- Disabled by default
- Per-server configuration stored in the unified database
- Case-insensitive matching with duplicate prevention
- Auto-deletes offending messages and sends a warning DM
- Temporary ban issued after reaching the warning threshold (default: 3 warnings in 24h)

### Welcome System (`/welcome`)

| Subcommand                      | Description                       |
| ------------------------------- | --------------------------------- |
| `/welcome enable`               | Enable the welcome system         |
| `/welcome disable`              | Disable the welcome system        |
| `/welcome setchannel <channel>` | Set the welcome channel           |
| `/welcome setmessage`           | Customize the message via a modal |

**Supported placeholders:**

- `{user}` — Mentions the new member
- `{server}` — Server name
- `{membercount}` — Current member count

### Moderation

| Command                   | Description                   |
| ------------------------- | ----------------------------- |
| `/ban <target> [reason]`  | Permanently ban a member      |
| `/kick <target> [reason]` | Kick a member                 |
| `/announce <message>`     | Send a formatted announcement |

### Utility

| Command | Description                   |
| ------- | ----------------------------- |
| `/ping` | Show bot and API latency      |
| `/help` | List all commands by category |

### Owner Only

| Command         | Description                                   |
| --------------- | --------------------------------------------- |
| `/eval <code>`  | Execute JavaScript (restricted to `OWNER_ID`) |
| `/exec <shell>` | Execute shell commands (restricted to `OWNER_ID`) |

---

## Database

All data is stored in a single JSON file at `sessions/database.json`, auto-created on first run.  
No external database or setup required.

The database is managed by `LocalDB` (`src/database/local.js`) with three collections:

| Collection  | Key        | Description                              |
| ----------- | ---------- | ---------------------------------------- |
| `servers`   | `guildId`  | Per-server config (badword, welcome)     |
| `users`     | `userId`   | Per-user data (name, warnings)           |
| `settings`  | any        | Global bot settings (reserved)           |

**Server schema:**

```json
{
  "id": "guild_id",
  "name": "Server Name",
  "badword": {
    "enabled": false,
    "words": []
  },
  "welcome": {
    "enabled": false,
    "channelId": null,
    "message": "{user} just joined **{server}**! Welcome, you are member **#{membercount}**! 🎉"
  }
}
```

**User schema:**

```json
{
  "id": "user_id",
  "name": "Username",
  "warnings": []
}
```

The database auto-saves every 10 seconds and immediately on any write operation.

---

## ➕ Adding a New Command

1. Create a file in the appropriate category folder:

    ```
    src/commands/utility/mycommand.js
    ```

2. Use the `Command` base class:

    ```js
    import { Command } from "#structures/Command";
    import { successEmbed } from "#utils/embeds";

    class MyCommand extends Command {
    	constructor() {
    		super("mycommand", "Does something cool.", {
    			category: "utility",
    			usage: "/mycommand",
    		});
    	}

    	async run(interaction) {
    		await interaction.reply({ embeds: [successEmbed("It works!")] });
    	}
    }

    const cmd = new MyCommand();
    export const data = cmd.data;
    export const execute = (i) => cmd.execute(i);
    export const meta = cmd.meta;
    ```

3. Redeploy with `npm run deploy`. The handler picks it up automatically.

---

## ➕ Adding a New Event

1. Create a file in the appropriate subfolder:

    ```
    src/events/guild/myevent.js
    ```

2. Export `name`, `execute`, and optionally `once`:

    ```js
    import { Events } from "discord.js";

    export const name = Events.GuildDelete;

    export async function execute(guild) {
    	console.log(`Left guild: ${guild.name}`);
    }
    ```

No registration needed — the event handler discovers it automatically.

---

## Configuration

All tuneable values are in `src/config/config.js`:

- Embed colors
- Automod warning thresholds (`maxWarnings`, `warningExpiry`)
- Temp ban duration (`tempBanDuration`)
- Required bot permissions

---

## Requirements

- Node.js **18+** (for top-level `await`)
- discord.js **v14**
- A Discord bot application with the following intents enabled in the developer portal:
    - **Server Members Intent**
    - **Message Content Intent**
