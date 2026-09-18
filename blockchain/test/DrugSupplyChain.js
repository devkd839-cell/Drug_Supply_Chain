/**
 * DrugSupplyChain.js – Comprehensive Hardhat/Mocha/Chai test suite
 *
 * Run:  npx hardhat test
 *       npx hardhat test --grep "Entity registration"
 */

const { expect }        = require("chai");
const { ethers }        = require("hardhat");
const { time }          = require("@nomicfoundation/hardhat-toolbox/network-helpers");

// ─── Role enum (mirrors Solidity) ────────────────────────────────────────────
const Role = {
  None:         0,
  Manufacturer: 1,
  Wholesaler:   2,
  Retailer:     3,
  Customer:     4,
};

// ─── DrugStatus enum ─────────────────────────────────────────────────────────
const DrugStatus = { Active: 0, Expired: 1, Recalled: 2 };

// ─── Helpers ─────────────────────────────────────────────────────────────────
const SECONDS = 1;
const MINUTES = 60 * SECONDS;
const HOURS   = 60 * MINUTES;
const DAYS    = 24 * HOURS;
const YEARS   = 365 * DAYS;

function nowPlus(secs) {
  return Math.floor(Date.now() / 1000) + secs;
}

// ─────────────────────────────────────────────────────────────────────────────
describe("DrugSupplyChain", function () {

  // shared signers & contract
  let contract;
  let owner, mfr, ws, retailer, customer, stranger;

  // shared timestamps
  let mfgDate, expiryFuture, expiryPast;

  beforeEach(async function () {
    [owner, mfr, ws, retailer, customer, stranger] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("DrugSupplyChain");
    contract = await Factory.deploy();
    await contract.waitForDeployment();

    mfgDate      = nowPlus(-DAYS);          // yesterday
    expiryFuture = nowPlus(2 * YEARS);      // 2 years from now
    expiryPast   = nowPlus(-DAYS);          // already expired (same as mfgDate for easy setup)
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("Entity registration", function () {

    it("registers a Manufacturer successfully", async function () {
      await expect(
        contract.connect(mfr).registerEntity("ABC Pharma", "M11", Role.Manufacturer)
      )
        .to.emit(contract, "EntityRegistered")
        .withArgs(mfr.address, "M11", Role.Manufacturer, "ABC Pharma");

      const e = await contract.getEntityByWallet(mfr.address);
      expect(e.name).to.equal("ABC Pharma");
      expect(e.id).to.equal("M11");
      expect(e.role).to.equal(Role.Manufacturer);
      expect(e.isRegistered).to.be.true;
      expect(e.isActive).to.be.true;
    });

    it("registers all four roles successfully", async function () {
      await contract.connect(mfr).registerEntity("M", "M11", Role.Manufacturer);
      await contract.connect(ws).registerEntity("W", "W11", Role.Wholesaler);
      await contract.connect(retailer).registerEntity("R", "R11", Role.Retailer);
      await contract.connect(customer).registerEntity("C", "C11", Role.Customer);

      expect((await contract.getEntityByWallet(ws.address)).role).to.equal(Role.Wholesaler);
      expect((await contract.getEntityByWallet(retailer.address)).role).to.equal(Role.Retailer);
      expect((await contract.getEntityByWallet(customer.address)).role).to.equal(Role.Customer);
    });

    it("reverts duplicate wallet registration", async function () {
      await contract.connect(mfr).registerEntity("ABC Pharma", "M11", Role.Manufacturer);
      await expect(
        contract.connect(mfr).registerEntity("ABC Pharma 2", "M12", Role.Manufacturer)
      ).to.be.revertedWith("Wallet already registered");
    });

    it("reverts duplicate entity ID", async function () {
      await contract.connect(mfr).registerEntity("ABC Pharma", "M11", Role.Manufacturer);
      await expect(
        contract.connect(stranger).registerEntity("Other Pharma", "M11", Role.Manufacturer)
      ).to.be.revertedWith("Entity ID already taken");
    });

    it("reverts Role.None registration", async function () {
      await expect(
        contract.connect(mfr).registerEntity("X", "X1", Role.None)
      ).to.be.revertedWith("Role.None is not allowed");
    });

    it("reverts empty name", async function () {
      await expect(
        contract.connect(mfr).registerEntity("", "M11", Role.Manufacturer)
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("reverts empty ID", async function () {
      await expect(
        contract.connect(mfr).registerEntity("ABC", "", Role.Manufacturer)
      ).to.be.revertedWith("ID cannot be empty");
    });

    it("isEntityRegistered returns correct values", async function () {
      expect(await contract.isEntityRegistered(mfr.address)).to.be.false;
      await contract.connect(mfr).registerEntity("ABC", "M11", Role.Manufacturer);
      expect(await contract.isEntityRegistered(mfr.address)).to.be.true;
    });

    it("getEntitiesByRole returns only matching roles", async function () {
      await contract.connect(mfr).registerEntity("M", "M11", Role.Manufacturer);
      await contract.connect(ws).registerEntity("W", "W11", Role.Wholesaler);
      await contract.connect(retailer).registerEntity("R", "R11", Role.Retailer);

      const mfrs = await contract.getEntitiesByRole(Role.Manufacturer);
      expect(mfrs.length).to.equal(1);
      expect(mfrs[0].id).to.equal("M11");

      const wsList = await contract.getEntitiesByRole(Role.Wholesaler);
      expect(wsList.length).to.equal(1);
    });

    it("getAllEntities returns all registered entities", async function () {
      await contract.connect(mfr).registerEntity("M", "M11", Role.Manufacturer);
      await contract.connect(ws).registerEntity("W", "W11", Role.Wholesaler);
      const all = await contract.getAllEntities();
      expect(all.length).to.equal(2);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("Entity suspension & activation", function () {

    beforeEach(async function () {
      await contract.connect(mfr).registerEntity("ABC Pharma", "M11", Role.Manufacturer);
    });

    it("owner can suspend an entity", async function () {
      await expect(contract.connect(owner).suspendEntity("M11"))
        .to.emit(contract, "EntitySuspended")
        .withArgs("M11", mfr.address);

      const e = await contract.getEntityByWallet(mfr.address);
      expect(e.isActive).to.be.false;
    });

    it("owner can re-activate a suspended entity", async function () {
      await contract.connect(owner).suspendEntity("M11");
      await expect(contract.connect(owner).activateEntity("M11"))
        .to.emit(contract, "EntityActivated")
        .withArgs("M11", mfr.address);

      const e = await contract.getEntityByWallet(mfr.address);
      expect(e.isActive).to.be.true;
    });

    it("non-owner cannot suspend", async function () {
      await expect(
        contract.connect(stranger).suspendEntity("M11")
      ).to.be.revertedWith("Caller is not the contract owner");
    });

    it("suspended manufacturer cannot manufacture drugs", async function () {
      await contract.connect(owner).suspendEntity("M11");
      await expect(
        contract.connect(mfr).manufactureDrug("Drug", "D001", 100, mfgDate, expiryFuture)
      ).to.be.revertedWith("Entity is suspended");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("Drug manufacturing", function () {

    beforeEach(async function () {
      await contract.connect(mfr).registerEntity("ABC Pharma", "M11", Role.Manufacturer);
    });

    it("manufactures a drug batch successfully", async function () {
      await expect(
        contract.connect(mfr).manufactureDrug("Paracetamol", "D101", 1000, mfgDate, expiryFuture)
      )
        .to.emit(contract, "DrugManufactured")
        .withArgs("D101", "Paracetamol", "M11", 1000, expiryFuture);

      const d = await contract.getDrug("D101");
      expect(d.drugName).to.equal("Paracetamol");
      expect(d.drugId).to.equal("D101");
      expect(d.manufacturedQty).to.equal(1000n);
      expect(d.remainingQty).to.equal(1000n);
      expect(d.exists).to.be.true;
      expect(d.isRecalled).to.be.false;
    });

    it("reverts duplicate drug ID", async function () {
      await contract.connect(mfr).manufactureDrug("Paracetamol", "D101", 1000, mfgDate, expiryFuture);
      await expect(
        contract.connect(mfr).manufactureDrug("Paracetamol", "D101", 500, mfgDate, expiryFuture)
      ).to.be.revertedWith("Drug ID already exists");
    });

    it("reverts zero quantity", async function () {
      await expect(
        contract.connect(mfr).manufactureDrug("Drug", "D001", 0, mfgDate, expiryFuture)
      ).to.be.revertedWith("Quantity must be greater than zero");
    });

    it("reverts expiry in the past", async function () {
      const now        = await time.latest();
      const pastExpiry = now - DAYS;
      // pastExpiry < mfgDate will trigger "before mfg" check; use mfgDate also in the past
      // but still after pastExpiry so the order check passes and we hit the "already in past" check
      const pastMfg    = now - DAYS * 2;
      await expect(
        contract.connect(mfr).manufactureDrug("Drug", "D001", 100, pastMfg, pastExpiry)
      ).to.be.revertedWith("Expiry date is already in the past");
    });

    it("reverts if expiry is before manufacturing date", async function () {
      const now       = await time.latest();
      const badMfg    = now + DAYS * 10;
      const badExpiry = now + DAYS * 5;
      await expect(
        contract.connect(mfr).manufactureDrug("Drug", "D001", 100, badMfg, badExpiry)
      ).to.be.revertedWith("Expiry must be after manufacturing date");
    });

    it("reverts if caller is not a manufacturer", async function () {
      await contract.connect(ws).registerEntity("WS", "W11", Role.Wholesaler);
      await expect(
        contract.connect(ws).manufactureDrug("Drug", "D001", 100, mfgDate, expiryFuture)
      ).to.be.revertedWith("Unauthorized role");
    });

    it("reverts if caller is unregistered", async function () {
      await expect(
        contract.connect(stranger).manufactureDrug("Drug", "D001", 100, mfgDate, expiryFuture)
      ).to.be.revertedWith("Caller is not registered");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("Supply to Wholesaler", function () {

    beforeEach(async function () {
      await contract.connect(mfr).registerEntity("ABC Pharma", "M11", Role.Manufacturer);
      await contract.connect(ws).registerEntity("XYZ Dist", "W11", Role.Wholesaler);
      await contract.connect(mfr).manufactureDrug("Paracetamol", "D101", 1000, mfgDate, expiryFuture);
    });

    it("supplies drugs to wholesaler successfully", async function () {
      await expect(
        contract.connect(mfr).supplyToWholesaler("D101", "W11", 400)
      ).to.emit(contract, "SuppliedToWholesaler");

      const batch = await contract.getDrug("D101");
      expect(batch.remainingQty).to.equal(600n);

      const inv = await contract.getWholesalerInventory(ws.address);
      expect(inv.length).to.equal(1);
      expect(inv[0].availableQty).to.equal(400n);
    });

    it("reverts on insufficient manufacturer stock", async function () {
      await expect(
        contract.connect(mfr).supplyToWholesaler("D101", "W11", 1001)
      ).to.be.revertedWith("Insufficient manufacturer stock");
    });

    it("reverts if drug does not belong to caller", async function () {
      // second manufacturer tries to supply a drug they didn't make
      const [,, , , , , otherMfr] = await ethers.getSigners();
      await contract.connect(otherMfr).registerEntity("Other Pharma", "M22", Role.Manufacturer);
      await expect(
        contract.connect(otherMfr).supplyToWholesaler("D101", "W11", 100)
      ).to.be.revertedWith("Drug does not belong to this manufacturer");
    });

    it("reverts if target is not a registered Wholesaler", async function () {
      // retailer ID passed as wholesaler
      await contract.connect(retailer).registerEntity("R", "R11", Role.Retailer);
      await expect(
        contract.connect(mfr).supplyToWholesaler("D101", "R11", 100)
      ).to.be.revertedWith("Target ID is not a registered Wholesaler");
    });

    it("reverts if drug is recalled", async function () {
      await contract.connect(mfr).recallDrug("D101", "Contamination");
      await expect(
        contract.connect(mfr).supplyToWholesaler("D101", "W11", 100)
      ).to.be.revertedWith("Drug is recalled");
    });

    it("reverts zero quantity", async function () {
      await expect(
        contract.connect(mfr).supplyToWholesaler("D101", "W11", 0)
      ).to.be.revertedWith("Quantity must be greater than zero");
    });

    it("accumulates quantity when same drug supplied twice", async function () {
      await contract.connect(mfr).supplyToWholesaler("D101", "W11", 200);
      await contract.connect(mfr).supplyToWholesaler("D101", "W11", 100);

      const inv = await contract.getWholesalerInventory(ws.address);
      expect(inv[0].availableQty).to.equal(300n);
      expect(inv[0].receivedQty).to.equal(300n);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("Supply to Retailer", function () {

    beforeEach(async function () {
      await contract.connect(mfr).registerEntity("ABC Pharma", "M11", Role.Manufacturer);
      await contract.connect(ws).registerEntity("XYZ Dist",   "W11", Role.Wholesaler);
      await contract.connect(retailer).registerEntity("City Pharmacy", "R11", Role.Retailer);
      await contract.connect(mfr).manufactureDrug("Paracetamol", "D101", 1000, mfgDate, expiryFuture);
      await contract.connect(mfr).supplyToWholesaler("D101", "W11", 400);
    });

    it("supplies drugs to retailer successfully", async function () {
      await expect(
        contract.connect(ws).supplyToRetailer("D101", "R11", 200)
      ).to.emit(contract, "SuppliedToRetailer");

      const wsInv = await contract.getWholesalerInventory(ws.address);
      expect(wsInv[0].availableQty).to.equal(200n);
      expect(wsInv[0].suppliedQty).to.equal(200n);

      const rtInv = await contract.getRetailerInventory(retailer.address);
      expect(rtInv[0].availableQty).to.equal(200n);
    });

    it("reverts on insufficient wholesaler stock", async function () {
      await expect(
        contract.connect(ws).supplyToRetailer("D101", "R11", 401)
      ).to.be.revertedWith("Insufficient wholesaler stock");
    });

    it("reverts if wholesaler does not hold this drug", async function () {
      // Second wholesaler tries to transfer stock they don't own
      const [,,,,,, ws2] = await ethers.getSigners();
      await contract.connect(ws2).registerEntity("WS2", "W22", Role.Wholesaler);
      await expect(
        contract.connect(ws2).supplyToRetailer("D101", "R11", 100)
      ).to.be.revertedWith("Wholesaler does not hold this drug");
    });

    it("reverts if target is not a registered Retailer", async function () {
      await expect(
        contract.connect(ws).supplyToRetailer("D101", "W11", 100)
      ).to.be.revertedWith("Target ID is not a registered Retailer");
    });

    it("reverts if drug is recalled", async function () {
      await contract.connect(mfr).recallDrug("D101", "Bad batch");
      await expect(
        contract.connect(ws).supplyToRetailer("D101", "R11", 100)
      ).to.be.revertedWith("Drug is recalled");
    });

    it("reverts if non-wholesaler tries to call", async function () {
      await expect(
        contract.connect(retailer).supplyToRetailer("D101", "R11", 50)
      ).to.be.revertedWith("Unauthorized role");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("Supply to Customer", function () {

    beforeEach(async function () {
      await contract.connect(mfr).registerEntity("ABC Pharma", "M11", Role.Manufacturer);
      await contract.connect(ws).registerEntity("XYZ Dist",   "W11", Role.Wholesaler);
      await contract.connect(retailer).registerEntity("City Pharmacy", "R11", Role.Retailer);
      await contract.connect(customer).registerEntity("John", "C11", Role.Customer);
      await contract.connect(mfr).manufactureDrug("Paracetamol", "D101", 1000, mfgDate, expiryFuture);
      await contract.connect(mfr).supplyToWholesaler("D101", "W11", 400);
      await contract.connect(ws).supplyToRetailer("D101", "R11", 200);
    });

    it("supplies drugs to customer successfully", async function () {
      await expect(
        contract.connect(retailer).supplyToCustomer("D101", "C11", 20)
      ).to.emit(contract, "SuppliedToCustomer");

      const rtInv = await contract.getRetailerInventory(retailer.address);
      expect(rtInv[0].availableQty).to.equal(180n);

      const custInv = await contract.getCustomerInventory("C11");
      expect(custInv.length).to.equal(1);
      expect(custInv[0].quantity).to.equal(20n);
      expect(custInv[0].drugId).to.equal("D101");
    });

    it("reverts on insufficient retailer stock", async function () {
      await expect(
        contract.connect(retailer).supplyToCustomer("D101", "C11", 201)
      ).to.be.revertedWith("Insufficient retailer stock");
    });

    it("reverts if retailer does not hold this drug", async function () {
      const [,,,,,, , rt2] = await ethers.getSigners();
      await contract.connect(rt2).registerEntity("RT2", "R22", Role.Retailer);
      await expect(
        contract.connect(rt2).supplyToCustomer("D101", "C11", 10)
      ).to.be.revertedWith("Retailer does not hold this drug");
    });

    it("reverts if target is not a registered Customer", async function () {
      await expect(
        contract.connect(retailer).supplyToCustomer("D101", "R11", 10)
      ).to.be.revertedWith("Target ID is not a registered Customer");
    });

    it("reverts if drug is recalled", async function () {
      await contract.connect(mfr).recallDrug("D101", "Recall");
      await expect(
        contract.connect(retailer).supplyToCustomer("D101", "C11", 5)
      ).to.be.revertedWith("Drug is recalled");
    });

    it("customer inventory accumulates multiple drugs", async function () {
      await contract.connect(mfr).manufactureDrug("Amoxicillin", "D102", 500, mfgDate, expiryFuture);
      await contract.connect(mfr).supplyToWholesaler("D102", "W11", 200);
      await contract.connect(ws).supplyToRetailer("D102", "R11", 100);

      await contract.connect(retailer).supplyToCustomer("D101", "C11", 10);
      await contract.connect(retailer).supplyToCustomer("D102", "C11", 5);

      const custInv = await contract.getCustomerInventory("C11");
      expect(custInv.length).to.equal(2);
      expect(await contract.getCustomerDrugCount("C11")).to.equal(2n);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("Unauthorized transfers", function () {

    beforeEach(async function () {
      await contract.connect(mfr).registerEntity("M", "M11", Role.Manufacturer);
      await contract.connect(ws).registerEntity("W", "W11", Role.Wholesaler);
      await contract.connect(retailer).registerEntity("R", "R11", Role.Retailer);
      await contract.connect(customer).registerEntity("C", "C11", Role.Customer);
      await contract.connect(mfr).manufactureDrug("Drug", "D101", 1000, mfgDate, expiryFuture);
    });

    it("customer cannot manufacture", async function () {
      await expect(
        contract.connect(customer).manufactureDrug("Drug", "D999", 10, mfgDate, expiryFuture)
      ).to.be.revertedWith("Unauthorized role");
    });

    it("customer cannot supply to wholesaler", async function () {
      await expect(
        contract.connect(customer).supplyToWholesaler("D101", "W11", 10)
      ).to.be.revertedWith("Unauthorized role");
    });

    it("retailer cannot supply to wholesaler", async function () {
      await expect(
        contract.connect(retailer).supplyToWholesaler("D101", "W11", 10)
      ).to.be.revertedWith("Unauthorized role");
    });

    it("manufacturer cannot supply to retailer", async function () {
      await expect(
        contract.connect(mfr).supplyToRetailer("D101", "R11", 10)
      ).to.be.revertedWith("Unauthorized role");
    });

    it("unregistered stranger cannot perform any action", async function () {
      await expect(
        contract.connect(stranger).manufactureDrug("D", "D999", 10, mfgDate, expiryFuture)
      ).to.be.revertedWith("Caller is not registered");

      await expect(
        contract.connect(stranger).supplyToWholesaler("D101", "W11", 10)
      ).to.be.revertedWith("Caller is not registered");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("Expired drug transfer", function () {

    it("reverts supplyToWholesaler if drug is expired at chain-time", async function () {
      await contract.connect(mfr).registerEntity("M", "M11", Role.Manufacturer);
      await contract.connect(ws).registerEntity("W",  "W11", Role.Wholesaler);

      const now = await time.latest();
      const shortExpiry = now + 2 * HOURS;
      await contract.connect(mfr).manufactureDrug("Drug", "D101", 100, now - DAYS, shortExpiry);

      // Fast-forward time past expiry
      await time.increase(3 * HOURS);

      await expect(
        contract.connect(mfr).supplyToWholesaler("D101", "W11", 10)
      ).to.be.revertedWith("Drug is expired");
    });

    it("reverts supplyToRetailer if drug is expired", async function () {
      await contract.connect(mfr).registerEntity("M", "M11", Role.Manufacturer);
      await contract.connect(ws).registerEntity("W",  "W11", Role.Wholesaler);
      await contract.connect(retailer).registerEntity("R", "R11", Role.Retailer);

      const now = await time.latest();
      const shortExpiry = now + 2 * HOURS;
      await contract.connect(mfr).manufactureDrug("Drug", "D101", 100, now - DAYS, shortExpiry);
      await contract.connect(mfr).supplyToWholesaler("D101", "W11", 50);

      await time.increase(3 * HOURS);

      await expect(
        contract.connect(ws).supplyToRetailer("D101", "R11", 10)
      ).to.be.revertedWith("Drug is expired");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("Drug recall", function () {

    beforeEach(async function () {
      await contract.connect(mfr).registerEntity("M", "M11", Role.Manufacturer);
      await contract.connect(mfr).manufactureDrug("Drug", "D101", 100, mfgDate, expiryFuture);
    });

    it("manufacturer can recall their own drug", async function () {
      const tx = await contract.connect(mfr).recallDrug("D101", "Contamination");
      const receipt = await tx.wait();
      // Verify event was emitted (without timestamp comparison)
      const event = receipt.logs.find(
        (l) => l.fragment && l.fragment.name === "DrugRecalled"
      );
      expect(event).to.not.be.undefined;

      const d = await contract.getDrug("D101");
      expect(d.isRecalled).to.be.true;
      expect(d.recallReason).to.equal("Contamination");
    });

    it("contract owner can recall any drug", async function () {
      await expect(contract.connect(owner).recallDrug("D101", "Admin recall"))
        .to.emit(contract, "DrugRecalled");
    });

    it("stranger cannot recall a drug", async function () {
      await expect(
        contract.connect(stranger).recallDrug("D101", "Hack")
      ).to.be.revertedWith("Not authorized to recall this drug");
    });

    it("cannot recall an already-recalled drug", async function () {
      await contract.connect(mfr).recallDrug("D101", "First recall");
      await expect(
        contract.connect(mfr).recallDrug("D101", "Second recall")
      ).to.be.revertedWith("Drug is already recalled");
    });

    it("getDrugStatus returns Recalled", async function () {
      await contract.connect(mfr).recallDrug("D101", "Recall");
      expect(await contract.getDrugStatus("D101")).to.equal(DrugStatus.Recalled);
    });

    it("getDrugStatus returns Expired after time passes", async function () {
      const now = await time.latest();
      const shortExpiry = now + 1 * HOURS;
      await contract.connect(mfr).manufactureDrug("Drug2", "D102", 100, now - DAYS, shortExpiry);
      await time.increase(2 * HOURS);
      expect(await contract.getDrugStatus("D102")).to.equal(DrugStatus.Expired);
    });

    it("getDrugStatus returns Active for valid drug", async function () {
      expect(await contract.getDrugStatus("D101")).to.equal(DrugStatus.Active);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("Drug history", function () {

    beforeEach(async function () {
      await contract.connect(mfr).registerEntity("M", "M11", Role.Manufacturer);
      await contract.connect(ws).registerEntity("W",  "W11", Role.Wholesaler);
      await contract.connect(retailer).registerEntity("R", "R11", Role.Retailer);
      await contract.connect(customer).registerEntity("C", "C11", Role.Customer);
      await contract.connect(mfr).manufactureDrug("Paracetamol", "D101", 1000, mfgDate, expiryFuture);
    });

    it("records history for each transfer", async function () {
      await contract.connect(mfr).supplyToWholesaler("D101", "W11", 400);
      await contract.connect(ws).supplyToRetailer("D101", "R11", 200);
      await contract.connect(retailer).supplyToCustomer("D101", "C11", 20);

      const history = await contract.getDrugHistory("D101");
      expect(history.length).to.equal(3);

      expect(history[0].fromRole).to.equal(Role.Manufacturer);
      expect(history[0].toRole).to.equal(Role.Wholesaler);
      expect(history[0].quantity).to.equal(400n);

      expect(history[1].fromRole).to.equal(Role.Wholesaler);
      expect(history[1].toRole).to.equal(Role.Retailer);
      expect(history[1].quantity).to.equal(200n);

      expect(history[2].fromRole).to.equal(Role.Retailer);
      expect(history[2].toRole).to.equal(Role.Customer);
      expect(history[2].quantity).to.equal(20n);
    });

    it("getDrugHistoryCount returns correct count", async function () {
      await contract.connect(mfr).supplyToWholesaler("D101", "W11", 100);
      expect(await contract.getDrugHistoryCount("D101")).to.equal(1n);
    });

    it("getDrugHistoryItem returns specific record", async function () {
      await contract.connect(mfr).supplyToWholesaler("D101", "W11", 100);
      const item = await contract.getDrugHistoryItem("D101", 0);
      expect(item.fromId).to.equal("M11");
      expect(item.toId).to.equal("W11");
    });

    it("reverts getDrugHistoryItem on out-of-bounds index", async function () {
      await expect(
        contract.getDrugHistoryItem("D101", 0)
      ).to.be.revertedWith("Index out of bounds");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("Customer inventory", function () {

    beforeEach(async function () {
      await contract.connect(mfr).registerEntity("M", "M11", Role.Manufacturer);
      await contract.connect(ws).registerEntity("W",  "W11", Role.Wholesaler);
      await contract.connect(retailer).registerEntity("R", "R11", Role.Retailer);
      await contract.connect(customer).registerEntity("C", "C11", Role.Customer);
      await contract.connect(mfr).manufactureDrug("Paracetamol", "D101", 1000, mfgDate, expiryFuture);
      await contract.connect(mfr).supplyToWholesaler("D101", "W11", 400);
      await contract.connect(ws).supplyToRetailer("D101", "R11", 200);
    });

    it("shows correct customer drug details", async function () {
      await contract.connect(retailer).supplyToCustomer("D101", "C11", 20);

      const drug = await contract.getCustomerDrug("C11", 0);
      expect(drug.drugId).to.equal("D101");
      expect(drug.drugName).to.equal("Paracetamol");
      expect(drug.quantity).to.equal(20n);
      expect(drug.fromRetailerId).to.equal("R11");
    });

    it("getCustomerDrugCount increments correctly", async function () {
      expect(await contract.getCustomerDrugCount("C11")).to.equal(0n);
      await contract.connect(retailer).supplyToCustomer("D101", "C11", 5);
      expect(await contract.getCustomerDrugCount("C11")).to.equal(1n);
      await contract.connect(retailer).supplyToCustomer("D101", "C11", 5);
      expect(await contract.getCustomerDrugCount("C11")).to.equal(2n);
    });

    it("reverts getCustomerDrug on out-of-bounds", async function () {
      await expect(
        contract.getCustomerDrug("C11", 0)
      ).to.be.revertedWith("Index out of bounds");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("Drug verification", function () {

    beforeEach(async function () {
      await contract.connect(mfr).registerEntity("ABC Pharma", "M11", Role.Manufacturer);
      await contract.connect(mfr).manufactureDrug("Paracetamol", "D101", 1000, mfgDate, expiryFuture);
    });

    it("returns full verification data for an existing drug", async function () {
      const r = await contract.verifyDrug("D101");
      expect(r.exists).to.be.true;
      expect(r.drugName).to.equal("Paracetamol");
      expect(r.manufacturerId).to.equal("M11");
      expect(r.isExpired).to.be.false;
      expect(r.isRecalled).to.be.false;
      expect(r.manufacturedQty).to.equal(1000n);
    });

    it("returns exists=false for unknown drug ID", async function () {
      const r = await contract.verifyDrug("UNKNOWN");
      expect(r.exists).to.be.false;
    });

    it("correctly shows recalled status in verification", async function () {
      await contract.connect(mfr).recallDrug("D101", "Bad batch");
      const r = await contract.verifyDrug("D101");
      expect(r.isRecalled).to.be.true;
      expect(r.recallReason).to.equal("Bad batch");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("Inventory queries", function () {

    beforeEach(async function () {
      await contract.connect(mfr).registerEntity("M", "M11", Role.Manufacturer);
      await contract.connect(ws).registerEntity("W",  "W11", Role.Wholesaler);
      await contract.connect(retailer).registerEntity("R", "R11", Role.Retailer);
      await contract.connect(mfr).manufactureDrug("D1", "D101", 1000, mfgDate, expiryFuture);
      await contract.connect(mfr).manufactureDrug("D2", "D102", 500,  mfgDate, expiryFuture);
    });

    it("getManufacturerInventory returns all drugs made by that wallet", async function () {
      const inv = await contract.getManufacturerInventory(mfr.address);
      expect(inv.length).to.equal(2);
    });

    it("getWholesalerInventory reflects correct balances after supply", async function () {
      await contract.connect(mfr).supplyToWholesaler("D101", "W11", 300);
      await contract.connect(mfr).supplyToWholesaler("D102", "W11", 200);

      const inv = await contract.getWholesalerInventory(ws.address);
      expect(inv.length).to.equal(2);
    });

    it("getRetailerInventory is empty before any supply", async function () {
      const inv = await contract.getRetailerInventory(retailer.address);
      expect(inv.length).to.equal(0);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("Admin stats", function () {

    it("getTotalEntities returns correct count", async function () {
      expect(await contract.getTotalEntities()).to.equal(0n);
      await contract.connect(mfr).registerEntity("M", "M11", Role.Manufacturer);
      expect(await contract.getTotalEntities()).to.equal(1n);
    });

    it("getTotalDrugs returns correct count", async function () {
      await contract.connect(mfr).registerEntity("M", "M11", Role.Manufacturer);
      expect(await contract.getTotalDrugs()).to.equal(0n);
      await contract.connect(mfr).manufactureDrug("D", "D101", 100, mfgDate, expiryFuture);
      expect(await contract.getTotalDrugs()).to.equal(1n);
    });

    it("getRecalledDrugs lists recalled drugs only", async function () {
      await contract.connect(mfr).registerEntity("M", "M11", Role.Manufacturer);
      await contract.connect(mfr).manufactureDrug("D1", "D101", 100, mfgDate, expiryFuture);
      await contract.connect(mfr).manufactureDrug("D2", "D102", 100, mfgDate, expiryFuture);
      await contract.connect(mfr).recallDrug("D101", "Reason");

      const recalled = await contract.getRecalledDrugs();
      expect(recalled.length).to.equal(1);
      expect(recalled[0].drugId).to.equal("D101");
    });

    it("getExpiredDrugs lists expired drugs only", async function () {
      await contract.connect(mfr).registerEntity("M", "M11", Role.Manufacturer);
      const now = await time.latest();
      const shortExpiry = now + 1 * HOURS;
      await contract.connect(mfr).manufactureDrug("D1", "D101", 100, now - DAYS, shortExpiry);
      await contract.connect(mfr).manufactureDrug("D2", "D102", 100, now - DAYS, now + 2 * YEARS);

      await time.increase(2 * HOURS);

      const expired = await contract.getExpiredDrugs();
      expect(expired.length).to.equal(1);
      expect(expired[0].drugId).to.equal("D101");
    });
  });
});
