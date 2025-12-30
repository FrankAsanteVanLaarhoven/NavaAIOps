#!/bin/bash
# Deploy NavaChain AuditLedger contract to Polygon L2

set -e

echo "🔗 Deploying NavaChain AuditLedger to Polygon L2..."

# Check if Hardhat is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js"
    exit 1
fi

# Navigate to contracts directory
cd nava-contracts/solidity

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Compile contract
echo "🔨 Compiling contract..."
npx hardhat compile

# Deploy to Polygon Amoy (testnet)
echo "🚀 Deploying to Polygon Amoy testnet..."
npx hardhat run scripts/deploy.js --network amoy

echo "✅ Contract deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Copy the contract address from the output above"
echo "2. Add to .env: NAVACHAIN_CONTRACT_ADDRESS=0x..."
echo "3. Update bridge address in contract: npx hardhat run scripts/update-bridge.js --network amoy"
