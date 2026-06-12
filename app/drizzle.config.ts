import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		// Only needed for drizzle-kit CLI commands (studio / push); the app runs
		// committed migrations itself at boot.
		url: process.env.DATABASE_URL ?? 'postgres://localhost:5432/summercamp'
	}
});
