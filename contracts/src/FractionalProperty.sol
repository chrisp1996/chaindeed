// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FractionalProperty
 * @notice Fractional property investment — shown to users as "Property Investment Shares"
 * @dev ERC-1155 for fractional shares. Accumulates MATIC until target reached.
 */
contract FractionalProperty is ERC1155, Ownable, ReentrancyGuard {
    uint256 public constant PROPERTY_TOKEN_ID = 1;

    string public propertyAddress;
    string public ipfsMetadataCid;
    uint256 public totalShares;
    uint256 public sharePrice; // in wei (MATIC)
    uint256 public targetAmount; // total raise in wei
    uint256 public raisedAmount;
    uint256 public closingDeadline;

    bool public offeringActive;
    bool public targetReached;
    bool public purchased;

    mapping(address => uint256) public investorShares;
    address[] public investors;

    event SharesPurchased(address indexed investor, uint256 shares, uint256 amount);
    event TargetReached(uint256 totalRaised);
    event RentalDistributed(uint256 totalAmount, uint256 perShare);
    event RefundIssued(address indexed investor, uint256 amount);

    modifier offeringOpen() {
        require(offeringActive, "Offering is not active");
        require(!targetReached, "Target already reached");
        require(block.timestamp <= closingDeadline, "Offering deadline has passed");
        _;
    }

    constructor(
        string memory _propertyAddress,
        string memory _ipfsMetadataCid,
        uint256 _totalShares,
        uint256 _sharePrice,
        uint256 _closingDeadline
    ) ERC1155(string(abi.encodePacked("ipfs://", _ipfsMetadataCid))) Ownable(msg.sender) {
        require(_totalShares > 0, "Must have at least 1 share");
        require(_sharePrice > 0, "Share price must be positive");
        require(_closingDeadline > block.timestamp, "Deadline must be in future");

        propertyAddress = _propertyAddress;
        ipfsMetadataCid = _ipfsMetadataCid;
        totalShares = _totalShares;
        sharePrice = _sharePrice;
        targetAmount = _totalShares * _sharePrice;
        closingDeadline = _closingDeadline;
        offeringActive = true;
    }

    /**
     * @notice Invest in property shares
     * @dev User-facing: "Purchase Investment Shares"
     */
    function invest(uint256 numShares) external payable offeringOpen nonReentrant {
        require(numShares > 0, "Must purchase at least 1 share");
        uint256 cost = numShares * sharePrice;
        require(msg.value == cost, "Incorrect payment amount");

        uint256 availableShares = totalShares - (raisedAmount / sharePrice);
        require(numShares <= availableShares, "Not enough shares available");

        if (investorShares[msg.sender] == 0) {
            investors.push(msg.sender);
        }

        investorShares[msg.sender] += numShares;
        raisedAmount += msg.value;

        _mint(msg.sender, PROPERTY_TOKEN_ID, numShares, "");

        emit SharesPurchased(msg.sender, numShares, msg.value);

        if (raisedAmount >= targetAmount) {
            targetReached = true;
            emit TargetReached(raisedAmount);
        }
    }

    /**
     * @notice Distribute rental income pro-rata to all shareholders
     * @dev User-facing: "Distribute Rental Income"
     */
    function distributeRentalIncome() external payable onlyOwner nonReentrant {
        require(targetReached, "Property not yet fully funded");
        require(msg.value > 0, "Must send MATIC to distribute");
        require(investors.length > 0, "No investors to distribute to");

        uint256 perShare = msg.value / totalShares;
        require(perShare > 0, "Distribution amount too small");

        for (uint256 i = 0; i < investors.length; i++) {
            address investor = investors[i];
            uint256 shares = investorShares[investor];
            if (shares > 0) {
                uint256 payout = shares * perShare;
                (bool success, ) = investor.call{value: payout}("");
                require(success, "Distribution failed");
            }
        }

        emit RentalDistributed(msg.value, perShare);
    }

    /**
     * @notice Refund investors if target not reached by deadline
     */
    function claimRefund() external nonReentrant {
        require(block.timestamp > closingDeadline, "Deadline not passed");
        require(!targetReached, "Target was reached - no refund available");

        uint256 shares = investorShares[msg.sender];
        require(shares > 0, "No shares to refund");

        uint256 refundAmount = shares * sharePrice;
        investorShares[msg.sender] = 0;
        _burn(msg.sender, PROPERTY_TOKEN_ID, shares);

        (bool success, ) = msg.sender.call{value: refundAmount}("");
        require(success, "Refund failed");

        emit RefundIssued(msg.sender, refundAmount);
    }

    function getOfferingStatus() external view returns (
        uint256 _totalShares,
        uint256 _soldShares,
        uint256 _sharePrice,
        uint256 _raisedAmount,
        uint256 _targetAmount,
        bool _targetReached,
        bool _offeringActive,
        uint256 _deadline
    ) {
        return (
            totalShares,
            raisedAmount / sharePrice,
            sharePrice,
            raisedAmount,
            targetAmount,
            targetReached,
            offeringActive,
            closingDeadline
        );
    }
}
