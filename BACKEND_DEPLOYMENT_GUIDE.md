# Backend Deployment Guide: Express API on Google Cloud Run

This document provides a complete, step-by-step guide to the final, successful deployment process for the MAAG backend API. It explains the core concepts, the architecture, and the automated workflow.

## 1. Core Principles & Technologies

The backend deployment is designed for security, efficiency, and reliability.

- **Platform:** Google Cloud Run.
- **Containerization:** A multi-stage `Dockerfile` to produce a small and secure production image.
- **Build Service:** Google Cloud Build for automated, cloud-native builds.
- **Secret Management:** Google Secret Manager for securely handling the Firebase Admin SDK key. This is the most critical part of the backend's security model.

### Key Architectural Difference: Run-Time vs. Build-Time Secrets

It is vital to understand why the backend and frontend handle secrets differently.

- **Frontend (Build-Time):** The frontend needs its Firebase keys available in the browser. Therefore, the keys are injected during the `npm run build` process and "baked into" the public JavaScript files. We use `--build-arg` for this.

- **Backend (Run-Time):** The backend is a secure server environment. We **never** want to bake secrets into the Docker image. Instead, the image is generic, and we securely mount the secret into the running container using Cloud Run's integration with Secret Manager. The Node.js process only gains access to the key *after* it has started, reading it from the environment (`process.env`). This is significantly more secure.

---

## 2. The Final, Correct Deployment Workflow

This process is fully automated with a deploy script. Here is a breakdown of each component.

### Part 1: The Container Recipe (`server/Dockerfile`)

The backend uses an optimized, multi-stage `Dockerfile` to create a minimal and secure production image.

```dockerfile
# Stage 1: The "builder" stage to compile TypeScript
FROM node:20 AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

# ---

# Stage 2: The final "runner" stage
FROM node:20-slim
WORKDIR /usr/src/app
# Copy ONLY the necessary built files from the builder
COPY package*.json ./
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
CMD [ "npm", "start" ]
```
This process ensures that no source code (`.ts` files) or development tools are included in the final image, only the compiled JavaScript (`dist`) and production dependencies.

### Part 2: Secure Key Storage (Google Secret Manager)

The Firebase Admin SDK JSON key is a highly sensitive credential. It is stored in Google Secret Manager, not in the code or the Docker image.

**How it works:**
1.  A secret named `FIREBASE_CONFIG_JSON` was created in Secret Manager.
2.  The content of the `firebase-key.json` file was added as a version to this secret.
3.  The Cloud Run service account was granted IAM permission to access this specific secret.

### Part 3: The Code (`server/src/services/firebase.ts`)

The application code is written to read the secret from a runtime environment variable.

```typescript
// This code runs when the server starts in the Cloud Run container
const firebaseConfigJson = process.env.FIREBASE_CONFIG_JSON;
if (!firebaseConfigJson) {
  throw new Error("The FIREBASE_CONFIG_JSON environment variable is not set.");
}
const serviceAccount = JSON.parse(firebaseConfigJson);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
```
Cloud Run securely provides the `FIREBASE_CONFIG_JSON` variable by fetching it from Secret Manager and injecting it into the running container's environment.

### Part 4: Automation (`deploy.sh` & `package.json`)

To make deployment simple and repeatable, the entire process is wrapped in a script.

**A. `server/deploy.sh`:**
This script contains the two `gcloud` commands needed to build and deploy the backend.

```bash
#!/bin/bash
set -e # Exit immediately if a command fails

# 1. Build the image using Cloud Build (submitting the server directory)
```

```bash
gcloud builds submit --tag gcr.io/maag-60419/maag-api ./server

# 2. Deploy the new image to Cloud Run, securely connecting the secret
```

```bash
gcloud run deploy maag-api \
  --image gcr.io/maag-60419/maag-api \
  --platform managed \
  --region europe-west9 \
  --allow-unauthenticated \
  --set-secrets="FIREBASE_CONFIG_JSON=FIREBASE_CONFIG_JSON:latest"
```
The `--set-secrets` flag is the magic that connects our running container to Secret Manager.

**B. `server/package.json`:**
A simple `npm` script is added to execute the deploy script.

```json
"scripts": {
  "deploy:prod": "bash deploy.sh"
}
```

---

## 4. How to Verify the Deployment

After a successful deployment, you can perform a quick "smoke test" to ensure the API is live and responding correctly using `curl`.

**Test the root endpoint:**
```bash
curl https://maag-api-953634001415.europe-west9.run.app/api
```
*Expected Output: `Hello from the MAAG API!`*

**Test the articles endpoint:**
```bash
curl https://maag-api-953634001415.europe-west9.run.app/api/articles
```
*This should return a JSON array of articles from your Firestore database.*

---

## 5. How to Deploy

With this system, deploying a new version of the backend is a single command, run from the **root of the project**:

```bash
npm run deploy:prod --prefix server
```