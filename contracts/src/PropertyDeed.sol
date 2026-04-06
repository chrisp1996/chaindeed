// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PropertyDeed
 * @notice Digital deed registry — shown to users as "Digital Deed Record"
 * @dev ERC-721 with transfer restrictions: can only transfer via RealEstatePurchase contract
 */
contract PropertyDeed is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Only authorized purchase contracts can mint/transfer
    mapping(address => bool) public authorizedContracts;

    struct DeedRecord {
        string propertyAddress;
        string apn;          // Assessor Parcel Number
        string state;
        uint256 mintedAt;
        uint256[] transferHistory; // timestamps of transfers
        address[] previousOwners;
        string[] ipfsCids;   // array of IPFS CIDs (deed, title, etc.)
    }

    mapping(uint256 => DeedRecord) public deedRecords;

    event DeedMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string propertyAddress,
        string apn,
        string ipfsCid
    );

    event DeedTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );

    event ContractAuthorized(address indexed contractAddress);
    event ContractDeauthorized(address indexed contractAddress);

    modifier onlyAuthorized() {
        require(
            authorizedContracts[msg.sender] || msg.sender == owner(),
            "Not authorized to mint/transfer deeds"
        );
        _;
    }

    constructor() ERC721("ChainDeed Property Record", "DEED") Ownable(msg.sender) {}

    /**
     * @notice Register a property deed digitally
     * @dev User-facing: "Register your deed digitally"
     */
    function mintDeed(
        address propertyOwner,
        string memory propertyAddress,
        string memory apn,
        string memory state,
        string memory ipfsCid
    ) external onlyAuthorized returns (uint256) {
        uint256 tokenId = _nextTokenId++;

        _safeMint(propertyOwner, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", ipfsCid)));

        deedRecords[tokenId] = DeedRecord({
            propertyAddress: propertyAddress,
            apn: apn,
            state: state,
            mintedAt: block.timestamp,
            transferHistory: new uint256[](0),
            previousOwners: new address[](0),
            ipfsCids: new string[](0)
        });
        deedRecords[tokenId].ipfsCids.push(ipfsCid);

        emit DeedMinted(tokenId, propertyOwner, propertyAddress, apn, ipfsCid);

        return tokenId;
    }

    /**
     * @notice Add a document CID to the deed record
     */
    function addDocument(uint256 tokenId, string memory ipfsCid) external onlyAuthorized {
        deedRecords[tokenId].ipfsCids.push(ipfsCid);
    }

    /**
     * @notice Override transfer to record history and restrict to authorized contracts
     */
    function transferFrom(address from, address to, uint256 tokenId) public override(ERC721, IERC721) {
        require(
            authorizedContracts[msg.sender] || msg.sender == owner(),
            "Deed transfers must go through a ChainDeed purchase agreement"
        );

        deedRecords[tokenId].transferHistory.push(block.timestamp);
        deedRecords[tokenId].previousOwners.push(from);

        super.transferFrom(from, to, tokenId);
        emit DeedTransferred(tokenId, from, to, block.timestamp);
    }

    function authorizeContract(address contractAddress) external onlyOwner {
        authorizedContracts[contractAddress] = true;
        emit ContractAuthorized(contractAddress);
    }

    function deauthorizeContract(address contractAddress) external onlyOwner {
        authorizedContracts[contractAddress] = false;
        emit ContractDeauthorized(contractAddress);
    }

    function getDeedRecord(uint256 tokenId) external view returns (DeedRecord memory) {
        return deedRecords[tokenId];
    }

    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
