#!/bin/bash

# Script to set up Vercel environment variables for staging deployment
# Usage: ./scripts/setup-vercel-env.sh

set -euo pipefail

echo "Setting up Vercel environment variables for staging..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "Error: .env.local file not found!"
    echo "Please create .env.local with your environment variables first."
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Error: Vercel CLI not found!"
    echo "Please install with: npm i -g vercel"
    exit 1
fi

# Function to add environment variable to Vercel
add_vercel_env() {
    local key=$1
    local value=$2
    local env_type=${3:-"production preview development"}
    
    echo "Setting $key..."
    echo "$value" | vercel env add "$key" $env_type --yes 2>/dev/null || echo "  Variable $key already exists or error occurred"
}

# Read environment variables from .env.local
echo "Reading environment variables from .env.local..."

# Required variables for build
while IFS='=' read -r key value; do
    # Skip empty lines and comments
    [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
    
    # Remove quotes from value if present
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    # Add to Vercel based on variable type
    case "$key" in
        NEXT_PUBLIC_*)
            # Public variables needed at build time
            add_vercel_env "$key" "$value"
            ;;
        SUPABASE_SERVICE_ROLE_KEY|DATABASE_URL)
            # Sensitive variables only for production/preview
            add_vercel_env "$key" "$value" "production preview"
            ;;
        MONITORING_API_KEY)
            # Monitoring key for production only
            add_vercel_env "$key" "$value" "production"
            ;;
    esac
done < .env.local

echo ""
echo "Environment variable setup complete!"
echo ""
echo "Next steps:"
echo "1. Verify variables are set: vercel env ls"
echo "2. Redeploy: vercel --prod (for production) or vercel (for preview)"
echo ""
echo "Note: If you need to update a variable, use: vercel env rm KEY_NAME"
echo "Then run this script again."