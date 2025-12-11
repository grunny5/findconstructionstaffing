#!/bin/bash

# Manual deployment script for when CI/CD hits rate limits

echo "🚀 Manual Vercel Deployment Script"
echo "================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

# Check for required environment variables
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ VERCEL_TOKEN not set. Please run:"
    echo "   export VERCEL_TOKEN=your-vercel-token"
    exit 1
fi

# Get the branch name
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📌 Current branch: $BRANCH"

# Determine deployment type
if [ "$BRANCH" = "main" ]; then
    echo "🏭 Deploying to PRODUCTION..."
    vercel --prod --token=$VERCEL_TOKEN
else
    echo "👁️ Deploying preview for branch: $BRANCH"
    vercel --token=$VERCEL_TOKEN
fi

echo "✅ Deployment complete!"