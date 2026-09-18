/**
 * deploy.js
 * Deploys DrugSupplyChain.sol and writes the contract address + ABI
 * to frontend/src/blockchain/deployments.json for easy consumption.
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network localhost
 *   npx hardhat run scripts/deploy.js --network sepolia
 */

const { ethers, artifacts } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("═══════════════════════════════════════════════════════");
  console.log("  DrugChain – Contract Deployment");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Network  : ${(await ethers.provider.getNetwork()).name}`);
  console.log(`  Deployer : ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  Balance  : ${ethers.formatEther(balance)} ETH`);
  console.log("───────────────────────────────────────────────────────");

  // ── Deploy ──────────────────────────────────────────────────────────────
  console.log("\n  Deploying DrugSupplyChain...");
  const Factory  = await ethers.getContractFactory("DrugSupplyChain");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`  ✔ Contract deployed at: ${address}`);

  // ── Write deployment info for the frontend ───────────────────────────────
  const artifact = await artifacts.readArtifact("DrugSupplyChain");

  const deploymentData = {
    address,
    abi:       artifact.abi,
    network:   (await ethers.provider.getNetwork()).name,
    chainId:   Number((await ethers.provider.getNetwork()).chainId),
    deployedAt: new Date().toISOString(),
    deployer:  deployer.address,
  };

  // Path: ../frontend/src/blockchain/deployments.json  (relative to blockchain/)
  const outDir = path.join(__dirname, "..", "..", "frontend", "src", "blockchain");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, "deployments.json");
  fs.writeFileSync(outPath, JSON.stringify(deploymentData, null, 2));
  console.log(`  ✔ Deployment info written to: ${outPath}`);

  // Also copy to frontend/public so it is served statically at runtime
  const publicDir = path.join(__dirname, "..", "..", "frontend", "public");
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPath = path.join(publicDir, "deployments.json");
  fs.writeFileSync(publicPath, JSON.stringify(deploymentData, null, 2));
  console.log(`  ✔ Runtime copy written to:    ${publicPath}`);

  // Also write a plain .env update hint
  console.log("\n───────────────────────────────────────────────────────");
  console.log("  Add this to frontend/.env:");
  console.log(`  VITE_CONTRACT_ADDRESS=${address}`);
  console.log("═══════════════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
