# Summer Camp — camper app

The participant dashboard for Hack Club Summer Camp (June 23 – July 17, weekdays 12–3 PM ET):
schedule + live-session hub, project shipping + gallery, attendance-based points, prize shop, and
the admin panel that runs it all. The marketing/RSVP page lives in `../landing`.

## Stack

SvelteKit 2 / Svelte 5 / Tailwind 4 / TypeScript, Postgres via Drizzle ORM, adapter-node in
Docker on Orchard. Auth is email magic links; Hack Club Identity (OIDC) is a step-up required
only to ship a project or order a physical prize. Attendance hours are entered by admins per
camp day and sync to the Unified YSWS Airtable every 5 minutes.

## Develop

```bash
npm install
cp .env.example .env   # fill in at least DATABASE_URL
npm run db:generate    # after schema changes
npm run dev
```

Migrations in `./drizzle` run automatically at boot. In dev, magic-link emails are logged to the
console instead of sent. The first login from an email listed in `ADMIN_EMAILS` becomes an admin;
visit `/admin/days` and hit "Seed" to create the 19 camp days.

## Test / build

```bash
npm test         # camp-time state machine unit tests
npm run check    # svelte-check
npm run build
docker build -t hc-summer-camp-app .
```
