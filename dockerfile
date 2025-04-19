FROM node:16-alpine

WORKDIR /app

# Install express explicitly regardless of package.json
RUN npm init -y && \
    npm install express body-parser

# Now copy the application files
COPY . .

# Make sure data directory exists with correct permissions
RUN mkdir -p /app/data && \
    chown -R node:node /app

# Expose port
EXPOSE 3000

# Switch to non-root user
USER node

# Start command
CMD ["node", "server.js"]