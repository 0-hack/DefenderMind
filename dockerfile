FROM node:16-alpine

WORKDIR /app

# Install all necessary dependencies explicitly
RUN npm init -y && \
    npm install express body-parser cors

# Copy package.json first to leverage Docker cache
COPY package.json package-lock.json* ./

# Install npm dependencies
RUN npm install

# Now copy the application files
COPY . .

# Make sure data directory exists with correct permissions
RUN mkdir -p /app/data && \
    chown -R node:node /app

# Expose port
EXPOSE 3000

# Switch to non-root user
USER node

# Start command with error handling
CMD ["node", "server.js"]
