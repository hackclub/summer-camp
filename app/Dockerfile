# ---- Build stage ----
FROM node:24-alpine AS build

WORKDIR /app

# Install dependencies (including dev deps needed to build)
COPY package.json package-lock.json ./
RUN npm ci

# Build the app
COPY . .
RUN npm run build

# Drop dev dependencies so only runtime deps are copied forward
RUN npm prune --omit=dev

# ---- Runtime stage ----
FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production
# adapter-node listens on PORT (default 3000)
ENV PORT=3000

# Copy only what the server needs at runtime. Migrations ship in the image and
# run programmatically at boot (see src/lib/server/db/index.ts).
COPY --from=build /app/build ./build
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 3000

# Required env at runtime: DATABASE_URL, ORIGIN, RESEND_API_KEY, EMAIL_FROM,
# HC_OIDC_CLIENT_ID, HC_OIDC_CLIENT_SECRET, AIRTABLE_API_KEY, YSWS_BASE_ID,
# CDN_API_KEY, ADMIN_EMAILS, SYNC_ENABLED
CMD ["node", "build"]
