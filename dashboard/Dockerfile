FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
COPY ui/package.json ui/bun.lock ./ui/
RUN bun install --frozen-lockfile
RUN cd ui && bun install --frozen-lockfile

# Build SolidJS UI
COPY ui/ ./ui/
RUN cd ui && bun run build

# Copy server
COPY server/ ./server/

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["bun", "run", "server/index.ts"]
