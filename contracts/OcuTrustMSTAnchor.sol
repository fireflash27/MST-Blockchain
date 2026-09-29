// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OcuTrustMSTAnchor
 * @dev Notarizes Glaucoma screening records on MST Chain (Parlia Consensus)
 * using a single unified central record hash combining both eye retinal scans,
 * image metadata, clinical findings, and ASBridge custodian wallet (0x3C33...606F).
 */
contract OcuTrustMSTAnchor {
    
    // Designated ASBridge Custodian Wallet Authority
    address public constant ASBRIDGE_AUTHORITY = 0x3C33D9c4a3F087F6662D0Ab198bAD3e2212e606F;

    struct UnifiedScreeningRecord {
        bytes32 unifiedRecordHash; // Central Master SHA-256 (both eyes + metadata + clinical info)
        address asbridgeSigner;    // ASBridge relayer custodian wallet
        uint256 blockTimestamp;    // Block timestamp of notarization
        uint256 blockNumber;        // Block height
        bool isAnchored;           // Existence verification flag
    }

    // Mapping: unifiedRecordHash => UnifiedScreeningRecord
    mapping(bytes32 => UnifiedScreeningRecord) public screenings;

    // Total count of records anchored
    uint256 public totalAnchored;

    // Events
    event ScreeningAnchored(
        bytes32 indexed unifiedRecordHash,
        address indexed asbridgeSigner,
        uint256 blockTimestamp,
        uint256 blockNumber
    );

    /**
     * @notice Notarizes a unified central glaucoma record hash onto MST Chain
     * @param _unifiedRecordHash Central 32-byte Master SHA-256 Digest
     */
    function anchorScreening(
        bytes32 _unifiedRecordHash
    ) external returns (bool) {
        require(!screenings[_unifiedRecordHash].isAnchored, "Record already anchored on MST Chain");

        screenings[_unifiedRecordHash] = UnifiedScreeningRecord({
            unifiedRecordHash: _unifiedRecordHash,
            asbridgeSigner: msg.sender == address(0) ? ASBRIDGE_AUTHORITY : msg.sender,
            blockTimestamp: block.timestamp,
            blockNumber: block.number,
            isAnchored: true
        });

        totalAnchored += 1;

        emit ScreeningAnchored(
            _unifiedRecordHash,
            msg.sender == address(0) ? ASBRIDGE_AUTHORITY : msg.sender,
            block.timestamp,
            block.number
        );

        return true;
    }

    /**
     * @notice Verifies if a given central unified record hash exists on MST Chain
     * @param _unifiedRecordHash The Master SHA-256 hash to query
     */
    function verifyScreening(bytes32 _unifiedRecordHash) 
        external 
        view 
        returns (
            bool isAnchored,
            address asbridgeSigner,
            uint256 blockTimestamp,
            uint256 blockNumber
        ) 
    {
        UnifiedScreeningRecord memory record = screenings[_unifiedRecordHash];
        return (
            record.isAnchored,
            record.asbridgeSigner,
            record.blockTimestamp,
            record.blockNumber
        );
    }
}
