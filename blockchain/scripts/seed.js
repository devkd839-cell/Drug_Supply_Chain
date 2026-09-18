/**
 * seed.js
 * Registers sample entities and manufactures sample drugs on a local Hardhat node.
 *
 * Accounts used (Hardhat default):
 *   [0] – Contract deployer / Admin
 *   [1] – Manufacturer  (ABC Pharma   / M11)
 *   [2] – Wholesaler    (XYZ Distribution / W11)
 *   [3] – Retailer      (City Pharmacy / R11)
 *   [4] – Customer      (John          / C11)
 *
 * Usage (after `npx hardhat node` in another terminal):
 *   npx hardhat run scripts/seed.js --network localhost
 */

const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");

// Role enum must match Solidity: None=0 Manufacturer=1 Wholesaler=2 Retailer=3 Customer=4
const Role = { Manufacturer: 1, Wholesaler: 2, Retailer: 3, Customer: 4 };

async function main() {
  // ── Load deployed contract address ──────────────────────────────────────
  const deploymentPath = path.join(
    __dirname, "..", "..", "frontend", "src", "blockchain", "deployments.json"
  );
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(
      "deployments.json not found. Run `npm run deploy` first."
    );
  }
  const { address, abi } = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const signers = await ethers.getSigners();
  const [admin, mfrSigner, wsSigner, rtSigner, custSigner] = signers;

  console.log("═══════════════════════════════════════════════════════");
  console.log("  DrugChain – Seed Script");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Contract : ${address}`);
  console.log(`  Admin    : ${admin.address}`);

  const contract = (addr, signer) =>
    new ethers.Contract(addr, abi, signer);

  const adminContract = contract(address, admin);

  // ── 1. Register entities ─────────────────────────────────────────────────
  console.log("\n  Registering entities...");

  await (await contract(address, mfrSigner).registerEntity(
    "ABC Pharma", "M11", Role.Manufacturer
  )).wait();
  console.log("  ✔ Manufacturer  M11 – ABC Pharma");

  await (await contract(address, wsSigner).registerEntity(
    "XYZ Distribution", "W11", Role.Wholesaler
  )).wait();
  console.log("  ✔ Wholesaler    W11 – XYZ Distribution");

  await (await contract(address, rtSigner).registerEntity(
    "City Pharmacy", "R11", Role.Retailer
  )).wait();
  console.log("  ✔ Retailer      R11 – City Pharmacy");

  await (await contract(address, custSigner).registerEntity(
    "John", "C11", Role.Customer
  )).wait();
  console.log("  ✔ Customer      C11 – John");

  // ── 2. Manufacture drugs ─────────────────────────────────────────────────
  console.log("\n  Manufacturing drugs...");

  // Dates as Unix timestamps (seconds)
  const now          = Math.floor(Date.now() / 1000);
  const oneYear      = 365 * 24 * 60 * 60;
  const twoYears     = 2   * oneYear;
  const mfgDate      = now - 86400;          // yesterday
  const expiryDate1  = now + twoYears;       // 2 years from now
  const expiryDate2  = now + oneYear;        // 1 year from now
  const expiryDate3  = now + oneYear * 3;    // 3 years from now

  const mfrContract = contract(address, mfrSigner);

  await (await mfrContract.manufactureDrug(
    "Paracetamol", "D101", 1000, mfgDate, expiryDate1
  )).wait();
  console.log("  ✔ Drug D101 – Paracetamol (1000 lots)");

  await (await mfrContract.manufactureDrug(
    "Amoxicillin", "D102", 500, mfgDate, expiryDate2
  )).wait();
  console.log("  ✔ Drug D102 – Amoxicillin (500 lots)");

  await (await mfrContract.manufactureDrug(
    "Ibuprofen", "D103", 750, mfgDate, expiryDate3
  )).wait();
  console.log("  ✔ Drug D103 – Ibuprofen (750 lots)");

  // ── 3. Supply chain: Manufacturer → Wholesaler ───────────────────────────
  console.log("\n  Supply chain: Manufacturer → Wholesaler...");

  await (await mfrContract.supplyToWholesaler("D101", "W11", 400)).wait();
  console.log("  ✔ D101: 400 lots  M11 → W11");

  await (await mfrContract.supplyToWholesaler("D102", "W11", 200)).wait();
  console.log("  ✔ D102: 200 lots  M11 → W11");

  await (await mfrContract.supplyToWholesaler("D103", "W11", 300)).wait();
  console.log("  ✔ D103: 300 lots  M11 → W11");

  // ── 4. Supply chain: Wholesaler → Retailer ───────────────────────────────
  console.log("\n  Supply chain: Wholesaler → Retailer...");

  const wsContract = contract(address, wsSigner);

  await (await wsContract.supplyToRetailer("D101", "R11", 200)).wait();
  console.log("  ✔ D101: 200 lots  W11 → R11");

  await (await wsContract.supplyToRetailer("D102", "R11", 100)).wait();
  console.log("  ✔ D102: 100 lots  W11 → R11");

  await (await wsContract.supplyToRetailer("D103", "R11", 150)).wait();
  console.log("  ✔ D103: 150 lots  W11 → R11");

  // ── 5. Supply chain: Retailer → Customer ─────────────────────────────────
  console.log("\n  Supply chain: Retailer → Customer...");

  const rtContract = contract(address, rtSigner);

  await (await rtContract.supplyToCustomer("D101", "C11", 20)).wait();
  console.log("  ✔ D101: 20 lots   R11 → C11");

  await (await rtContract.supplyToCustomer("D102", "C11", 10)).wait();
  console.log("  ✔ D102: 10 lots   R11 → C11");

  // ── 6. Print summary ─────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  Seed complete. Supply-chain demo data ready.");
  console.log("\n  Sample Hardhat accounts:");
  console.log(`    Admin        : ${admin.address}`);
  console.log(`    Manufacturer : ${mfrSigner.address}  (M11)`);
  console.log(`    Wholesaler   : ${wsSigner.address}  (W11)`);
  console.log(`    Retailer     : ${rtSigner.address}  (R11)`);
  console.log(`    Customer     : ${custSigner.address}  (C11)`);
  console.log("\n  Import these accounts into MetaMask using");
  console.log("  the private keys printed by `npx hardhat node`.");
  console.log("═══════════════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
