// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./SimpleEscrow.sol";
import "./PropertyDeed.sol";

/**
 * @title RealEstatePurchase
 * @notice Full real estate purchase agreement — shown to users as "Home Purchase Agreement"
 * @dev Extends SimpleEscrow with document tracking and state-law conditions
 */
contract RealEstatePurchase is SimpleEscrow {
    PropertyDeed public immutable deedContract;

    // Property info
    string public propertyAddress;
    string public apn;
    string public state; // OH, KY, IN

    // Document IPFS CIDs
    string public purchaseContractCid;
    string public sellerDisclosureCid;
    string public titleCommitmentCid;
    string public recordedDeedCid;

    // State law hash — keccak256 of state config stored for legal reference
    bytes32 public stateLawHash;

    // Condition flags (mirrors off-chain completion)
    bool public titleClear;
    bool public disclosureDelivered;
    bool public inspectionComplete;
    bool public fundingConfirmed;
    bool public salesDisclosureFiled; // Indiana-specific

    // Minted deed token ID (0 = not yet minted)
    uint256 public deedTokenId;
    bool public deedMinted;

    event DocumentUploaded(string docType, string ipfsCid, uint256 timestamp);
    event ConditionMet(string condition, address confirmedBy);
    event DeedRegistered(uint256 indexed tokenId, address indexed newOwner);

    constructor(
        address _buyer,
        address _seller,
        address _arbiter,
        uint256 _depositAmount,
        uint256 _closingTimestamp,
        address _deedContract,
        string memory _propertyAddress,
        string memory _apn,
        string memory _state,
        bytes32 _stateLawHash
    ) SimpleEscrow(_buyer, _seller, _arbiter, _depositAmount, _closingTimestamp) {
        deedContract = PropertyDeed(_deedContract);
        propertyAddress = _propertyAddress;
        apn = _apn;
        state = _state;
        stateLawHash = _stateLawHash;
    }

    /**
     * @notice Upload a document CID — records document hash on-chain
     * @dev User-facing: "Upload [Document Type]"
     */
    function uploadDocument(string memory docType, string memory ipfsCid) external onlyParties {
        bytes32 docHash = keccak256(bytes(docType));

        if (docHash == keccak256("purchase_contract")) {
            purchaseContractCid = ipfsCid;
        } else if (docHash == keccak256("seller_disclosure")) {
            sellerDisclosureCid = ipfsCid;
            disclosureDelivered = true;
            emit ConditionMet("disclosure_delivered", msg.sender);
        } else if (docHash == keccak256("title_commitment")) {
            titleCommitmentCid = ipfsCid;
        } else if (docHash == keccak256("recorded_deed")) {
            recordedDeedCid = ipfsCid;
        }

        emit DocumentUploaded(docType, ipfsCid, block.timestamp);
    }

    function confirmTitleClear() external onlyParties {
        titleClear = true;
        emit ConditionMet("title_clear", msg.sender);
    }

    function confirmInspectionComplete() external onlyBuyer {
        inspectionComplete = true;
        emit ConditionMet("inspection_complete", msg.sender);
    }

    function confirmFunding() external onlyArbiter {
        fundingConfirmed = true;
        emit ConditionMet("funding_confirmed", msg.sender);
    }

    function confirmSalesDisclosureFiled() external onlyParties {
        salesDisclosureFiled = true;
        emit ConditionMet("sales_disclosure_filed", msg.sender);
    }

    /**
     * @notice Check if all conditions are met to proceed to closing
     */
    function allConditionsMet() public view returns (bool) {
        bool baseConditions = titleClear && disclosureDelivered && inspectionComplete && fundingConfirmed;

        // Indiana requires sales disclosure filing
        if (keccak256(bytes(state)) == keccak256(bytes("IN"))) {
            return baseConditions && salesDisclosureFiled;
        }

        return baseConditions;
    }

    /**
     * @notice Register deed digitally after all conditions met and funds released
     * @dev User-facing: "Register your deed digitally"
     * Can only be called after funds are released (state = COMPLETE)
     */
    function registerDeed(string memory ipfsCid) external onlyArbiter {
        require(state == EscrowState.COMPLETE, "Funds must be released before deed registration");
        require(allConditionsMet(), "All conditions must be met");
        require(!deedMinted, "Deed already registered");
        require(bytes(ipfsCid).length > 0, "IPFS CID required");

        deedMinted = true;
        deedTokenId = deedContract.mintDeed(buyer, propertyAddress, apn, state, ipfsCid);

        emit DeedRegistered(deedTokenId, buyer);
    }

    function getConditions() external view returns (
        bool _titleClear,
        bool _disclosureDelivered,
        bool _inspectionComplete,
        bool _fundingConfirmed,
        bool _salesDisclosureFiled,
        bool _allMet
    ) {
        return (
            titleClear,
            disclosureDelivered,
            inspectionComplete,
            fundingConfirmed,
            salesDisclosureFiled,
            allConditionsMet()
        );
    }
}
