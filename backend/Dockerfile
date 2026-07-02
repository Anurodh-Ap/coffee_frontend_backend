# ── Hillside Coffee · Backend ──
# Node.js Express API server

FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json ./
RUN npm install --omit=dev

# Copy source code
COPY server.js ./

# Expose the API port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
