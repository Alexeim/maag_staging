# Stage 1: Build the project artifacts
FROM node:24-alpine AS builder

# Set the working directory
WORKDIR /usr/src/app

# Copy package manifests and install all dependencies, including devDependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the project and compile TypeScript to JavaScript
RUN npm run build

# Keep only production dependencies for the final image
RUN npm prune --production

# ---


# Stage 2: Create the runtime image
FROM node:24-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package manifests for npm start
COPY package*.json ./

# Copy the prepared artifacts from the builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Run the compiled application
CMD [ "npm", "start" ]
