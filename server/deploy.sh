#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

echo "####################################"
echo "### 1. BUILDING BACKEND IMAGE... ###"
echo "####################################"
# Note: This script is run from the 'server' directory itself.
gcloud builds submit --tag gcr.io/maag-60419/maag-api .

echo ""
echo "#######################################"
echo "### 2. DEPLOYING API TO CLOUD RUN... ###"
echo "#######################################"
gcloud run deploy maag-api \
  --image gcr.io/maag-60419/maag-api \
  --platform managed \
  --region europe-west9 \
  --allow-unauthenticated \
  --set-env-vars="FRONTEND_URL=https://maag-frontend-953634001415.europe-west9.run.app" \
  --set-secrets="FIREBASE_CONFIG_JSON=FIREBASE_CONFIG_JSON:latest,STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest"

echo ""
echo "####################################"
echo "###      DEPLOYMENT COMPLETE     ###"
echo "####################################"
