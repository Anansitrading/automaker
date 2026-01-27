#!/bin/bash

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install and use Node 22
echo "Installing Node 22..."
nvm install 22
nvm use 22
nvm alias default 22

echo "Node version:"
node -v
echo "NPM version:"
npm -v

# Clean install dependencies
echo "Cleaning old node_modules..."
rm -rf node_modules
rm -rf apps/ui/node_modules
rm -rf apps/server/node_modules
rm -rf libs/*/node_modules

echo "Installing dependencies..."
npm install

echo "Setup complete."
