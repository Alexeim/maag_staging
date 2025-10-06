#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

echo "####################################"
echo "### 1. BUILDING BACKEND IMAGE... ###"
echo "####################################"
# Note: We run this from the project root, so the context is the 'server' directory
gcloud builds submit --tag gcr.io/maag-60419/maag-api ./server

echo ""
echo "#######################################"
echo "### 2. DEPLOYING API TO CLOUD RUN... ###"
echo "#######################################"
gcloud run deploy maag-api \
  --image gcr.io/maag-60419/maag-api \
  --platform managed \
  --region europe-west9 \
  --allow-unauthenticated \
  --set-secrets="FIREBASE_CONFIG_JSON=FIREBASE_CONFIG_JSON:latest"

echo ""
echo "####################################"
echo "###      DEPLOYMENT COMPLETE     ###"
echo "####################################"
