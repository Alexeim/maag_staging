# Backend Deployment Guide: MAAG API on Google Cloud Run

This document summarizes the final, successful steps taken to deploy the Express.js backend for the MAAG project to Google Cloud Run.

## 1. Final Service URL

The deployed backend is live and accessible at the following URL:

**https://maag-api-953634001415.europe-west9.run.app**

## 2. Core Principles & Technologies Used

- **Platform:** Google Cloud Run (for running the container).
- **Containerization:** Docker (for packaging the application).
- **Build Service:** Google Cloud Build (for building the Docker image in the cloud).
- **Secret Management:** Google Secret Manager (for securely storing the Firebase service account key).
- **Deployment Method:** Manual deployment via the `gcloud` CLI.

## 3. Step-by-Step Deployment Process

This was the final, correct sequence of actions.

### Step 1: Code Preparation (`server/src/index.ts`)

The main server file was modified to listen on `0.0.0.0`, which is a requirement for Cloud Run to correctly route traffic to the container.

**Change:**
```diff
- app.listen(port, () => {
+ app.listen(Number(port), '0.0.0.0', () => {
```

### Step 2: Dockerfile Configuration (`server/Dockerfile`)

A multi-stage `Dockerfile` was created to build a clean, optimized, and secure production image. This process ensures that development tools and source code are not included in the final container.

**Final `server/Dockerfile`:**
```dockerfile
# Stage 1: The "builder" stage to compile the project
FROM node:20 AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

# Stage 2: The final, clean stage for running the application
FROM node:20-slim
WORKDIR /usr/src/app
COPY package*.json ./
COPY --from=builder /usr/src/app/dist ./
dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
CMD [ "npm", "start" ]
```

### Step 3: Building the Docker Image

The Docker image was built in the cloud using Google Cloud Build.

**Command:**
```bash
gcloud builds submit --tag gcr.io/maag-60419/maag-api ./server
```

### Step 4: Securely Storing the Firebase Key

The Firebase service account JSON key was stored securely using Google Secret Manager.

**Commands:**
```bash
# 1. Create a secret to hold the key
gcloud secrets create FIREBASE_CONFIG_JSON --replication-policy="automatic"

# 2. Add the key content as a new version of the secret
gcloud secrets versions add FIREBASE_CONFIG_JSON --data-file="path/to/your/firebase-key.json"
```

### Step 5: Granting Permissions

The Cloud Run service needs permission to access the key from Secret Manager. This was granted via an IAM policy binding.

**Command:**
```bash
gcloud projects add-iam-policy-binding maag-60419 --member="serviceAccount:953634001415-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
```

### Step 6: Deploying to Cloud Run

The final deployment command launched the service, connecting it to the securely stored secret.

**Command:**
```bash
gcloud run deploy maag-api \
  --image gcr.io/maag-60419/maag-api \
  --platform managed \
  --region europe-west9 \
  --allow-unauthenticated \
  --set-secrets="FIREBASE_CONFIG_JSON=FIREBASE_CONFIG_JSON:latest"
```

## 4. How to Test the Live API

You can test the deployed API using `curl`.

**Test the root endpoint:**
```bash
curl https://maag-api-953634001415.europe-west9.run.app/api
```
**Expected Output:** `Hello from the MAAG API!`

**Test the articles endpoint:**
```bash
curl https://maag-api-953634001415.europe-west9.run.app/api/articles
```
