const hre = require("hardhat");

async function main() {
  console.log("🔗 Deploying NavaChain AuditLedger...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy contract
  const AuditLedger = await hre.ethers.getContractFactory("AuditLedger");
  
  // Initial bridge address (can be updated later via updateBridgeAddress)
  const initialBridgeAddress = process.env.BRIDGE_ADDRESS || deployer.address;
  
  console.log("Deploying with bridge address:", initialBridgeAddress);
  
  const auditLedger = await AuditLedger.deploy(initialBridgeAddress);
  await auditLedger.waitForDeployment();

  const address = await auditLedger.getAddress();
  console.log("✅ AuditLedger deployed to:", address);
  console.log("");
  console.log("📝 Add to .env:");
  console.log(`NAVACHAIN_CONTRACT_ADDRESS=${address}`);
  console.log("");
  console.log("🔗 Verify on PolygonScan:");
  console.log(`https://amoy.polygonscan.com/address/${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
