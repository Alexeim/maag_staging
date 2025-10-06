# Frontend Deployment Guide: Astro on Google Cloud Run

This document provides a complete, step-by-step guide to the final, successful deployment process for the MAAG frontend application. It explains the core concepts, the problems we solved, and the automated workflow we created.

## 1. Core Principles & Technologies

Our deployment strategy is built on modern best practices for containerized web applications:

- **Platform:** Google Cloud Run (for running the final container).
- **Containerization:** Docker (for packaging the application into a portable image).
- **Build Service:** Google Cloud Build (for building the Docker image in the cloud, based on instructions).
- **Automation:** A combination of `cloudbuild.yaml`, a multi-stage `Dockerfile`, and an `npm` script to make the entire process repeatable and reliable.

The most critical concept to understand is the difference between **Build Time** and **Run Time** environment variables in Astro.

- **Build Time Vars (`PUBLIC_*`):** Variables prefixed with `PUBLIC_` are read *during the `npm run build` process*. Their values are permanently "baked into" the final JavaScript files. Changing them requires a new build. This is how our API URL and Firebase keys are handled.
- **Run Time Vars:** These are read by the Node.js server *after* the application has already been built and is starting up. Our application does not currently rely on these, but it's a key concept.

---

## 2. The Problems We Solved

Our final solution was designed to fix four fundamental issues with the initial setup:

1.  **Critical Environment Variable Mismatch:** The local development server used the `.env` file, while the Cloud Build process ignored it. This caused the deployed application to have the wrong API URL.
2.  **Hardcoded Firebase Keys:** All Firebase keys were written directly into the source code (`src/lib/firebase/client.ts`), which is inflexible and a bad security practice.
3.  **Inefficient Dockerfile:** The original `Dockerfile` was a single-stage build, creating a large, insecure image containing unnecessary source code and development tools.
4.  **Manual, Error-Prone Deployment:** The deployment process required manually running multiple `gcloud` commands, creating a high risk of human error.

---

## 3. The Final, Correct Deployment Workflow

Here is a deep dive into each component of our automated deployment system.

### Part 1: Environment Variable Management (The Core Fix)

This is how we ensure the correct API URLs and keys are used in both `dev` and `prod`.

**A. Local Development (`.env`):**
For local development, all variables are defined in the `.env` file. This file is read automatically by `astro dev`.

```bash
# .env
PUBLIC_API_BASE_URL="http://localhost:3000"
PUBLIC_FIREBASE_API_KEY="..."
# ... all other Firebase keys
```

**B. The Code (`constants.ts` & `client.ts`):**
The code is now written to read these variables from the environment. We also provide a **safe fallback** to `localhost` to prevent accidental calls to the production API.

```typescript
// src/lib/utils/constants.ts
export const PUBLIC_API_BASE_URL =
  import.meta.env.PUBLIC_API_BASE_URL ?? "http://localhost:3000";

// src/lib/firebase/client.ts
const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  // ... and so on for all keys
};
```

### Part 2: The Build Instruction (`cloudbuild.yaml`)

This file is the instruction manual for Google Cloud Build. It tells the cloud builder how to build our Docker image correctly for production.

```yaml
# cloudbuild.yaml
steps:
- name: 'gcr.io/cloud-builders/docker'
  args:
  - 'build'
  - '--tag=gcr.io/maag-60419/maag-frontend:latest'
  - '--build-arg=PUBLIC_API_BASE_URL=https://maag-api-953634001415.europe-west9.run.app'
  - '--build-arg=PUBLIC_FIREBASE_API_KEY=AIzaSyDV1lOP_YvFhENApXmw--oSo0HOifEVSa4'
  # ... all other --build-arg lines for Firebase keys
  - '.'
images:
- 'gcr.io/maag-60419/maag-frontend:latest'
```

**Explanation line-by-line:**
- `steps:` Defines the list of build commands.
- `name: '.../docker'` Specifies that we are using the standard Docker build tool.
- `args:` A list of arguments for the `docker build` command.
- `'--tag=...'`: Assigns a name (tag) to the final image, pointing to your project's Google Container Registry.
- `'--build-arg=KEY=VALUE'`: **This is how we set the environment variables for production.** This command injects the production URL and Firebase keys into the build process.
- `images:` Tells Cloud Build to push the successfully built image to the Container Registry.

### Part 3: The Container Recipe (`Dockerfile`)

Our multi-stage `Dockerfile` creates a small, secure, and optimized final image.

```dockerfile
# Stage 1: The "builder" stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# It expects to receive all the --build-arg values from cloudbuild.yaml
ARG PUBLIC_API_BASE_URL
ARG PUBLIC_FIREBASE_API_KEY
# ... all other ARGs

# It then makes them available to the 'npm run build' command
ENV PUBLIC_API_BASE_URL=$PUBLIC_API_BASE_URL
ENV PUBLIC_FIREBASE_API_KEY=$PUBLIC_FIREBASE_API_KEY
# ... all other ENVs

RUN npm run build
RUN npm prune --production

# ---

# Stage 2: The final "runner" stage
FROM node:20-alpine
WORKDIR /app

# Copy ONLY the necessary built files from the builder stage
COPY --from=builder /app/dist ./
dist
COPY --from=builder /app/node_modules ./
node_modules
COPY --from=builder /app/package.json ./
package.json

# Set runtime config and run the server
ENV HOST=0.0.0.0
ENV PORT=8080
EXPOSE 8080
CMD ["node", "./dist/server/entry.mjs"]
```

### Part 4: The Automation (`deploy.sh` & `package.json`)

To tie it all together, we created a simple shell script and an `npm` command.

**A. `deploy.sh`:**
This script simply runs the two necessary `gcloud` commands in the correct order. `set -e` ensures that the script will exit immediately if any command fails.

```bash
#!/bin/bash
set -e

echo "### 1. BUILDING DOCKER IMAGE...  ###"
gcloud builds submit --config cloudbuild.yaml .

echo "### 2. DEPLOYING TO CLOUD RUN... ###"
gcloud run deploy maag-frontend \
  --image gcr.io/maag-60419/maag-frontend:latest \
  --platform managed \
  --region europe-west9 \
  --allow-unauthenticated
```

**B. `package.json`:**
We added a script to make it easy to run.

```json
"scripts": {
  "dev": "...",
  "build": "...",
  "deploy:prod": "bash deploy.sh"
},
```

---

## 4. How to Deploy

With this system in place, the entire deployment process is now a single command:

```bash
npm run deploy:prod
```
