# Agent Notes

## Commands
- Use Bun, not npm/pnpm. Install with `bun install`; `bun.lock` is the source lockfile.
- Run the bot with `bun start` (`bun src/index.js`, entrypoint `src/index.js`).
- Format with `bun run lint:fix` (Prettier over the whole repo). There is no lint check script.
- There is no test script; do not use `bun test` as verification unless tests are added.

## Local Setup
- Runtime config is loaded from environment variables through `config.js`.
- Required variables are `DISCORD_TOKEN` and `MYSQL_URL`; startup exits if either is missing or if MySQL connection/authentication fails.
- Sequelize auto-syncs every `.js` file under `src/models` on startup. The current model maps `Away` to the `apontamentos` table.

## Architecture
- `src/index.js` connects the database, creates a Discord.js `Client` with only `GatewayIntentBits.Guilds`, loads commands/buttons on `ClientReady`, logs in, and starts cron jobs.
- Slash commands are recursively discovered from `src/interactions/Command`; each module must export `{ data: SlashCommandBuilder, execute }`.
- Loading commands also refreshes global Discord application commands with `Routes.applicationCommands(client.application.id)`, so startup can mutate registered slash commands.
- Buttons are recursively discovered from `src/interactions/Button`; each module must export `{ data, execute }`, where `data.name` is matched against `interaction.customId` and optional `data.startsWith` enables prefix matching.
- `src/controllers/timer.js` centralizes timer/absence persistence and embed construction; both `/ausente`, `/retornar`, `/timer`, and button handlers use it.
- Scheduled jobs in `src/jobs.js` run in `America/Sao_Paulo`: active timer reminders every 5 minutes on weekdays 07:00-19:00, and daily summaries at 18:30 on weekdays.

## Style
- CommonJS only (`require`/`module.exports`).
- `.editorconfig` requires 2-space indentation.
