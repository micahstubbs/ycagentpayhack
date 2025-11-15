// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract InvoiceNFT is ERC721, Ownable {
    struct Invoice {
        address debtor;
        uint256 amount;
        uint256 dueDate;
        bool paid;
    }

    uint256 private _tokenIdCounter;
    mapping(uint256 => Invoice) public invoices;

    event InvoiceMinted(
        uint256 indexed tokenId,
        address indexed owner,
        address debtor,
        uint256 amount,
        uint256 dueDate
    );

    event InvoicePaid(uint256 indexed tokenId, uint256 amount);

    constructor() ERC721("InvoiceNFT", "INVOICE") Ownable(msg.sender) {}

    function mint(
        address to,
        address debtor,
        uint256 amount,
        uint256 dueDate
    ) external returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(dueDate > block.timestamp, "Due date must be in the future");

        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);

        invoices[tokenId] = Invoice({
            debtor: debtor,
            amount: amount,
            dueDate: dueDate,
            paid: false
        });

        emit InvoiceMinted(tokenId, to, debtor, amount, dueDate);
        return tokenId;
    }

    function payInvoice(uint256 tokenId) external payable {
        require(_ownerOf(tokenId) != address(0), "Invoice does not exist");
        Invoice storage invoice = invoices[tokenId];
        require(!invoice.paid, "Invoice already paid");
        require(msg.value == invoice.amount, "Incorrect payment amount");

        invoice.paid = true;
        emit InvoicePaid(tokenId, msg.value);

        // Transfer payment to invoice owner
        address owner = ownerOf(tokenId);
        payable(owner).transfer(msg.value);
    }

    function getInvoice(uint256 tokenId)
        external
        view
        returns (Invoice memory)
    {
        require(_ownerOf(tokenId) != address(0), "Invoice does not exist");
        return invoices[tokenId];
    }
}
