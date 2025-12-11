#!/bin/bash

# Setup Test Environment Script
# Used in CI/CD to prepare the test environment

set -e  # Exit on error

echo "=== Setting up test environment ==="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for a service
wait_for_service() {
    local host=$1
    local port=$2
    local service=$3
    local max_attempts=30
    local attempt=1
    
    echo "Waiting for $service at $host:$port..."
    
    while ! nc -z "$host" "$port" 2>/dev/null; do
        if [ $attempt -gt $max_attempts ]; then
            echo "ERROR: $service did not become available after $max_attempts attempts"
            return 1
        fi
        
        echo "  Attempt $attempt/$max_attempts - $service not ready yet..."
        sleep 2
        ((attempt++))
    done
    
    echo "✓ $service is ready!"
    return 0
}

# Check for required tools
echo "Checking prerequisites..."
if ! command_exists node; then
    echo "ERROR: Node.js is not installed"
    exit 1
fi

if ! command_exists npm; then
    echo "ERROR: npm is not installed"
    exit 1
fi

# Set environment variables
export NODE_ENV=test

# Check if we're in CI or local environment
if [ -n "$CI" ]; then
    echo "Running in CI environment"
    
    # CI-specific setup
    if [ -n "$DATABASE_URL" ]; then
        echo "Using provided DATABASE_URL"
    else
        # Use default test database if not provided
        export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/findconstructionstaffing_test"
        export SUPABASE_URL="http://localhost:54321"
        export SUPABASE_SERVICE_ROLE_KEY="test-service-role-key"
    fi
    
    # Wait for PostgreSQL if it's a local service
    if [[ "$DATABASE_URL" == *"localhost"* ]] || [[ "$DATABASE_URL" == *"127.0.0.1"* ]]; then
        wait_for_service "localhost" "5432" "PostgreSQL" || {
            echo "WARNING: PostgreSQL might not be available"
            echo "Tests will use mocked database connections"
        }
    fi
else
    echo "Running in local environment"
    
    # Local environment setup
    if [ -f .env.test ]; then
        echo "Loading .env.test file..."
        export $(cat .env.test | grep -v '^#' | xargs)
    elif [ -f .env.local ]; then
        echo "Loading .env.local file..."
        export $(cat .env.local | grep -v '^#' | xargs)
    else
        echo "WARNING: No environment file found"
        echo "Using default test values..."
        export NEXT_PUBLIC_SUPABASE_URL="https://test.supabase.co"
        export NEXT_PUBLIC_SUPABASE_ANON_KEY="test-anon-key"
    fi
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm ci
fi

# Run database health check if database is configured
if [ -n "$DATABASE_URL" ] || [ -n "$SUPABASE_URL" ]; then
    echo ""
    echo "Checking database health..."
    npm run db:health || {
        echo "WARNING: Database health check failed"
        echo "Tests will proceed with mocked database"
    }
fi

# Validate test data
echo ""
echo "Validating test data..."
npm run validate:test-data || {
    echo "WARNING: Test data validation failed"
    echo "Some tests might fail due to invalid test data"
}

# Create test results directory
mkdir -p test-results
mkdir -p coverage

echo ""
echo "=== Test environment setup complete ==="
echo ""
echo "Environment summary:"
echo "  NODE_ENV: $NODE_ENV"
echo "  Database: ${DATABASE_URL:0:30}..."
echo "  Supabase URL: ${SUPABASE_URL:-'Using mocks'}"
echo ""
echo "You can now run tests with: npm test"