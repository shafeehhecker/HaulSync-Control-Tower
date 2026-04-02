FROM node:20-slim

# Install OpenSSL — required by Prisma's query engine on Debian/slim images
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

# Install all deps (prisma CLI needed at runtime for db push)
RUN npm install

COPY prisma ./prisma

# Generate Prisma client at build time
RUN npx prisma generate

COPY src ./src

EXPOSE 5002

# Push schema to DB, seed initial data, then start server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node prisma/seed.js && node src/server.js"]
