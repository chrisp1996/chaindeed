// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./SimpleEscrow.sol";

/**
 * @title DisputeResolution
 * @notice 3-person arbitration panel for escrow disputes
 * @dev User-facing: "Transaction Dispute Review"
 */
contract DisputeResolution is ReentrancyGuard {
    address public immutable escrowContract;
    address[3] public panel; // 3 arbiters

    mapping(address => bool) public hasVoted;
    mapping(address => bool) public voteRelease; // true = release to seller
    uint256 public votesForRelease;
    uint256 public votesForRefund;
    bool public resolved;

    event PanelVoted(address indexed arbiter, bool releaseToSeller);
    event DisputeResolved(bool releasedToSeller, uint256 votesFor, uint256 votesAgainst);

    constructor(
        address _escrowContract,
        address[3] memory _panel
    ) {
        escrowContract = _escrowContract;
        panel = _panel;
    }

    modifier onlyPanel() {
        require(
            msg.sender == panel[0] || msg.sender == panel[1] || msg.sender == panel[2],
            "Only arbitration panel can vote"
        );
        _;
    }

    function vote(bool releaseToSeller) external onlyPanel {
        require(!hasVoted[msg.sender], "Already voted");
        require(!resolved, "Dispute already resolved");

        hasVoted[msg.sender] = true;
        voteRelease[msg.sender] = releaseToSeller;

        if (releaseToSeller) {
            votesForRelease++;
        } else {
            votesForRefund++;
        }

        emit PanelVoted(msg.sender, releaseToSeller);

        // 2-of-3 majority
        if (votesForRelease >= 2) {
            resolved = true;
            SimpleEscrow(payable(escrowContract)).resolveDispute(true);
            emit DisputeResolved(true, votesForRelease, votesForRefund);
        } else if (votesForRefund >= 2) {
            resolved = true;
            SimpleEscrow(payable(escrowContract)).resolveDispute(false);
            emit DisputeResolved(false, votesForRelease, votesForRefund);
        }
    }

    function getStatus() external view returns (
        bool _resolved,
        uint256 _votesForRelease,
        uint256 _votesForRefund,
        bool[3] memory _panelVoted
    ) {
        return (
            resolved,
            votesForRelease,
            votesForRefund,
            [hasVoted[panel[0]], hasVoted[panel[1]], hasVoted[panel[2]]]
        );
    }
}
