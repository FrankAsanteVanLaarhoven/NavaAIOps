// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NavaChain Audit Ledger
 * @notice Stores the immutable truth of NavaFlow audit logs.
 *         Uses a "Lightweight Hashing" strategy: Only Hashes and IPFS CIDs are stored.
 *         The full data lives in high-speed Neon DB (Off-Chain).
 *         This ensures <100ms write latency while providing 100% immutability.
 * @dev Deployed on Polygon L2 (Amoy testnet or Mainnet) for fast, cheap transactions.
 */
contract AuditLedger is Ownable, ReentrancyGuard {
    // --- State ---
    // Mapping: LogID (bytes32 hash of UUID) -> Metadata Hash & IPFS CID
    mapping(bytes32 => LogMetadata) public logs;
    
    // Authorized bridge address (only this can anchor logs)
    address public bridgeAddress;
    
    // Event Logs
    event LogAnchored(
        bytes32 indexed logId,
        bytes32 metadataHash,
        string ipfsCid,
        uint256 timestamp,
        address indexed archivedBy
    );
    
    event BridgeAddressUpdated(address oldBridge, address newBridge);

    // --- Structs ---
    struct LogMetadata {
        bytes32 metadataHash; // Hash of the log entry (Timestamp, User, Action)
        string ipfsCid;      // IPFS CID where full log JSON is stored
        uint256 timestamp;    // When was it anchored?
        address archivedBy;   // Who (System/Bridge) signed it?
        bool exists;          // Flag to check existence
    }

    constructor(address _bridgeAddress) Ownable(msg.sender) {
        require(_bridgeAddress != address(0), "Bridge address cannot be zero");
        bridgeAddress = _bridgeAddress;
        emit BridgeAddressUpdated(address(0), _bridgeAddress);
    }

    /**
     * @notice Updates the authorized bridge address.
     * @dev Only owner can call this.
     * @param _newBridgeAddress The new bridge address.
     */
    function updateBridgeAddress(address _newBridgeAddress) external onlyOwner {
        require(_newBridgeAddress != address(0), "Bridge address cannot be zero");
        address oldBridge = bridgeAddress;
        bridgeAddress = _newBridgeAddress;
        emit BridgeAddressUpdated(oldBridge, _newBridgeAddress);
    }

    /**
     * @notice Anchors a new audit log to the blockchain.
     * @dev Only the "NavaBridge" (Rust Service) can call this.
     * @param logId Unique ID of the log (bytes32 hash of UUID).
     * @param metadataHash SHA-256 hash of the log payload.
     * @param ipfsCid CID on IPFS containing the full log JSON.
     */
    function anchorLog(
        bytes32 logId,
        bytes32 metadataHash,
        string calldata ipfsCid
    ) external nonReentrant {
        // 1. Only bridge can anchor
        require(msg.sender == bridgeAddress, "Only bridge can anchor logs");
        
        // 2. Check for duplicates (Replay Attack protection)
        require(!logs[logId].exists, "Log already anchored");

        // 3. Validate IPFS CID format (basic check)
        require(bytes(ipfsCid).length > 0, "IPFS CID cannot be empty");

        // 4. Store the "Lightweight Hash" (Metadata) + IPFS Pointer
        logs[logId] = LogMetadata({
            metadataHash: metadataHash,
            ipfsCid: ipfsCid,
            timestamp: block.timestamp,
            archivedBy: msg.sender,
            exists: true
        });

        emit LogAnchored(logId, metadataHash, ipfsCid, block.timestamp, msg.sender);
    }

    /**
     * @notice Batch anchors multiple logs in a single transaction.
     * @dev Only bridge can call this. More gas efficient for multiple logs.
     * @param logIds Array of log IDs.
     * @param metadataHashes Array of metadata hashes.
     * @param ipfsCids Array of IPFS CIDs.
     */
    function anchorLogsBatch(
        bytes32[] calldata logIds,
        bytes32[] calldata metadataHashes,
        string[] calldata ipfsCids
    ) external nonReentrant {
        require(msg.sender == bridgeAddress, "Only bridge can anchor logs");
        require(
            logIds.length == metadataHashes.length && logIds.length == ipfsCids.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < logIds.length; i++) {
            require(!logs[logIds[i]].exists, "Log already anchored");
            require(bytes(ipfsCids[i]).length > 0, "IPFS CID cannot be empty");

            logs[logIds[i]] = LogMetadata({
                metadataHash: metadataHashes[i],
                ipfsCid: ipfsCids[i],
                timestamp: block.timestamp,
                archivedBy: msg.sender,
                exists: true
            });

            emit LogAnchored(
                logIds[i],
                metadataHashes[i],
                ipfsCids[i],
                block.timestamp,
                msg.sender
            );
        }
    }

    /**
     * @notice Verifies the integrity of a log entry.
     * @dev Anyone can call this (Frontend/Other Systems).
     * @param logId The ID of the log to verify (bytes32 hash of UUID).
     * @return valid True if the log exists on-chain.
     * @return metadataHash The stored metadata hash.
     * @return ipfsCid The IPFS CID.
     * @return timestamp When it was anchored.
     */
    function verifyLog(bytes32 logId)
        external
        view
        returns (
            bool valid,
            bytes32 metadataHash,
            string memory ipfsCid,
            uint256 timestamp
        )
    {
        LogMetadata memory meta = logs[logId];
        
        // If log doesn't exist on-chain, it's invalid
        if (!meta.exists) {
            return (false, bytes32(0), "", 0);
        }

        return (true, meta.metadataHash, meta.ipfsCid, meta.timestamp);
    }

    /**
     * @notice Checks if a log exists on-chain.
     * @param logId The log ID to check.
     * @return exists True if the log exists.
     */
    function logExists(bytes32 logId) external view returns (bool) {
        return logs[logId].exists;
    }

    /**
     * @notice Gets the total number of anchored logs (approximate).
     * @dev This is a view function that counts existing logs.
     *      Note: This is expensive and should be used sparingly.
     * @return count The number of logs (this is a placeholder - actual count requires events).
     */
    function getLogCount() external pure returns (uint256) {
        // In production, you'd query events or maintain a counter
        // This is a placeholder
        return 0;
    }
}
