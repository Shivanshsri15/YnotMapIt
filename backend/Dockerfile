# -----------------------------------------------------------------------------
# YnotMapIt backend — multi-stage image
# Stage 1: install ALL deps (including Nest CLI / TypeScript) to compile
# Stage 2: compile TypeScript → dist/
# Stage 3: slim runtime with production deps + dist + road graph JSON
# -----------------------------------------------------------------------------

# ---- Stage 1: dependencies (build + prod) ------------------------------------
FROM node:24-alpine AS deps
WORKDIR /app

# Copy only manifests first so Docker can cache npm install when source changes
COPY package.json package-lock.json ./
RUN npm ci

# ---- Stage 2: build NestJS ---------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src

# Produces /app/dist (JavaScript ESM output)
RUN npm run build

# ---- Stage 3: production runner ---------------------------------------------
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Nest listens on PORT (defaults to 3000 in main.ts)
ENV PORT=3000

# Install only runtime dependencies (no TypeScript / vitest / nest CLI)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled API
COPY --from=build /app/dist ./dist

# Prebuilt Noida graph (must exist on the host before `docker build`)
# Regenerated via: data-prep/export_noida.py
COPY data/noida-drive.json ./data/noida-drive.json

EXPOSE 3000

# GraphService resolves data/noida-drive.json relative to process.cwd() (/app)
CMD ["node", "dist/main.js"]
