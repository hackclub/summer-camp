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
	role: text('role', { enum: ['camper', 'admin'] })
		.notNull()
		.default('camper'),
	banned: boolean('banned').notNull().default(false),
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

export const projects = pgTable('projects', {
	id: id(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
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
	syncedAt: timestamp('synced_at', { withTimezone: true })
});

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
	createdAt: createdAt()
});

export const shopOrders = pgTable('shop_orders', {
	id: id(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	itemId: text('item_id')
		.notNull()
		.references(() => shopItems.id),
	pricePoints: integer('price_points').notNull(), // snapshot at purchase
	status: text('status', { enum: ['pending', 'fulfilled', 'rejected', 'canceled'] })
		.notNull()
		.default('pending'),
	address: jsonb('address').$type<{
		line1: string;
		line2?: string;
		city: string;
		state: string;
		zip: string;
		country: string;
	} | null>(),
	createdAt: createdAt(),
	fulfilledBy: text('fulfilled_by').references(() => users.id),
	fulfilledAt: timestamp('fulfilled_at', { withTimezone: true })
});

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
export type ShopItem = typeof shopItems.$inferSelect;
export type ShopOrder = typeof shopOrders.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
