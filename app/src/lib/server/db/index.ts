import { building } from '$app/environment';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

// During `vite build`, SvelteKit's analyse step imports server modules with no
// runtime env — skip connecting entirely; nothing touches `db` at build time.
function connect() {
	if (!env.DATABASE_URL) {
		throw new Error('DATABASE_URL environment variable is required');
	}
	const client = postgres(env.DATABASE_URL, { max: 10 });
	return drizzle(client, { schema });
}

export const db = building ? (null as unknown as ReturnType<typeof connect>) : connect();

// Committed migrations ship in the Docker image (./drizzle) and run once at
// boot, so deploys are a single `node build` with no separate migrate step.
let migrated = false;
export async function runMigrations() {
	if (migrated || building) return;
	migrated = true;
	await migrate(db, { migrationsFolder: 'drizzle' });
}
