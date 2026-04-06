// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleEscrow
 * @notice Escrow contract for ChainDeed — shown to users as "Digital Payment Hold"
 * @dev Polygon PoS optimized — uses block.timestamp for timelocks (~2s block time)
 */
contract SimpleEscrow is ReentrancyGuard {
    enum EscrowState {
        AWAITING_PAYMENT,
        AWAITING_DELIVERY,
        IN_DISPUTE,
        COMPLETE,
        REFUNDED
    }

    address public immutable buyer;
    address public immutable seller;
    address public immutable arbiter;

    uint256 public immutable depositAmount;  // in wei (MATIC)
    uint256 public immutable closingTimestamp; // auto-refund deadline

    EscrowState public state;

    bool public buyerApproved;
    bool public sellerApproved;
    bool public arbiterApproved;

    uint256 public depositedAt;

    // Events (plain-English names for frontend)
    event FundsDeposited(address indexed buyer, uint256 amount, uint256 timestamp);
    event PartyApproved(address indexed party, string role);
    event FundsReleased(address indexed seller, uint256 amount);
    event FundsRefunded(address indexed buyer, uint256 amount);
    event DisputeRaised(address indexed raisedBy);
    event DisputeResolved(bool releasedToSeller);

    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only buyer can call this");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call this");
        _;
    }

    modifier onlyArbiter() {
        require(msg.sender == arbiter, "Only arbiter can call this");
        _;
    }

    modifier onlyParties() {
        require(
            msg.sender == buyer || msg.sender == seller || msg.sender == arbiter,
            "Only transaction parties can call this"
        );
        _;
    }

    modifier inState(EscrowState _state) {
        require(state == _state, "Invalid state for this action");
        _;
    }

    constructor(
        address _buyer,
        address _seller,
        address _arbiter,
        uint256 _depositAmount,
        uint256 _closingTimestamp
    ) {
        require(_buyer != address(0) && _seller != address(0) && _arbiter != address(0), "Invalid address");
        require(_depositAmount > 0, "Deposit must be greater than 0");
        require(_closingTimestamp > block.timestamp, "Closing date must be in the future");
        require(_buyer != _seller, "Buyer and seller must be different");

        buyer = _buyer;
        seller = _seller;
        arbiter = _arbiter;
        depositAmount = _depositAmount;
        closingTimestamp = _closingTimestamp;
        state = EscrowState.AWAITING_PAYMENT;
    }

    /**
     * @notice Buyer deposits funds into escrow
     * @dev User-facing: "Place your funds in secure hold"
     */
    function deposit() external payable onlyBuyer inState(EscrowState.AWAITING_PAYMENT) {
        require(msg.value == depositAmount, "Must deposit exact amount");
        depositedAt = block.timestamp;
        state = EscrowState.AWAITING_DELIVERY;
        emit FundsDeposited(buyer, msg.value, block.timestamp);
    }

    /**
     * @notice Each party calls this to approve the transaction
     * @dev User-facing: "Confirm you agree to release funds"
     */
    function approve() external onlyParties inState(EscrowState.AWAITING_DELIVERY) {
        if (msg.sender == buyer) {
            buyerApproved = true;
            emit PartyApproved(buyer, "buyer");
        } else if (msg.sender == seller) {
            sellerApproved = true;
            emit PartyApproved(seller, "seller");
        } else if (msg.sender == arbiter) {
            arbiterApproved = true;
            emit PartyApproved(arbiter, "arbiter");
        }

        // 3-of-3 multisig: all three must approve
        if (buyerApproved && sellerApproved && arbiterApproved) {
            _releaseFunds();
        }
    }

    /**
     * @notice Raises a dispute, freezing funds
     * @dev User-facing: "Report an issue with this transaction"
     */
    function raiseDispute() external onlyParties inState(EscrowState.AWAITING_DELIVERY) {
        state = EscrowState.IN_DISPUTE;
        emit DisputeRaised(msg.sender);
    }

    /**
     * @notice Arbiter resolves dispute
     * @param releaseToSeller if true, funds go to seller; if false, refund to buyer
     */
    function resolveDispute(bool releaseToSeller) external onlyArbiter inState(EscrowState.IN_DISPUTE) nonReentrant {
        if (releaseToSeller) {
            _releaseFunds();
        } else {
            _refundBuyer();
        }
        emit DisputeResolved(releaseToSeller);
    }

    /**
     * @notice Auto-refund buyer if closing deadline passes without completion
     * @dev User-facing: "Request automatic refund after deadline"
     */
    function claimRefundAfterDeadline() external onlyBuyer nonReentrant {
        require(
            state == EscrowState.AWAITING_DELIVERY,
            "Can only refund from awaiting delivery state"
        );
        require(block.timestamp > closingTimestamp, "Closing deadline has not passed yet");
        _refundBuyer();
    }

    function _releaseFunds() internal nonReentrant {
        state = EscrowState.COMPLETE;
        uint256 amount = address(this).balance;
        (bool success, ) = seller.call{value: amount}("");
        require(success, "Transfer to seller failed");
        emit FundsReleased(seller, amount);
    }

    function _refundBuyer() internal {
        state = EscrowState.REFUNDED;
        uint256 amount = address(this).balance;
        (bool success, ) = buyer.call{value: amount}("");
        require(success, "Refund to buyer failed");
        emit FundsRefunded(buyer, amount);
    }

    function getStatus() external view returns (
        EscrowState _state,
        uint256 _balance,
        bool _buyerApproved,
        bool _sellerApproved,
        bool _arbiterApproved,
        uint256 _closingTimestamp
    ) {
        return (
            state,
            address(this).balance,
            buyerApproved,
            sellerApproved,
            arbiterApproved,
            closingTimestamp
        );
    }

    receive() external payable {}
}
