#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

echo "####################################"
echo "### 1. BUILDING DOCKER IMAGE...  ###"
echo "####################################"
gcloud builds submit --config cloudbuild.yaml .

echo ""
echo "####################################"
echo "### 2. DEPLOYING TO CLOUD RUN... ###"
echo "####################################"
gcloud run deploy maag-frontend \
  --image gcr.io/maag-60419/maag-frontend:latest \
  --platform managed \
  --region europe-west9 \
  --allow-unauthenticated

echo ""
echo "####################################"
echo "###      DEPLOYMENT COMPLETE     ###"
echo "####################################"
