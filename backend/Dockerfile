FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Run the app
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY . .

# Expose port
EXPOSE 3333

# Run
CMD ["bun", "run", "src/index.ts"]
