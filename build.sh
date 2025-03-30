#!/bin/bash
# Exit on error
set -e

# Create environment file to disable treating warnings as errors
echo "CI=false" > .env

# Install Node.js dependencies
echo "Installing npm dependencies..."
npm install

# Build the React app
echo "Building React application..."
npm run build
