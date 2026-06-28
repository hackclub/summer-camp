import {
	pgTable,
	text,
	boolean,
	timestamp,
	integer,
	numeric,
	date,
	jsonb,
	uniqueIndex,
	index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const id = () => text('id').primaryKey();
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const users = pgTable('users', {
	id: id(),
	email: text('email').notNull().unique(), // stored lowercased
	name: text('name'),
	slackId: text('slack_id'),
	hackClubId: text('hack_club_id'), // OIDC `sub`, set after IDV
	identityVerified: boolean('identity_verified').notNull().default(false),
	// Latest raw result from Hack Club Identity's YSWS check API (verified_eligible
	// / verified_but_over_18 / rejected / pending / needs_submission / not_found).
	// Null = never checked. identityVerified only flips true on verified_eligible.
	yswsCheckResult: text('ysws_check_result'),
	role: text('role', { enum: ['camper', 'admin'] })
		.notNull()
		.default('camper'),
	banned: boolean('banned').notNull().default(false),
	// Set when a camper finishes the first-run onboarding flow. Null = brand-new
	// account that still needs to be walked through it.
	onboardedAt: timestamp('onboarded_at', { withTimezone: true }),
	createdAt: createdAt()
});

export const magicLinkTokens = pgTable(
	'magic_link_tokens',
	{
		id: id(),
		tokenHash: text('token_hash').notNull().unique(), // sha256; raw token only ever lives in the email
		email: text('email').notNull(), // keyed by email: first login creates the user
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		consumedAt: timestamp('consumed_at', { withTimezone: true }),
		requestIp: text('request_ip'),
		createdAt: createdAt()
	},
	(t) => [index('magic_link_email_idx').on(t.email)]
);

export const authSessions = pgTable('auth_sessions', {
	// id = sha256 of the raw cookie token, so a DB leak can't forge sessions.
	id: id(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	createdAt: createdAt()
});

export const campDays = pgTable('camp_days', {
	id: id(),
	date: date('date').notNull().unique(), // YYYY-MM-DD, ET calendar date
	title: text('title').notNull(),
	description: text('description'),
	joinUrl: text('join_url'),
	recordingUrl: text('recording_url'),
	published: boolean('published').notNull().default(false),
	// Hours credited for a project shipped against this day — logged to Ari as a
	// single journal entry of (hours × 60) minutes, which satisfies Ari's time
	// requirement without Hackatime.
	hours: numeric('hours', { precision: 4, scale: 2 }).notNull().default('3'),
	// Reward for getting this day's project approved: points awarded to the camper
	// and an optional free-text prize dropped into the fulfillment queue.
	rewardPoints: integer('reward_points').notNull().default(0),
	prizeLabel: text('prize_label'), // null = no physical prize for this day
	createdAt: createdAt()
});

export const campDayMaterials = pgTable('camp_day_materials', {
	id: id(),
	campDayId: text('camp_day_id')
		.notNull()
		.references(() => campDays.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	url: text('url').notNull(),
	kind: text('kind', { enum: ['slides', 'starter', 'link'] })
		.notNull()
		.default('link'),
	sort: integer('sort').notNull().default(0)
});

export const attendance = pgTable(
	'attendance',
	{
		id: id(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		campDayId: text('camp_day_id')
			.notNull()
			.references(() => campDays.id, { onDelete: 'cascade' }),
		hours: numeric('hours', { precision: 4, scale: 2 }).notNull(),
		note: text('note'),
		enteredBy: text('entered_by').references(() => users.id),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
		// Dirty when synced_at IS NULL OR updated_at > synced_at (handles admin corrections).
		airtableRecordId: text('airtable_record_id'),
		syncedAt: timestamp('synced_at', { withTimezone: true })
	},
	(t) => [uniqueIndex('attendance_user_day_idx').on(t.userId, t.campDayId)]
);

export const projects = pgTable(
	'projects',
	{
		id: id(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		// The camp day whose workshop this project came out of. Null for projects
		// made outside a session; one project per camper per day (see index below).
		campDayId: text('camp_day_id').references(() => campDays.id, { onDelete: 'set null' }),
		title: text('title').notNull(),
		description: text('description'),
		githubUrl: text('github_url'),
		playableUrl: text('playable_url'),
		screenshotUrl: text('screenshot_url'), // single hero image on the Hack Club CDN
		status: text('status', { enum: ['building', 'submitted', 'approved', 'rejected'] })
			.notNull()
			.default('building'),
		shippedAt: timestamp('shipped_at', { withTimezone: true }),
		createdAt: createdAt(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
		airtableRecordId: text('airtable_record_id'),
		syncedAt: timestamp('synced_at', { withTimezone: true }),
		// Shipping address captured at ship time when the project's camp day has a
		// prize, so the prize grant on Ari approval has somewhere to mail it.
		shipAddress: jsonb('ship_address').$type<{
			line1: string;
			line2?: string;
			city: string;
			state: string;
			zip: string;
			country: string;
		} | null>(),
		// Hours logged to Ari for this ship (snapshot of the camp day's hours).
		loggedHours: numeric('logged_hours', { precision: 4, scale: 2 }),
		// Legacy Hackatime keys (unused — time now comes from the camp day's hours
		// sent to Ari as a journal entry). Kept to avoid a column drop.
		hackatimeProjects: text('hackatime_projects'),
		// Ari review state. ariId is Ari's own submission id (AR-####), set when a
		// decision webhook arrives. ariStatus tracks the last known Ari state and
		// ariError holds the last failed-ingest message for debugging.
		ariId: text('ari_id'),
		ariStatus: text('ari_status', {
			enum: ['queued', 'approved', 'changes', 'rejected', 'withdrawn', 'error']
		}),
		ariError: text('ari_error')
	},
	(t) => [
		uniqueIndex('projects_user_day_idx')
			.on(t.userId, t.campDayId)
			.where(sql`${t.campDayId} IS NOT NULL`)
	]
);

export const projectReviews = pgTable('project_reviews', {
	id: id(),
	projectId: text('project_id')
		.notNull()
		.references(() => projects.id, { onDelete: 'cascade' }),
	reviewerId: text('reviewer_id')
		.notNull()
		.references(() => users.id),
	action: text('action', { enum: ['approve', 'reject'] }).notNull(),
	feedback: text('feedback'),
	createdAt: createdAt()
});

export const pointsTransactions = pgTable(
	'points_transactions',
	{
		id: id(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		amount: integer('amount').notNull(), // signed
		kind: text('kind', {
			enum: ['attendance', 'ship_bonus', 'purchase', 'refund', 'adjustment']
		}).notNull(),
		refId: text('ref_id'), // attendance.id / projects.id / shop_orders.id
		note: text('note'),
		createdBy: text('created_by').references(() => users.id),
		createdAt: createdAt()
	},
	(t) => [
		// Idempotent awards: re-saving hours upserts the same ledger row.
		uniqueIndex('points_kind_ref_idx')
			.on(t.kind, t.refId)
			.where(sql`${t.refId} IS NOT NULL`),
		index('points_user_idx').on(t.userId)
	]
);

export const shopCategories = pgTable('shop_categories', {
	id: id(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	description: text('description'),
	sort: integer('sort').notNull().default(0),
	createdAt: createdAt()
});

export const shopItems = pgTable('shop_items', {
	id: id(),
	name: text('name').notNull(),
	description: text('description'),
	imageUrl: text('image_url'),
	pricePoints: integer('price_points').notNull(),
	stock: integer('stock'), // null = unlimited
	requiresAddress: boolean('requires_address').notNull().default(true),
	active: boolean('active').notNull().default(true),
	sort: integer('sort').notNull().default(0),
	categoryId: text('category_id').references(() => shopCategories.id, { onDelete: 'set null' }),
	createdAt: createdAt()
});

export const shopOrders = pgTable('shop_orders', {
	id: id(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	// Null for camp-day prize orders (which use prizeLabel instead of a shop item).
	itemId: text('item_id').references(() => shopItems.id),
	// Free-text prize for camp-day reward orders; null for normal shop purchases.
	prizeLabel: text('prize_label'),
	// The approved project that earned a prize order (unique → one prize per project).
	sourceProjectId: text('source_project_id').references(() => projects.id),
	pricePoints: integer('price_points').notNull(), // snapshot at purchase; 0 for prizes
	status: text('status', {
		enum: ['ordered', 'packed', 'shipped', 'delivered', 'refunded', 'canceled']
	})
		.notNull()
		.default('ordered'),
	trackingUrl: text('tracking_url'),
	notes: text('notes'),
	address: jsonb('address').$type<{
		line1: string;
		line2?: string;
		city: string;
		state: string;
		zip: string;
		country: string;
	} | null>(),
	createdAt: createdAt(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	fulfilledBy: text('fulfilled_by').references(() => users.id),
	fulfilledAt: timestamp('fulfilled_at', { withTimezone: true })
}, (t) => [
	// One prize order per approved project (Ari retries are idempotent).
	uniqueIndex('shop_orders_source_project_idx')
		.on(t.sourceProjectId)
		.where(sql`${t.sourceProjectId} IS NOT NULL`)
]);

export const announcements = pgTable('announcements', {
	id: id(),
	title: text('title').notNull(),
	body: text('body').notNull(), // markdown
	published: boolean('published').notNull().default(true),
	createdBy: text('created_by').references(() => users.id),
	createdAt: createdAt()
});

export type User = typeof users.$inferSelect;
export type CampDay = typeof campDays.$inferSelect;
export type CampDayMaterial = typeof campDayMaterials.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectReview = typeof projectReviews.$inferSelect;
export type ShopCategory = typeof shopCategories.$inferSelect;
export type ShopItem = typeof shopItems.$inferSelect;
export type ShopOrder = typeof shopOrders.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
