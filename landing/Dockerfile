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

# Copy only what the server needs at runtime
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 3000

# API_KEY and BASE_ID must be provided at runtime, e.g.:
#   docker run -p 3000:3000 -e API_KEY=... -e BASE_ID=... hc-summer-camp
CMD ["node", "build"]
