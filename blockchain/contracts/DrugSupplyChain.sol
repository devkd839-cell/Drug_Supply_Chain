// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DrugSupplyChain
 * @notice Tracks pharmaceutical drugs from Manufacturer → Wholesaler → Retailer → Customer
 * @dev All critical supply-chain state lives on-chain. Ownership-aware mappings prevent
 *      cross-entity stock manipulation.
 */
contract DrugSupplyChain {

    // ─────────────────────────────────────────────────────────────────────────
    // ENUMS
    // ─────────────────────────────────────────────────────────────────────────

    enum Role {
        None,           // 0 – unregistered / invalid
        Manufacturer,   // 1
        Wholesaler,     // 2
        Retailer,       // 3
        Customer        // 4
    }

    enum DrugStatus {
        Active,     // 0
        Expired,    // 1
        Recalled    // 2
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STRUCTS
    // ─────────────────────────────────────────────────────────────────────────

    struct Entity {
        string  name;
        string  id;          // e.g. M11, W11, R11, C11
        Role    role;
        address wallet;
        bool    isRegistered;
        bool    isActive;
        uint256 registeredAt;
    }

    struct DrugBatch {
        string   drugName;
        string   drugId;
        string   manufacturerId;
        address  manufacturerWallet;
        uint256  manufacturedQty;
        uint256  remainingQty;       // at manufacturer level
        uint256  manufacturingDate;
        uint256  expiryDate;
        bool     isRecalled;
        string   recallReason;
        bool     exists;
        uint256  createdAt;
    }

    /// @dev Per-transfer record stored in the drug's history array.
    struct DrugTransaction {
        string   drugId;
        string   fromId;
        string   toId;
        Role     fromRole;
        Role     toRole;
        uint256  quantity;
        uint256  timestamp;
        address  fromWallet;
        address  toWallet;
    }

    /// @dev Inventory slot for wholesalers and retailers (keyed by their wallet).
    struct InventorySlot {
        string   drugId;
        string   drugName;
        uint256  receivedQty;
        uint256  availableQty;
        uint256  suppliedQty;
        bool     exists;
    }

    /// @dev A drug held by a customer.
    struct CustomerDrug {
        string   drugId;
        string   drugName;
        uint256  quantity;
        string   fromRetailerId;
        uint256  receivedAt;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STATE VARIABLES
    // ─────────────────────────────────────────────────────────────────────────

    address public owner;

    // Entity storage
    mapping(address => Entity)  private entityByWallet;
    mapping(string  => Entity)  private entityById;
    mapping(string  => address) private walletById;        // id → wallet (for lookups)
    address[]                   private allEntityWallets;

    // Drug batch storage
    mapping(string => DrugBatch) private drugs;            // drugId → DrugBatch
    string[]                     private allDrugIds;

    // Ownership-aware inventory
    // wholesaler wallet → drugId → InventorySlot
    mapping(address => mapping(string => InventorySlot)) private wholesalerInventory;
    mapping(address => string[]) private wholesalerDrugIds;

    // retailer wallet → drugId → InventorySlot
    mapping(address => mapping(string => InventorySlot)) private retailerInventory;
    mapping(address => string[]) private retailerDrugIds;

    // Customer inventory: customerId → CustomerDrug[]
    mapping(string => CustomerDrug[]) private customerInventory;

    // Drug history: drugId → DrugTransaction[]
    mapping(string => DrugTransaction[]) private drugHistory;

    // ─────────────────────────────────────────────────────────────────────────
    // EVENTS
    // ─────────────────────────────────────────────────────────────────────────

    event EntityRegistered(address indexed wallet, string id, Role role, string name);
    event EntitySuspended(string id, address indexed wallet);
    event EntityActivated(string id, address indexed wallet);

    event DrugManufactured(
        string indexed drugId,
        string drugName,
        string manufacturerId,
        uint256 quantity,
        uint256 expiryDate
    );

    event SuppliedToWholesaler(
        string indexed drugId,
        string fromManufacturerId,
        string toWholesalerId,
        uint256 quantity,
        uint256 timestamp
    );

    event SuppliedToRetailer(
        string indexed drugId,
        string fromWholesalerId,
        string toRetailerId,
        uint256 quantity,
        uint256 timestamp
    );

    event SuppliedToCustomer(
        string indexed drugId,
        string fromRetailerId,
        string toCustomerId,
        uint256 quantity,
        uint256 timestamp
    );

    event DrugRecalled(string indexed drugId, string reason, uint256 timestamp);

    // ─────────────────────────────────────────────────────────────────────────
    // MODIFIERS
    // ─────────────────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the contract owner");
        _;
    }

    modifier onlyRegistered() {
        require(entityByWallet[msg.sender].isRegistered, "Caller is not registered");
        _;
    }

    modifier onlyRole(Role _role) {
        require(entityByWallet[msg.sender].isRegistered, "Caller is not registered");
        require(entityByWallet[msg.sender].role == _role, "Unauthorized role");
        _;
    }

    modifier onlyActive() {
        require(entityByWallet[msg.sender].isActive, "Entity is suspended");
        _;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONSTRUCTOR
    // ─────────────────────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ENTITY MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Register a new entity (wallet → name / id / role).
     * @dev Anyone can call; one registration per wallet, IDs must be unique, Role.None forbidden.
     */
    function registerEntity(
        string calldata _name,
        string calldata _id,
        Role _role
    ) external {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_id).length   > 0, "ID cannot be empty");
        require(_role != Role.None,       "Role.None is not allowed");
        require(!entityByWallet[msg.sender].isRegistered, "Wallet already registered");
        require(!entityById[_id].isRegistered,            "Entity ID already taken");

        Entity memory e = Entity({
            name:         _name,
            id:           _id,
            role:         _role,
            wallet:       msg.sender,
            isRegistered: true,
            isActive:     true,
            registeredAt: block.timestamp
        });

        entityByWallet[msg.sender] = e;
        entityById[_id]            = e;
        walletById[_id]            = msg.sender;
        allEntityWallets.push(msg.sender);

        emit EntityRegistered(msg.sender, _id, _role, _name);
    }

    /// @notice Suspend an entity (admin only).
    function suspendEntity(string calldata _id) external onlyOwner {
        require(entityById[_id].isRegistered, "Entity not found");
        entityById[_id].isActive                           = false;
        entityByWallet[walletById[_id]].isActive           = false;
        emit EntitySuspended(_id, walletById[_id]);
    }

    /// @notice Re-activate a suspended entity (admin only).
    function activateEntity(string calldata _id) external onlyOwner {
        require(entityById[_id].isRegistered, "Entity not found");
        entityById[_id].isActive                           = true;
        entityByWallet[walletById[_id]].isActive           = true;
        emit EntityActivated(_id, walletById[_id]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ENTITY QUERIES
    // ─────────────────────────────────────────────────────────────────────────

    function getEntityByWallet(address _wallet) external view returns (Entity memory) {
        return entityByWallet[_wallet];
    }

    function getEntityById(string calldata _id) external view returns (Entity memory) {
        return entityById[_id];
    }

    function isEntityRegistered(address _wallet) external view returns (bool) {
        return entityByWallet[_wallet].isRegistered;
    }

    function getAllEntities() external view returns (Entity[] memory) {
        Entity[] memory list = new Entity[](allEntityWallets.length);
        for (uint256 i = 0; i < allEntityWallets.length; i++) {
            list[i] = entityByWallet[allEntityWallets[i]];
        }
        return list;
    }

    function getEntitiesByRole(Role _role) external view returns (Entity[] memory) {
        // First pass: count
        uint256 count = 0;
        for (uint256 i = 0; i < allEntityWallets.length; i++) {
            if (entityByWallet[allEntityWallets[i]].role == _role) count++;
        }
        // Second pass: fill
        Entity[] memory list = new Entity[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allEntityWallets.length; i++) {
            if (entityByWallet[allEntityWallets[i]].role == _role) {
                list[idx++] = entityByWallet[allEntityWallets[i]];
            }
        }
        return list;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DRUG MANUFACTURING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Create a new drug batch. Caller must be a registered active Manufacturer.
     */
    function manufactureDrug(
        string calldata _drugName,
        string calldata _drugId,
        uint256         _quantity,
        uint256         _manufacturingDate,
        uint256         _expiryDate
    ) external onlyRole(Role.Manufacturer) onlyActive {
        require(bytes(_drugName).length > 0, "Drug name cannot be empty");
        require(bytes(_drugId).length   > 0, "Drug ID cannot be empty");
        require(_quantity > 0,               "Quantity must be greater than zero");
        require(!drugs[_drugId].exists,      "Drug ID already exists");
        require(_expiryDate > _manufacturingDate, "Expiry must be after manufacturing date");
        require(_expiryDate > block.timestamp,    "Expiry date is already in the past");

        Entity storage mfr = entityByWallet[msg.sender];

        drugs[_drugId] = DrugBatch({
            drugName:          _drugName,
            drugId:            _drugId,
            manufacturerId:    mfr.id,
            manufacturerWallet: msg.sender,
            manufacturedQty:   _quantity,
            remainingQty:      _quantity,
            manufacturingDate: _manufacturingDate,
            expiryDate:        _expiryDate,
            isRecalled:        false,
            recallReason:      "",
            exists:            true,
            createdAt:         block.timestamp
        });

        allDrugIds.push(_drugId);

        emit DrugManufactured(_drugId, _drugName, mfr.id, _quantity, _expiryDate);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUPPLY TO WHOLESALER
    // ─────────────────────────────────────────────────────────────────────────

    function supplyToWholesaler(
        string calldata _drugId,
        string calldata _wholesalerId,
        uint256         _quantity
    ) external onlyRole(Role.Manufacturer) onlyActive {
        require(_quantity > 0,             "Quantity must be greater than zero");
        require(drugs[_drugId].exists,     "Drug batch does not exist");

        DrugBatch storage batch = drugs[_drugId];

        require(
            batch.manufacturerWallet == msg.sender,
            "Drug does not belong to this manufacturer"
        );
        require(!_isDrugExpired(_drugId),  "Drug is expired");
        require(!batch.isRecalled,         "Drug is recalled");
        require(batch.remainingQty >= _quantity, "Insufficient manufacturer stock");

        // Validate wholesaler
        require(entityById[_wholesalerId].isRegistered, "Target ID is not a registered Wholesaler");
        require(entityById[_wholesalerId].role == Role.Wholesaler, "Target ID is not a registered Wholesaler");
        require(entityById[_wholesalerId].isActive, "Wholesaler is suspended");

        address wsWallet = walletById[_wholesalerId];

        // Update manufacturer stock
        batch.remainingQty -= _quantity;

        // Update wholesaler inventory (ownership-aware)
        InventorySlot storage slot = wholesalerInventory[wsWallet][_drugId];
        if (!slot.exists) {
            wholesalerInventory[wsWallet][_drugId] = InventorySlot({
                drugId:       _drugId,
                drugName:     batch.drugName,
                receivedQty:  _quantity,
                availableQty: _quantity,
                suppliedQty:  0,
                exists:       true
            });
            wholesalerDrugIds[wsWallet].push(_drugId);
        } else {
            slot.receivedQty  += _quantity;
            slot.availableQty += _quantity;
        }

        // Record history
        Entity storage mfr = entityByWallet[msg.sender];
        _recordTransaction(
            _drugId,
            mfr.id,
            _wholesalerId,
            Role.Manufacturer,
            Role.Wholesaler,
            _quantity,
            msg.sender,
            wsWallet
        );

        emit SuppliedToWholesaler(_drugId, mfr.id, _wholesalerId, _quantity, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUPPLY TO RETAILER
    // ─────────────────────────────────────────────────────────────────────────

    function supplyToRetailer(
        string calldata _drugId,
        string calldata _retailerId,
        uint256         _quantity
    ) external onlyRole(Role.Wholesaler) onlyActive {
        require(_quantity > 0,         "Quantity must be greater than zero");
        require(drugs[_drugId].exists, "Drug batch does not exist");

        DrugBatch storage batch = drugs[_drugId];
        require(!_isDrugExpired(_drugId), "Drug is expired");
        require(!batch.isRecalled,        "Drug is recalled");

        // Caller must own sufficient wholesaler stock
        InventorySlot storage wsSlot = wholesalerInventory[msg.sender][_drugId];
        require(wsSlot.exists,                     "Wholesaler does not hold this drug");
        require(wsSlot.availableQty >= _quantity,  "Insufficient wholesaler stock");

        // Validate retailer
        require(entityById[_retailerId].isRegistered, "Target ID is not a registered Retailer");
        require(entityById[_retailerId].role == Role.Retailer, "Target ID is not a registered Retailer");
        require(entityById[_retailerId].isActive, "Retailer is suspended");

        address rtWallet = walletById[_retailerId];

        // Update wholesaler inventory
        wsSlot.availableQty -= _quantity;
        wsSlot.suppliedQty  += _quantity;

        // Update retailer inventory
        InventorySlot storage rtSlot = retailerInventory[rtWallet][_drugId];
        if (!rtSlot.exists) {
            retailerInventory[rtWallet][_drugId] = InventorySlot({
                drugId:       _drugId,
                drugName:     batch.drugName,
                receivedQty:  _quantity,
                availableQty: _quantity,
                suppliedQty:  0,
                exists:       true
            });
            retailerDrugIds[rtWallet].push(_drugId);
        } else {
            rtSlot.receivedQty  += _quantity;
            rtSlot.availableQty += _quantity;
        }

        // Record history
        Entity storage ws = entityByWallet[msg.sender];
        _recordTransaction(
            _drugId,
            ws.id,
            _retailerId,
            Role.Wholesaler,
            Role.Retailer,
            _quantity,
            msg.sender,
            rtWallet
        );

        emit SuppliedToRetailer(_drugId, ws.id, _retailerId, _quantity, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUPPLY TO CUSTOMER
    // ─────────────────────────────────────────────────────────────────────────

    function supplyToCustomer(
        string calldata _drugId,
        string calldata _customerId,
        uint256         _quantity
    ) external onlyRole(Role.Retailer) onlyActive {
        require(_quantity > 0,         "Quantity must be greater than zero");
        require(drugs[_drugId].exists, "Drug batch does not exist");

        DrugBatch storage batch = drugs[_drugId];
        require(!_isDrugExpired(_drugId), "Drug is expired");
        require(!batch.isRecalled,        "Drug is recalled");

        // Caller must own sufficient retailer stock
        InventorySlot storage rtSlot = retailerInventory[msg.sender][_drugId];
        require(rtSlot.exists,                    "Retailer does not hold this drug");
        require(rtSlot.availableQty >= _quantity, "Insufficient retailer stock");

        // Validate customer
        require(entityById[_customerId].isRegistered, "Target ID is not a registered Customer");
        require(entityById[_customerId].role == Role.Customer, "Target ID is not a registered Customer");
        require(entityById[_customerId].isActive, "Customer is suspended");

        address custWallet = walletById[_customerId];

        // Update retailer inventory
        rtSlot.availableQty -= _quantity;
        rtSlot.suppliedQty  += _quantity;

        // Add to customer inventory
        Entity storage rt = entityByWallet[msg.sender];
        customerInventory[_customerId].push(CustomerDrug({
            drugId:         _drugId,
            drugName:       batch.drugName,
            quantity:       _quantity,
            fromRetailerId: rt.id,
            receivedAt:     block.timestamp
        }));

        // Record history
        _recordTransaction(
            _drugId,
            rt.id,
            _customerId,
            Role.Retailer,
            Role.Customer,
            _quantity,
            msg.sender,
            custWallet
        );

        emit SuppliedToCustomer(_drugId, rt.id, _customerId, _quantity, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DRUG STATUS & RECALL
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Recall a drug. Only the manufacturer who created it OR the contract owner may call.
     */
    function recallDrug(string calldata _drugId, string calldata _reason) external {
        require(drugs[_drugId].exists, "Drug batch does not exist");
        DrugBatch storage batch = drugs[_drugId];
        require(
            msg.sender == owner || msg.sender == batch.manufacturerWallet,
            "Not authorized to recall this drug"
        );
        require(!batch.isRecalled, "Drug is already recalled");

        batch.isRecalled    = true;
        batch.recallReason  = _reason;

        emit DrugRecalled(_drugId, _reason, block.timestamp);
    }

    function isDrugExpired(string calldata _drugId) external view returns (bool) {
        require(drugs[_drugId].exists, "Drug batch does not exist");
        return _isDrugExpired(_drugId);
    }

    function getDrugStatus(string calldata _drugId)
        external
        view
        returns (DrugStatus)
    {
        require(drugs[_drugId].exists, "Drug batch does not exist");
        if (drugs[_drugId].isRecalled)              return DrugStatus.Recalled;
        if (_isDrugExpired(_drugId))                return DrugStatus.Expired;
        return DrugStatus.Active;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DRUG QUERIES
    // ─────────────────────────────────────────────────────────────────────────

    function getDrug(string calldata _drugId) external view returns (DrugBatch memory) {
        require(drugs[_drugId].exists, "Drug batch does not exist");
        return drugs[_drugId];
    }

    function getAllDrugs() external view returns (DrugBatch[] memory) {
        DrugBatch[] memory list = new DrugBatch[](allDrugIds.length);
        for (uint256 i = 0; i < allDrugIds.length; i++) {
            list[i] = drugs[allDrugIds[i]];
        }
        return list;
    }

    function getDrugCount() external view returns (uint256) {
        return allDrugIds.length;
    }

    /// @dev Return type for verifyDrug – avoids stack-too-deep.
    struct VerifyResult {
        bool    exists;
        string  drugName;
        string  manufacturerId;
        address manufacturerWallet;
        uint256 manufacturingDate;
        uint256 expiryDate;
        bool    isExpired;
        bool    isRecalled;
        string  recallReason;
        uint256 manufacturedQty;
        uint256 remainingQty;
    }

    /**
     * @notice Full verification info for the Drug Verification page.
     */
    function verifyDrug(string calldata _drugId)
        external
        view
        returns (VerifyResult memory result)
    {
        if (!drugs[_drugId].exists) {
            return result; // all fields zero/false/empty
        }
        DrugBatch storage b = drugs[_drugId];
        result.exists             = true;
        result.drugName           = b.drugName;
        result.manufacturerId     = b.manufacturerId;
        result.manufacturerWallet = b.manufacturerWallet;
        result.manufacturingDate  = b.manufacturingDate;
        result.expiryDate         = b.expiryDate;
        result.isExpired          = _isDrugExpired(_drugId);
        result.isRecalled         = b.isRecalled;
        result.recallReason       = b.recallReason;
        result.manufacturedQty    = b.manufacturedQty;
        result.remainingQty       = b.remainingQty;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INVENTORY QUERIES
    // ─────────────────────────────────────────────────────────────────────────

    function getManufacturerInventory(address _wallet)
        external
        view
        returns (DrugBatch[] memory)
    {
        // Return all drug batches created by this manufacturer
        uint256 count = 0;
        for (uint256 i = 0; i < allDrugIds.length; i++) {
            if (drugs[allDrugIds[i]].manufacturerWallet == _wallet) count++;
        }
        DrugBatch[] memory list = new DrugBatch[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allDrugIds.length; i++) {
            if (drugs[allDrugIds[i]].manufacturerWallet == _wallet) {
                list[idx++] = drugs[allDrugIds[i]];
            }
        }
        return list;
    }

    function getWholesalerInventory(address _wallet)
        external
        view
        returns (InventorySlot[] memory)
    {
        string[] storage ids = wholesalerDrugIds[_wallet];
        InventorySlot[] memory list = new InventorySlot[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            list[i] = wholesalerInventory[_wallet][ids[i]];
        }
        return list;
    }

    function getRetailerInventory(address _wallet)
        external
        view
        returns (InventorySlot[] memory)
    {
        string[] storage ids = retailerDrugIds[_wallet];
        InventorySlot[] memory list = new InventorySlot[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            list[i] = retailerInventory[_wallet][ids[i]];
        }
        return list;
    }

    function getCustomerInventory(string calldata _customerId)
        external
        view
        returns (CustomerDrug[] memory)
    {
        return customerInventory[_customerId];
    }

    function getCustomerDrugCount(string calldata _customerId)
        external
        view
        returns (uint256)
    {
        return customerInventory[_customerId].length;
    }

    function getCustomerDrug(string calldata _customerId, uint256 _index)
        external
        view
        returns (CustomerDrug memory)
    {
        require(_index < customerInventory[_customerId].length, "Index out of bounds");
        return customerInventory[_customerId][_index];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DRUG HISTORY QUERIES
    // ─────────────────────────────────────────────────────────────────────────

    function getDrugHistory(string calldata _drugId)
        external
        view
        returns (DrugTransaction[] memory)
    {
        return drugHistory[_drugId];
    }

    function getDrugHistoryCount(string calldata _drugId)
        external
        view
        returns (uint256)
    {
        return drugHistory[_drugId].length;
    }

    function getDrugHistoryItem(string calldata _drugId, uint256 _index)
        external
        view
        returns (DrugTransaction memory)
    {
        require(_index < drugHistory[_drugId].length, "Index out of bounds");
        return drugHistory[_drugId][_index];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN STATS
    // ─────────────────────────────────────────────────────────────────────────

    function getTotalEntities() external view returns (uint256) {
        return allEntityWallets.length;
    }

    function getTotalDrugs() external view returns (uint256) {
        return allDrugIds.length;
    }

    function getRecalledDrugs() external view returns (DrugBatch[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < allDrugIds.length; i++) {
            if (drugs[allDrugIds[i]].isRecalled) count++;
        }
        DrugBatch[] memory list = new DrugBatch[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allDrugIds.length; i++) {
            if (drugs[allDrugIds[i]].isRecalled) list[idx++] = drugs[allDrugIds[i]];
        }
        return list;
    }

    function getExpiredDrugs() external view returns (DrugBatch[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < allDrugIds.length; i++) {
            if (_isDrugExpired(allDrugIds[i])) count++;
        }
        DrugBatch[] memory list = new DrugBatch[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allDrugIds.length; i++) {
            if (_isDrugExpired(allDrugIds[i])) list[idx++] = drugs[allDrugIds[i]];
        }
        return list;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTERNAL HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    function _isDrugExpired(string memory _drugId) internal view returns (bool) {
        return block.timestamp > drugs[_drugId].expiryDate;
    }

    function _recordTransaction(
        string memory _drugId,
        string memory _fromId,
        string memory _toId,
        Role          _fromRole,
        Role          _toRole,
        uint256       _quantity,
        address       _fromWallet,
        address       _toWallet
    ) internal {
        drugHistory[_drugId].push(DrugTransaction({
            drugId:     _drugId,
            fromId:     _fromId,
            toId:       _toId,
            fromRole:   _fromRole,
            toRole:     _toRole,
            quantity:   _quantity,
            timestamp:  block.timestamp,
            fromWallet: _fromWallet,
            toWallet:   _toWallet
        }));
    }
}
