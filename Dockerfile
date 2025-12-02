FROM node:16-alpine

# Create app directory
WORKDIR /usr/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# For production, consider using: npm ci --only=production

# Bundle app source
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /usr/app
USER nodejs

# MongoDB connection will be configured via environment variables in deployment
# MONGODB_HOST, MONGODB_PORT, MONGODB_DATABASE will be set by Kubernetes

EXPOSE 8080

CMD [ "node", "index.js" ]
